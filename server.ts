import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  db,
  initProductionDatabase,
  MODULES,
  getUserEffectivePermissions,
  executeModuleRpc,
  PRODUCTION_SCHEMA_SQL,
  getMaintenanceState,
  setMaintenanceState,
} from './src/db/productionDb.ts';
import {
  writePostgresHelperFiles,
  autoProvisionPostgresDatabase,
  syncSqliteTablesToPostgres,
  currentPostgresStatus,
  POSTGRES_PRODUCTION_SCHEMA_SQL,
} from './src/db/postgresAutoSetup.ts';

// Initialize the "production" database and all 42 tables immediately on server boot
initProductionDatabase();
writePostgresHelperFiles();
autoProvisionPostgresDatabase(db).catch(() => {});

// Extract the 16 exact HTML documents from the uploaded reference file
const SOURCE_ASSET_PATH = path.resolve(
  process.cwd(),
  'public/assets/aistudio/Paste_November_13__2026_-_10_37AM_afd29993'
);

let extractedHtmlDocs: string[] = [];

function loadDepartmentHtmlDocs() {
  if (extractedHtmlDocs.length > 0) return extractedHtmlDocs;
  if (!fs.existsSync(SOURCE_ASSET_PATH)) {
    return [];
  }
  const raw = fs.readFileSync(SOURCE_ASSET_PATH, 'utf8');
  const indices: number[] = [];
  const regex = /<!DOCTYPE html>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(raw)) !== null) {
    indices.push(match.index);
  }
  const docs: string[] = [];
  for (let i = 0; i < indices.length; i++) {
    const start = indices[i];
    const end = i + 1 < indices.length ? indices[i + 1] : raw.length;
    let slice = raw.slice(start, end);
    const closeHtmlIdx = slice.lastIndexOf('</html>');
    if (closeHtmlIdx !== -1) {
      slice = slice.slice(0, closeHtmlIdx + 7);
    }
    docs.push(slice.trim());
  }
  extractedHtmlDocs = docs;
  return extractedHtmlDocs;
}

loadDepartmentHtmlDocs();

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  app.get('/favicon.ico', (_req, res) => {
    res.status(204).end();
  });

  // ==========================================================================
  // 1. AUTHENTICATION, SESSION & MAINTENANCE MODE ROUTES
  // ==========================================================================
  app.get('/api/system/maintenance', (_req, res) => {
    res.json({
      ok: true,
      maintenance: getMaintenanceState(),
    });
  });

  app.post('/api/admin/maintenance', (req, res) => {
    const { userId, active, message } = req.body || {};
    const adminRow = db
      .prepare(
        `SELECT u.id, u.username, r.name as role_name, r.is_admin
         FROM users u
         JOIN roles r ON r.id = u.role_id
         WHERE u.id = ?`
      )
      .get(Number(userId || 0)) as any;

    const isAdmin =
      Boolean(adminRow?.is_admin) ||
      String(adminRow?.username || '').toLowerCase() === 'admin' ||
      String(adminRow?.role_name || '').toLowerCase() === 'super admin';

    if (!isAdmin) {
      res.status(403).json({ ok: false, error: 'Only Admin can change Maintenance Mode.' });
      return;
    }

    const updated = setMaintenanceState(Boolean(active), message, adminRow?.username || 'admin');
    db.prepare(`
      INSERT INTO audit_logs (user_id, username, module_key, action_name, details)
      VALUES (?, ?, 'system', ?, ?)
    `).run(
      adminRow.id,
      adminRow.username,
      updated.active ? 'maintenance_enabled' : 'maintenance_disabled',
      updated.active ? `Maintenance ON: ${updated.message}` : 'Maintenance Mode turned OFF'
    );
    syncSqliteTablesToPostgres(db, ['system_settings', 'audit_logs']).catch(() => {});

    res.json({
      ok: true,
      maintenance: updated,
    });
  });

  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password) {
      res.status(400).json({ ok: false, error: 'Username and password are required.' });
      return;
    }

    const user = db.prepare(`
      SELECT u.*, r.name as role_name, r.is_admin
      FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE LOWER(u.username) = LOWER(?) AND u.password_hash = ?
    `).get(String(username).trim(), String(password)) as any;

    if (!user) {
      res.status(401).json({ ok: false, error: 'Invalid username or password.' });
      return;
    }

    if (!user.is_active) {
      res.status(403).json({ ok: false, error: 'Your user account is disabled. Contact the Mill ERP Administrator.' });
      return;
    }

    const isUserAdmin =
      Boolean(user.is_admin) ||
      String(user.username || '').toLowerCase() === 'admin' ||
      String(user.role_name || '').toLowerCase() === 'super admin';

    const maintenance = getMaintenanceState();
    if (maintenance.active && !isUserAdmin) {
      res.status(503).json({
        ok: false,
        maintenance: true,
        error: maintenance.message || 'Server is under maintenance. We will be back shortly.',
      });
      return;
    }

    db.prepare("UPDATE users SET last_login = datetime('now') WHERE id = ?").run(user.id);
    db.prepare(`
      INSERT INTO audit_logs (user_id, username, module_key, action_name, details)
      VALUES (?, ?, 'auth', 'user_login', ?)
    `).run(user.id, user.username, `Logged in as ${user.role_name}`);
    syncSqliteTablesToPostgres(db, ['users', 'audit_logs']).catch(() => {});

    const permissions = getUserEffectivePermissions(user.id);

    res.json({
      ok: true,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        employeeCode: user.employee_code,
        department: user.department,
        roleId: user.role_id,
        roleName: user.role_name,
        isAdmin: isUserAdmin,
      },
      permissions,
      maintenance,
    });
  });

  app.get('/api/auth/session/:userId', (req, res) => {
    const userId = Number(req.params.userId);
    const user = db.prepare(`
      SELECT u.*, r.name as role_name, r.is_admin
      FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE u.id = ? AND u.is_active = 1
    `).get(userId) as any;

    if (!user) {
      res.status(404).json({ ok: false, error: 'User session not found.' });
      return;
    }

    const isUserAdmin =
      Boolean(user.is_admin) ||
      String(user.username || '').toLowerCase() === 'admin' ||
      String(user.role_name || '').toLowerCase() === 'super admin';

    const maintenance = getMaintenanceState();
    if (maintenance.active && !isUserAdmin) {
      res.status(503).json({
        ok: false,
        maintenance: true,
        error: maintenance.message || 'Server is under maintenance. We will be back shortly.',
        maintenanceState: maintenance,
      });
      return;
    }

    res.json({
      ok: true,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        employeeCode: user.employee_code,
        department: user.department,
        roleId: user.role_id,
        roleName: user.role_name,
        isAdmin: isUserAdmin,
      },
      permissions: getUserEffectivePermissions(user.id),
      maintenance,
    });
  });

  // ==========================================================================
  // 2. ADMIN: USERS, ROLES & PERMISSIONS ROUTES
  // ==========================================================================
  app.get('/api/admin/overview', (_req, res) => {
    const users = db.prepare(`
      SELECT u.id, u.username, u.full_name as fullName, u.employee_code as employeeCode,
             u.department, u.role_id as roleId, r.name as roleName, r.is_admin as isAdmin,
             u.is_active as isActive, u.last_login as lastLogin, u.created_at as createdAt
      FROM users u
      JOIN roles r ON r.id = u.role_id
      ORDER BY u.id ASC
    `).all() as any[];

    const roles = db.prepare('SELECT * FROM roles ORDER BY id ASC').all() as any[];
    const rolePermissions = db.prepare('SELECT * FROM role_permissions').all() as any[];
    const userPermissions = db.prepare('SELECT * FROM user_permissions').all() as any[];
    const auditLogs = db.prepare('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 60').all() as any[];

    res.json({
      ok: true,
      users: users.map((u) => ({
        ...u,
        isAdmin: Boolean(u.isAdmin),
        isActive: Boolean(u.isActive),
        effectivePermissions: getUserEffectivePermissions(u.id),
      })),
      roles: roles.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        isAdmin: Boolean(r.is_admin),
        permissions: MODULES.map((m) => {
          const rp = rolePermissions.find((p) => p.role_id === r.id && p.module_key === m.key);
          return {
            moduleKey: m.key,
            moduleName: m.name,
            category: m.category,
            canView: r.is_admin ? true : Boolean(rp?.can_view),
            canCreate: r.is_admin ? true : Boolean(rp?.can_create),
            canEdit: r.is_admin ? true : Boolean(rp?.can_edit),
            canDelete: r.is_admin ? true : Boolean(rp?.can_delete),
            canReport: r.is_admin ? true : Boolean(rp?.can_report),
          };
        }),
      })),
      userPermissions,
      auditLogs,
      modules: MODULES,
    });
  });

  app.post('/api/admin/users', (req, res) => {
    const { username, password, fullName, employeeCode, department, roleId, isActive } = req.body || {};
    if (!username || !password || !fullName || !roleId) {
      res.status(400).json({ ok: false, error: 'Username, password, full name, and role are required.' });
      return;
    }
    try {
      const info = db.prepare(`
        INSERT INTO users (username, password_hash, full_name, employee_code, department, role_id, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        String(username).trim(),
        String(password),
        String(fullName).trim(),
        String(employeeCode || '').trim(),
        String(department || 'All Departments').trim(),
        Number(roleId),
        isActive === false ? 0 : 1
      );
      syncSqliteTablesToPostgres(db, ['users', 'user_permissions']).catch(() => {});
      res.json({ ok: true, userId: info.lastInsertRowid });
    } catch (err: any) {
      res.status(400).json({ ok: false, error: err.message || 'Could not create user.' });
    }
  });

  app.put('/api/admin/users/:id', (req, res) => {
    const userId = Number(req.params.id);
    const { fullName, employeeCode, department, roleId, isActive, password } = req.body || {};
    try {
      db.prepare(`
        UPDATE users
        SET full_name = ?, employee_code = ?, department = ?, role_id = ?, is_active = ?
        WHERE id = ?
      `).run(
        String(fullName || ''),
        String(employeeCode || ''),
        String(department || ''),
        Number(roleId),
        isActive ? 1 : 0,
        userId
      );
      if (password && String(password).trim().length > 0) {
        db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(String(password).trim(), userId);
      }
      syncSqliteTablesToPostgres(db, ['users']).catch(() => {});
      res.json({ ok: true });
    } catch (err: any) {
      res.status(400).json({ ok: false, error: err.message });
    }
  });

  app.delete('/api/admin/users/:id', (req, res) => {
    const userId = Number(req.params.id);
    if (userId === 1) {
      res.status(400).json({ ok: false, error: 'Primary Super Admin user cannot be deleted.' });
      return;
    }
    db.prepare('DELETE FROM user_permissions WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    syncSqliteTablesToPostgres(db, ['users', 'user_permissions']).catch(() => {});
    res.json({ ok: true });
  });

  app.put('/api/admin/users/:id/permissions', (req, res) => {
    const userId = Number(req.params.id);
    const { permissions } = req.body || {};
    if (!Array.isArray(permissions)) {
      res.status(400).json({ ok: false, error: 'permissions array required' });
      return;
    }
    const upsert = db.prepare(`
      INSERT INTO user_permissions (user_id, module_key, override_mode, can_view, can_create, can_edit, can_delete, can_report)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, module_key) DO UPDATE SET
        override_mode = excluded.override_mode,
        can_view = excluded.can_view,
        can_create = excluded.can_create,
        can_edit = excluded.can_edit,
        can_delete = excluded.can_delete,
        can_report = excluded.can_report
    `);

    const tx = db.transaction((items: any[]) => {
      for (const p of items) {
        upsert.run(
          userId,
          p.moduleKey,
          p.overrideMode || 'inherit',
          p.canView ? 1 : 0,
          p.canCreate ? 1 : 0,
          p.canEdit ? 1 : 0,
          p.canDelete ? 1 : 0,
          p.canReport ? 1 : 0
        );
      }
    });
    tx(permissions);
    syncSqliteTablesToPostgres(db, ['user_permissions']).catch(() => {});
    res.json({ ok: true, effectivePermissions: getUserEffectivePermissions(userId) });
  });

  app.post('/api/admin/roles', (req, res) => {
    const { name, description, isAdmin } = req.body || {};
    if (!name) {
      res.status(400).json({ ok: false, error: 'Role name is required.' });
      return;
    }
    try {
      const info = db.prepare('INSERT INTO roles (name, description, is_admin) VALUES (?, ?, ?)').run(
        String(name).trim(),
        String(description || '').trim(),
        isAdmin ? 1 : 0
      );
      const roleId = Number(info.lastInsertRowid);
      const insertPerm = db.prepare(`
        INSERT INTO role_permissions (role_id, module_key, can_view, can_create, can_edit, can_delete, can_report)
        VALUES (?, ?, 1, 1, 0, 0, 1)
      `);
      for (const m of MODULES) {
        insertPerm.run(roleId, m.key);
      }
      syncSqliteTablesToPostgres(db, ['roles', 'role_permissions']).catch(() => {});
      res.json({ ok: true, roleId });
    } catch (err: any) {
      res.status(400).json({ ok: false, error: err.message });
    }
  });

  app.put('/api/admin/roles/:id/permissions', (req, res) => {
    const roleId = Number(req.params.id);
    const { permissions } = req.body || {};
    if (!Array.isArray(permissions)) {
      res.status(400).json({ ok: false, error: 'permissions array required' });
      return;
    }
    const upsert = db.prepare(`
      INSERT INTO role_permissions (role_id, module_key, can_view, can_create, can_edit, can_delete, can_report)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(role_id, module_key) DO UPDATE SET
        can_view = excluded.can_view,
        can_create = excluded.can_create,
        can_edit = excluded.can_edit,
        can_delete = excluded.can_delete,
        can_report = excluded.can_report
    `);
    const tx = db.transaction((items: any[]) => {
      for (const p of items) {
        upsert.run(
          roleId,
          p.moduleKey,
          p.canView ? 1 : 0,
          p.canCreate ? 1 : 0,
          p.canEdit ? 1 : 0,
          p.canDelete ? 1 : 0,
          p.canReport ? 1 : 0
        );
      }
    });
    tx(permissions);
    syncSqliteTablesToPostgres(db, ['role_permissions']).catch(() => {});
    res.json({ ok: true });
  });

  // ==========================================================================
  // 3. DATABASE ("production") LIVE INSPECTOR & SQL SCHEMA EXPORT
  // ==========================================================================
  app.get('/api/admin/database/tables', (_req, res) => {
    const tables = db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name ASC
    `).all() as { name: string }[];

    const summary = tables.map((t) => {
      const countRow = db.prepare(`SELECT COUNT(*) as c FROM "${t.name}"`).get() as { c: number };
      const cols = db.prepare(`PRAGMA table_info("${t.name}")`).all() as any[];
      const mod = MODULES.find((m) => m.tables.includes(t.name));
      return {
        tableName: t.name,
        rowCount: countRow.c,
        columns: cols.map((c) => ({ name: c.name, type: c.type, pk: Boolean(c.pk) })),
        moduleKey: mod?.key || 'system_auth',
        moduleName: mod?.name || 'System Auth & RBAC',
      };
    });

    res.json({
      ok: true,
      databaseName: 'production',
      databaseEngine: currentPostgresStatus.connected
        ? `PostgreSQL (${currentPostgresStatus.host}:${currentPostgresStatus.port}) -> production`
        : 'SQLite 3 + PostgreSQL Auto-Provisioner Ready',
      tableCount: summary.length,
      tables: summary,
      schemaSql: POSTGRES_PRODUCTION_SCHEMA_SQL,
      sqliteSchemaSql: PRODUCTION_SCHEMA_SQL,
      postgresStatus: currentPostgresStatus,
    });
  });

  app.post('/api/admin/postgres/provision', async (req, res) => {
    const { host, port, user, password } = req.body || {};
    const status = await autoProvisionPostgresDatabase(db, {
      host: host || '127.0.0.1',
      port: Number(port || 5432),
      user: user || 'postgres',
      password: password || '',
    });
    res.json({
      ok: status.connected,
      status,
    });
  });

  app.get('/api/admin/database/tables/:tableName', (req, res) => {
    const tableName = String(req.params.tableName).replace(/[^a-zA-Z0-9_]/g, '');
    const exists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(tableName);
    if (!exists) {
      res.status(404).json({ ok: false, error: 'Table not found in production database.' });
      return;
    }
    const columns = db.prepare(`PRAGMA table_info("${tableName}")`).all();
    const rows = db.prepare(`SELECT rowid as __rowid__, * FROM "${tableName}" ORDER BY rowid DESC LIMIT 200`).all();
    res.json({ ok: true, tableName, columns, rows });
  });

  // Helper to verify the requester is an Admin user
  const verifyIsAdminUser = (userId: any): boolean => {
    const id = Number(userId || 0);
    if (!id) return false;
    const row = db
      .prepare(
        `SELECT u.id, u.username, r.name as role_name, r.is_admin
         FROM users u
         JOIN roles r ON r.id = u.role_id
         WHERE u.id = ?`
      )
      .get(id) as any;
    if (!row) return false;
    return Boolean(row.is_admin) || row.username === 'admin' || String(row.role_name).toLowerCase() === 'super admin';
  };

  // Admin-only Row Edit for any table in "production" database
  app.put('/api/admin/database/tables/:tableName/rows', (req, res) => {
    const tableName = String(req.params.tableName).replace(/[^a-zA-Z0-9_]/g, '');
    const { userId, rowid, pkCol, pkVal, updatedFields } = req.body || {};

    if (!verifyIsAdminUser(userId)) {
      res.status(403).json({ ok: false, error: 'Only Admin is permitted to edit database rows.' });
      return;
    }

    const exists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(tableName);
    if (!exists) {
      res.status(404).json({ ok: false, error: 'Table not found in production database.' });
      return;
    }

    const columns = db.prepare(`PRAGMA table_info("${tableName}")`).all() as {
      name: string;
      type: string;
      pk: number;
    }[];
    const validCols = new Set(columns.map((c) => c.name));

    const entries = Object.entries(updatedFields || {}).filter(
      ([k]) => validCols.has(k) && k !== '__rowid__'
    );
    if (entries.length === 0) {
      res.status(400).json({ ok: false, error: 'No valid columns provided for update.' });
      return;
    }

    try {
      const setClause = entries.map(([k]) => `"${k}" = ?`).join(', ');
      const values = entries.map(([, v]) => (v === null || v === undefined ? null : v));

      if (rowid !== undefined && rowid !== null) {
        db.prepare(`UPDATE "${tableName}" SET ${setClause} WHERE rowid = ?`).run(...values, Number(rowid));
      } else if (pkCol && validCols.has(String(pkCol))) {
        db.prepare(`UPDATE "${tableName}" SET ${setClause} WHERE "${pkCol}" = ?`).run(...values, pkVal);
      } else {
        res.status(400).json({ ok: false, error: 'Row identifier (rowid or primary key) is required.' });
        return;
      }

      syncSqliteTablesToPostgres(db, [tableName]).catch(() => {});
      res.json({ ok: true });
    } catch (err: any) {
      res.status(400).json({ ok: false, error: err.message || 'Failed to update row.' });
    }
  });

  // Admin-only Row Delete for any table in "production" database
  app.delete('/api/admin/database/tables/:tableName/rows', (req, res) => {
    const tableName = String(req.params.tableName).replace(/[^a-zA-Z0-9_]/g, '');
    const { userId, rowid, pkCol, pkVal } = req.body || {};

    if (!verifyIsAdminUser(userId)) {
      res.status(403).json({ ok: false, error: 'Only Admin is permitted to delete database rows.' });
      return;
    }

    const exists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(tableName);
    if (!exists) {
      res.status(404).json({ ok: false, error: 'Table not found in production database.' });
      return;
    }

    if (tableName === 'users' && (Number(pkVal) === 1 || Number(rowid) === 1)) {
      res.status(400).json({ ok: false, error: 'Primary Super Admin account (id=1) cannot be deleted.' });
      return;
    }

    const columns = db.prepare(`PRAGMA table_info("${tableName}")`).all() as { name: string }[];
    const validCols = new Set(columns.map((c) => c.name));

    try {
      if (tableName === 'users' && pkVal !== undefined) {
        db.prepare('DELETE FROM user_permissions WHERE user_id = ?').run(pkVal);
      }
      if (tableName === 'roles' && pkVal !== undefined) {
        db.prepare('DELETE FROM role_permissions WHERE role_id = ?').run(pkVal);
      }

      if (rowid !== undefined && rowid !== null) {
        db.prepare(`DELETE FROM "${tableName}" WHERE rowid = ?`).run(Number(rowid));
      } else if (pkCol && validCols.has(String(pkCol))) {
        db.prepare(`DELETE FROM "${tableName}" WHERE "${pkCol}" = ?`).run(pkVal);
      } else {
        res.status(400).json({ ok: false, error: 'Row identifier (rowid or primary key) is required.' });
        return;
      }

      syncSqliteTablesToPostgres(db, [tableName]).catch(() => {});
      res.json({ ok: true });
    } catch (err: any) {
      res.status(400).json({ ok: false, error: err.message || 'Failed to delete row.' });
    }
  });

  // ==========================================================================
  // 3B. COMPREHENSIVE REPORT SECTION ENDPOINT (ALL TABLES, FIELDS & REPORT TYPES)
  // ==========================================================================
  app.get('/api/reports', (req, res) => {
    const userId = Number(req.query.userId || 1);
    const moduleFilter = String(req.query.moduleKey || 'all');
    const fromDate = String(req.query.fromDate || '');
    const toDate = String(req.query.toDate || '');
    const shiftFilter = String(req.query.shift || 'all').toLowerCase();

    const perms = getUserEffectivePermissions(userId);
    const reportableModules = MODULES.filter((m) => {
      const p = perms.find((perm) => perm.moduleKey === m.key);
      return Boolean(p?.canView && p?.canReport);
    });

    const unifiedRows: any[] = [];
    const departmentSummaries: any[] = [];
    const rawTablesByModule: Record<
      string,
      {
        tableName: string;
        moduleName: string;
        columns: { name: string; type: string; pk: boolean }[];
        rows: any[];
      }[]
    > = {};

    const normalizeShiftLabel = (raw: any): 'A' | 'B' | 'C' | 'General' => {
      const s = String(raw || '').trim().toUpperCase();
      if (s === 'A' || s === 'SHIFT A' || s.endsWith(' A')) return 'A';
      if (s === 'B' || s === 'SHIFT B' || s.endsWith(' B')) return 'B';
      if (s === 'C' || s === 'SHIFT C' || s.endsWith(' C')) return 'C';
      return 'General';
    };

    for (const mod of reportableModules) {
      if (moduleFilter !== 'all' && mod.key !== moduleFilter) continue;

      let modRecordCount = 0;
      let shiftACount = 0;
      let shiftBCount = 0;
      let shiftCCount = 0;
      let modTotalPrimary = 0;
      let modPrimaryUnit = 'Units';
      let modTotalSecondary = 0;
      let modSecondaryUnit = 'Cuts';
      let modBreakdownMins = 0;
      rawTablesByModule[mod.key] = [];

      for (const tbl of mod.tables) {
        try {
          const pragmaCols = (db.prepare(`PRAGMA table_info("${tbl}")`).all() as any[]).map((c) => ({
            name: String(c.name),
            type: String(c.type || 'TEXT'),
            pk: Boolean(c.pk),
          }));

          const rawDbRows = db.prepare(`SELECT * FROM "${tbl}" ORDER BY rowid DESC LIMIT 500`).all() as any[];
          const extraJsonKeys = new Set<string>();
          const enrichedRows: any[] = [];

          for (const r of rawDbRows) {
            const rowDate = String(
              r.entry_date ||
                r.shift_date ||
                r.record_date ||
                (r.started_at ? String(r.started_at).slice(0, 10) : '') ||
                (r.created_at ? String(r.created_at).slice(0, 10) : '') ||
                (r.updated_at ? String(r.updated_at).slice(0, 10) : '')
            );
            const rawShiftVal = String(r.shift || r.shift_name || '');
            const normShift = normalizeShiftLabel(rawShiftVal);

            const hasDateCol =
              r.entry_date !== undefined ||
              r.shift_date !== undefined ||
              r.record_date !== undefined ||
              r.started_at !== undefined;
            const hasShiftCol = r.shift !== undefined || r.shift_name !== undefined;

            if (fromDate && hasDateCol && rowDate && rowDate < fromDate) continue;
            if (toDate && hasDateCol && rowDate && rowDate > toDate) continue;
            if (shiftFilter !== 'all' && hasShiftCol) {
              if (normShift.toLowerCase() !== shiftFilter && !rawShiftVal.toLowerCase().includes(shiftFilter)) {
                continue;
              }
            }

            // Unpack JSON payload columns so every form field is visible in table/field reports
            const unpacked: Record<string, any> = {};
            for (const jsonCol of ['raw_json', 'payload_json', 'row_json']) {
              if (typeof r[jsonCol] === 'string' && r[jsonCol].trim().startsWith('{')) {
                try {
                  const parsed = JSON.parse(r[jsonCol]);
                  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                    for (const [k, v] of Object.entries(parsed)) {
                      if (v !== null && typeof v !== 'object') {
                        const fieldKey = r[k] !== undefined ? `json_${k}` : k;
                        unpacked[fieldKey] = v;
                        extraJsonKeys.add(fieldKey);
                      } else if (Array.isArray(v)) {
                        const summaryKey = `${k}_count`;
                        unpacked[summaryKey] = v.length;
                        extraJsonKeys.add(summaryKey);
                      }
                    }
                  }
                } catch {
                  // ignore malformed json
                }
              }
            }

            const mergedRow = { ...r, ...unpacked };
            enrichedRows.push(mergedRow);

            // Skip master/setting/option config tables from production KPI totals
            if (tbl.endsWith('_masters') || tbl.endsWith('_settings') || tbl.endsWith('_options')) {
              continue;
            }

            const machine = String(
              mergedRow.machine_no ||
                mergedRow.loom_no ||
                mergedRow.frame_no ||
                mergedRow.press_no ||
                mergedRow.machine ||
                mergedRow.loom ||
                mergedRow.round_no ||
                mergedRow.round_id ||
                mergedRow.po_number ||
                '-'
            );
            const quality = String(
              mergedRow.quality ||
                mergedRow.quality_count ||
                mergedRow.order_color ||
                mergedRow.grade_mix ||
                mergedRow.pile_type ||
                mergedRow.buyer_mark ||
                '-'
            );
            const operator = String(
              mergedRow.operator_name ||
                mergedRow.weaver_name ||
                mergedRow.supervisor ||
                mergedRow.operator ||
                mergedRow.weaver ||
                mergedRow.buyer_mark ||
                mergedRow.created_by ||
                mergedRow.updated_by ||
                '-'
            );
            const beamOrRound = String(
              mergedRow.beam_no ||
                mergedRow.round_no ||
                mergedRow.round_id ||
                mergedRow.bale_serial ||
                mergedRow.po_number ||
                mergedRow.group_id ||
                '-'
            );

            const safeNum = (v: any): number => {
              const n = typeof v === 'number' ? v : parseFloat(String(v ?? '0'));
              return Number.isFinite(n) ? n : 0;
            };

            let primaryVal = 0;
            let primaryLabel = '';
            let secondaryVal = 0;
            let secondaryLabel = '';
            let efficiencyVal = safeNum(mergedRow.efficiency || mergedRow.eff || 0);
            let breakdownVal = safeNum(mergedRow.duration_mins ?? mergedRow.down_mins ?? 0);

            if (mergedRow.production_mt !== undefined) {
              primaryVal = Number(mergedRow.production_mt || 0);
              primaryLabel = 'MT';
              modPrimaryUnit = 'MT';
            } else if (mergedRow.total_mt !== undefined) {
              primaryVal = Number(mergedRow.total_mt || 0);
              primaryLabel = 'MT';
              secondaryVal = Number(mergedRow.total_cuts || mergedRow.total_bags || 0);
              secondaryLabel = mergedRow.total_bags !== undefined ? 'Bags' : 'Cuts';
              modPrimaryUnit = 'MT';
              modSecondaryUnit = secondaryLabel;
            } else if (mergedRow.total_weight !== undefined) {
              primaryVal = Number(mergedRow.total_weight || 0);
              primaryLabel = 'MT/Kg';
              secondaryVal = Number(mergedRow.total_rolls || mergedRow.total_qty || 0);
              secondaryLabel = mergedRow.total_rolls !== undefined ? 'Rolls' : 'Qty';
              modPrimaryUnit = 'MT/Kg';
              modSecondaryUnit = secondaryLabel;
            } else if (mergedRow.net_wt_kg !== undefined) {
              primaryVal = Number(mergedRow.net_wt_kg || 0);
              primaryLabel = 'Net Kg';
              secondaryVal = Number(mergedRow.bags_per_bale || mergedRow.gross_wt_kg || 0);
              secondaryLabel = mergedRow.bags_per_bale !== undefined ? 'Bags' : 'Gross Kg';
              modPrimaryUnit = 'Net Kg';
              modSecondaryUnit = secondaryLabel;
            } else if (
              mergedRow.meters !== undefined ||
              mergedRow.net_meters !== undefined ||
              mergedRow.total_meters !== undefined ||
              mergedRow.verified_meters !== undefined ||
              mergedRow.actual_meters !== undefined ||
              mergedRow.produced_meters !== undefined
            ) {
              primaryVal = Number(
                mergedRow.meters ??
                  mergedRow.net_meters ??
                  mergedRow.total_meters ??
                  mergedRow.verified_meters ??
                  mergedRow.actual_meters ??
                  mergedRow.produced_meters ??
                  0
              );
              primaryLabel = 'Meters';
              secondaryVal = Number(
                mergedRow.cuts ??
                  mergedRow.total_cuts ??
                  mergedRow.weight_kg ??
                  mergedRow.target_meters ??
                  mergedRow.book_meters ??
                  0
              );
              secondaryLabel =
                mergedRow.cuts !== undefined || mergedRow.total_cuts !== undefined
                  ? 'Cuts'
                  : mergedRow.weight_kg !== undefined
                  ? 'Kg'
                  : 'Target Mtr';
              modPrimaryUnit = 'Meters';
              modSecondaryUnit = secondaryLabel;
            } else if (mergedRow.production_kg !== undefined) {
              primaryVal = Number(mergedRow.production_kg || 0);
              primaryLabel = 'Kg';
              secondaryVal = Number(mergedRow.doffs || mergedRow.efficiency || 0);
              secondaryLabel = mergedRow.doffs !== undefined ? 'Doffs' : '% Eff';
              modPrimaryUnit = 'Kg';
              modSecondaryUnit = secondaryLabel;
            } else if (mergedRow.weight_mt !== undefined) {
              primaryVal = Number(mergedRow.weight_mt || 0);
              primaryLabel = 'MT';
              secondaryVal = Number(
                mergedRow.rolls_count ?? mergedRow.cuts ?? mergedRow.bags ?? mergedRow.qty ?? 0
              );
              secondaryLabel =
                mergedRow.rolls_count !== undefined
                  ? 'Rolls'
                  : mergedRow.bags !== undefined
                  ? 'Bags'
                  : mergedRow.qty !== undefined
                  ? 'Qty'
                  : 'Cuts';
              modPrimaryUnit = 'MT';
              modSecondaryUnit = secondaryLabel;
            } else if (mergedRow.weight_kg !== undefined) {
              primaryVal = Number(mergedRow.weight_kg || 0);
              primaryLabel = 'Kg';
              secondaryVal = Number(mergedRow.rolls || mergedRow.cuts || 0);
              secondaryLabel = mergedRow.rolls !== undefined ? 'Rolls' : 'Cuts';
              modPrimaryUnit = 'Kg';
              modSecondaryUnit = secondaryLabel;
            } else if (mergedRow.closing_stock !== undefined) {
              primaryVal = Number(mergedRow.closing_stock || 0);
              primaryLabel = 'Stock MT';
              secondaryVal = Number(mergedRow.consumed_qty || mergedRow.received_qty || 0);
              secondaryLabel = 'Consumed MT';
            } else if (mergedRow.net_reading !== undefined || mergedRow.closing_reading !== undefined) {
              primaryVal = Number(mergedRow.net_reading ?? mergedRow.closing_reading ?? 0);
              primaryLabel = 'Meter Rdg';
              secondaryVal = Number(mergedRow.opening_reading || 0);
              secondaryLabel = 'Open Rdg';
            } else if (breakdownVal > 0) {
              primaryVal = breakdownVal;
              primaryLabel = 'Down Mins';
            }

            modRecordCount += 1;
            if (normShift === 'A') shiftACount += 1;
            else if (normShift === 'B') shiftBCount += 1;
            else if (normShift === 'C') shiftCCount += 1;

            primaryVal = safeNum(primaryVal);
            secondaryVal = safeNum(secondaryVal);
            efficiencyVal = safeNum(efficiencyVal);
            breakdownVal = safeNum(breakdownVal);

            if (primaryLabel !== 'Down Mins') {
              modTotalPrimary += primaryVal;
            }
            modTotalSecondary += secondaryVal;
            modBreakdownMins += breakdownVal;

            unifiedRows.push({
              id: `${tbl}-${r.id || modRecordCount}`,
              moduleKey: mod.key,
              department: mod.shortName,
              departmentFullName: mod.name,
              category: mod.category,
              tableName: tbl,
              date: rowDate || '-',
              shift: normShift,
              rawShift: rawShiftVal || 'General',
              machine,
              quality,
              operator,
              beamOrRound,
              primaryVal: Number(primaryVal.toFixed(2)),
              primaryLabel: primaryLabel || 'Val',
              secondaryVal: Number(secondaryVal.toFixed(2)),
              secondaryLabel: secondaryLabel || '',
              efficiencyVal: Number(efficiencyVal.toFixed(2)),
              breakdownMins: Number(breakdownVal.toFixed(2)),
              remarks: String(mergedRow.remarks || mergedRow.reason || mergedRow.status || ''),
              flatFields: mergedRow,
            });
          }

          const finalColumns = [
            ...pragmaCols.filter(
              (c) => c.name !== 'raw_json' && c.name !== 'payload_json' && c.name !== 'row_json'
            ),
            ...Array.from(extraJsonKeys).map((k) => ({ name: k, type: 'JSON_FIELD', pk: false })),
          ];

          rawTablesByModule[mod.key].push({
            tableName: tbl,
            moduleName: mod.shortName,
            columns: finalColumns,
            rows: enrichedRows,
          });
        } catch {
          // ignore table query errors
        }
      }

      departmentSummaries.push({
        moduleKey: mod.key,
        name: mod.name,
        shortName: mod.shortName,
        category: mod.category,
        recordCount: modRecordCount,
        shiftACount,
        shiftBCount,
        shiftCCount,
        totalPrimary: Number(modTotalPrimary.toFixed(2)),
        primaryUnit: modPrimaryUnit,
        totalSecondary: Number(modTotalSecondary.toFixed(2)),
        secondaryUnit: modSecondaryUnit,
        breakdownMins: Number(modBreakdownMins.toFixed(2)),
        tables: mod.tables,
      });
    }

    res.json({
      ok: true,
      serverHost: '192.168.1.6:3002',
      databaseName: 'production',
      reportableModules: reportableModules.map((m) => ({
        key: m.key,
        name: m.name,
        shortName: m.shortName,
        category: m.category,
        tables: m.tables,
      })),
      departmentSummaries,
      records: unifiedRows,
      rawTablesByModule,
    });
  });

  // ==========================================================================
  // 4. MODULE RPC EXECUTION ENDPOINT (`google.script.run` bridge target)
  // ==========================================================================
  app.post('/api/rpc/:moduleKey', (req, res) => {
    const { moduleKey } = req.params;
    const { fnName, args = [], userId = 1 } = req.body || {};

    const user = db
      .prepare(
        `SELECT u.id, u.username, u.full_name, r.name as role_name, r.is_admin
         FROM users u
         JOIN roles r ON r.id = u.role_id
         WHERE u.id = ?`
      )
      .get(Number(userId)) as any;

    const isUserAdmin =
      Boolean(user?.is_admin) ||
      String(user?.username || '').toLowerCase() === 'admin' ||
      String(user?.role_name || '').toLowerCase() === 'super admin';

    const maintenance = getMaintenanceState();
    if (maintenance.active && !isUserAdmin) {
      res.status(503).json({
        ok: false,
        maintenance: true,
        error: maintenance.message || 'Server is under maintenance. We will be back shortly.',
      });
      return;
    }

    const userContext = user
      ? { id: user.id, username: user.username, fullName: user.full_name }
      : { id: 1, username: 'admin', fullName: 'Administrator' };

    try {
      const result = executeModuleRpc(moduleKey, String(fnName), Array.isArray(args) ? args : [args], userContext);
      const mod = MODULES.find((m) => m.key === moduleKey);
      if (mod) {
        syncSqliteTablesToPostgres(db, [...mod.tables, 'audit_logs']).catch(() => {});
      }
      res.json({ ok: true, result });
    } catch (err: any) {
      res.status(403).json({ ok: false, error: err.message || 'RPC execution failed' });
    }
  });

  // ==========================================================================
  // 5. EXACT DEPARTMENT HTML RENDERER ("Same As It Is" + SSO + DB Bridge)
  // ==========================================================================
  app.get('/api/modules/:moduleKey/render', (req, res) => {
    const { moduleKey } = req.params;
    const userId = Number(req.query.userId || 1);

    const mod = MODULES.find((m) => m.key === moduleKey);
    if (!mod) {
      res.status(404).send('Module not found');
      return;
    }

    const user = db.prepare(`
      SELECT u.id, u.username, u.full_name, r.name as role_name, r.is_admin
      FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE u.id = ?
    `).get(userId) as any;

    const isUserAdmin =
      Boolean(user?.is_admin) ||
      String(user?.username || '').toLowerCase() === 'admin' ||
      String(user?.role_name || '').toLowerCase() === 'super admin';

    const maintenance = getMaintenanceState();
    if (maintenance.active && !isUserAdmin) {
      res.status(503).send(`
        <!DOCTYPE html>
        <html>
          <body style="font-family: 'Inter', system-ui, sans-serif; padding: 4rem 2rem; text-align: center; color: #1E1B4B; background: #FFF7ED;">
            <script>
              try {
                window.parent.postMessage({ type: 'BJM_MAINTENANCE_ACTIVE', message: ${JSON.stringify(maintenance.message)} }, '*');
              } catch (e) {}
            </script>
            <h2 style="color: #C2410C; margin-bottom: 0.5rem;">Server Under Maintenance</h2>
            <p style="font-weight: 600;">${maintenance.message}</p>
          </body>
        </html>
      `);
      return;
    }

    const perms = getUserEffectivePermissions(user?.id || 1);
    const modPerm = perms.find((p) => p.moduleKey === moduleKey) || {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canReport: true,
    };

    if (!modPerm.canView) {
      res.status(403).send(`
        <!DOCTYPE html>
        <html>
          <body style="font-family: 'Inter', system-ui, sans-serif; padding: 3rem; text-align: center; color: #0F172A; background: #F8FAFC;">
            <h2>Access Restricted</h2>
            <p>Your account does not have View permission for ${mod.name}.</p>
          </body>
        </html>
      `);
      return;
    }

    const docs = loadDepartmentHtmlDocs();
    let rawHtml = docs[mod.docIndex] || '<!DOCTYPE html><html><body>Module HTML not found</body></html>';

    // Strip unwanted static helper/subtitle paragraphs from the department HTML
    const phrasesToStrip = [
      'Save this first for every shift',
      'Enter headcount for each category. Total is calculated automatically.',
      'Fill this in at the start of every shift.',
      'ERP · Log Book · Production · Report',
      'Add one row per quality. Use',
      'Filter by date and/or shift. Leave a field blank to include all.',
      'Fill in Date, Shift and Rotation of Staff first',
      'Enter each piece, then Save. Click',
      'A new table starts automatically whenever a new round begins.',
      'Type the bale number, press Enter, type the weight',
      'Fill this in first at the start of every round / shift.',
      'Select a machine to see its round-by-round log.',
      'Enter the physically measured production for a beam round here.',
      'Cumulative production (every Unit, Machine, Shift and Round combined)',
      'Total Loom is calculated automatically from Company + Contractor readings.',
      'Enter data for all machines across the 3 shifts.',
      'A digital copy of the register: for the selected date',
      'Filter Production data by date range and (optionally) machine number',
      'Fill in Date, Shift and Operator Name first',
      'Length Target, Start Meter and Beam No are tracked automatically.',
      'Cumulative V/L Beam Length reached so far for every round',
      'Every production entry, in log-book order.',
      'Filter Log Book and Production data by date range, shift, or operator.',
      'Enter the cumulative meter reading for each machine per shift',
      'Select a date range to see machine-wise production totals.',
    ];

    const bridgeScript = `
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'/>" />
<style>
  /* Preserve 100% Original Theme of all 16 Department Forms while hiding internal login, logout, helper text & individual report tabs */
  #page-login, #loginScreen, .login-box, .login-wrap, .login-card,
  .btn-logout, .logout-btn, #logoutBtn, button[onclick*="doLogout"], button[onclick*="logout"],
  p.hint, p.sub, p.subtext, #rp-generated, #beam-status, #cut-status, #lb-worker-info,
  #tab-report, #page-report, #tab-reports, section#report, div#report, section#tab-report, div#tab-report,
  [data-tab="report"], [data-tab="reports"], [data-t="rep"],
  button[onclick*="showMainTab('report')"],
  button[onclick*="showTab('report'"],
  button[onclick*="switchTab('report')"],
  div.navtab[onclick*="showTab('report')"],
  #rep, #view-rep, #tab-rep {
    display: none !important;
  }
  #app, #appScreen {
    display: block !important;
  }
</style>
<script>
(function() {
  window.__BJM_USER__ = ${JSON.stringify({
    id: user?.id || 1,
    username: user?.username || 'admin',
    fullName: user?.full_name || 'ANKANA',
    roleName: user?.role_name || 'Super Admin',
  })};
  window.__BJM_PERMS__ = ${JSON.stringify(modPerm)};
  window.__BJM_MODULE__ = ${JSON.stringify(mod.key)};
  var STRIP_PHRASES = ${JSON.stringify(phrasesToStrip)};

  function hideLoginLogoutAndReportTabs() {
    try {
      var authSelectors = [
        '#page-login', '#loginScreen', '.login-box', '.login-wrap', '.login-card',
        '.btn-logout', '.logout-btn', '#logoutBtn', 'button[onclick*="doLogout"]', 'button[onclick*="logout"]'
      ];
      for (var a = 0; a < authSelectors.length; a++) {
        var authEls = document.querySelectorAll(authSelectors[a]);
        for (var k = 0; k < authEls.length; k++) {
          authEls[k].style.setProperty('display', 'none', 'important');
        }
      }
      var appContainers = document.querySelectorAll('#app, #appScreen');
      for (var c = 0; c < appContainers.length; c++) {
        appContainers[c].classList.remove('hidden');
        appContainers[c].style.setProperty('display', 'block', 'important');
      }

      var reportSelectors = [
        '#tab-report', '#page-report', '#tab-reports', 'section#report', 'div#report',
        'section#tab-report', 'div#tab-report', '[data-tab="report"]', '[data-tab="reports"]',
        '[data-t="rep"]', '#rep', '#view-rep', '#tab-rep',
        'button[onclick*="showMainTab(\\'report\\')"]',
        'button[onclick*="showTab(\\'report\\'"]',
        'button[onclick*="switchTab(\\'report\\')"]',
        'div.navtab[onclick*="showTab(\\'report\\')"]'
      ];
      for (var s = 0; s < reportSelectors.length; s++) {
        var els = document.querySelectorAll(reportSelectors[s]);
        for (var i = 0; i < els.length; i++) {
          els[i].style.setProperty('display', 'none', 'important');
        }
      }

      var tabBtns = document.querySelectorAll('header button, .header button, .topbar button, nav button, .tabs button, .tab-bar button, .navtab, .tab-btn');
      for (var j = 0; j < tabBtns.length; j++) {
        var btn = tabBtns[j];
        var label = (btn.textContent || '').replace(/[^a-zA-Z]/g, '').trim().toLowerCase();
        if (label === 'report' || label === 'reports' || label === 'logout') {
          btn.style.setProperty('display', 'none', 'important');
        }
      }
    } catch (e) {}
  }

  function cleanUnwantedHelperTexts() {
    hideLoginLogoutAndReportTabs();
    try {
      var nodes = document.querySelectorAll('p, div.muted, span.muted, #rp-generated, #beam-status, #cut-status, #lb-worker-info');
      for (var i = 0; i < nodes.length; i++) {
        var el = nodes[i];
        if (el.children && el.children.length > 3) continue;
        var txt = (el.textContent || '').replace(/\\s+/g, ' ').trim();
        if (!txt) continue;
        if (
          txt.indexOf('Round undefined') !== -1 ||
          txt.indexOf('No running beam on Machine') !== -1 ||
          txt.indexOf('Report generated:') !== -1 ||
          txt.indexOf('Current open round:') !== -1 ||
          txt.indexOf('Worker: undefined') !== -1 ||
          txt.indexOf('Hours Worked: undefined') !== -1
        ) {
          el.textContent = '';
          el.style.display = 'none';
          continue;
        }
        for (var j = 0; j < STRIP_PHRASES.length; j++) {
          if (txt.indexOf(STRIP_PHRASES[j]) !== -1) {
            el.textContent = '';
            el.style.display = 'none';
            break;
          }
        }
      }
    } catch (e) {}
  }

  document.addEventListener('click', function() {
    setTimeout(hideLoginLogoutAndReportTabs, 10);
    setTimeout(hideLoginLogoutAndReportTabs, 80);
  }, true);

  // Non-blocking toast banner for native alert() calls inside iframe
  function showBridgeToast(message, isError) {
    try {
      var existing = document.getElementById('bjm-bridge-toast');
      if (existing) existing.remove();
      var div = document.createElement('div');
      div.id = 'bjm-bridge-toast';
      div.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:999999;max-width:420px;padding:12px 18px;border-radius:8px;font-family:Inter,system-ui,sans-serif;font-size:13px;font-weight:500;box-shadow:0 10px 25px rgba(15,23,42,0.12);color:' + (isError ? '#991B1B' : '#065F46') + ';border:1px solid ' + (isError ? '#FECACA' : '#A7F3D0') + ';background:' + (isError ? '#FEF2F2' : '#ECFDF5') + ';transition:opacity 0.25s ease;';
      div.textContent = String(message || '');
      document.body.appendChild(div);
      setTimeout(function() {
        if (div.parentNode) div.remove();
      }, 3800);
    } catch (e) {}
  }

  window.alert = function(msg) {
    showBridgeToast(msg, String(msg).toLowerCase().includes('error') || String(msg).toLowerCase().includes('denied'));
  };
  window.confirm = function() { return true; };

  // Build google.script.run chainable proxy connected to /api/rpc/:moduleKey
  function createRunner(successHandler, failureHandler) {
    return new Proxy({}, {
      get: function(_target, prop) {
        if (prop === 'withSuccessHandler') {
          return function(fn) { return createRunner(fn, failureHandler); };
        }
        if (prop === 'withFailureHandler') {
          return function(fn) { return createRunner(successHandler, fn); };
        }
        if (prop === 'withUserObject') {
          return function() { return createRunner(successHandler, failureHandler); };
        }
        return function() {
          var args = Array.prototype.slice.call(arguments);
          var fnName = String(prop);
          fetch('/api/rpc/' + window.__BJM_MODULE__, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fnName: fnName,
              args: args,
              userId: window.__BJM_USER__.id
            })
          })
          .then(function(r) { return r.json().then(function(d) { return { status: r.status, body: d }; }); })
          .then(function(res) {
            if (!res.body || res.body.ok === false) {
              var errMsg = (res.body && res.body.error) || 'Operation not permitted';
              if (res.body && res.body.maintenance) {
                try {
                  window.parent.postMessage({ type: 'BJM_MAINTENANCE_ACTIVE', message: errMsg }, '*');
                } catch (e) {}
              }
              showBridgeToast(errMsg, true);
              if (typeof failureHandler === 'function') {
                failureHandler(new Error(errMsg));
              }
              return;
            }
            if (typeof successHandler === 'function') {
              successHandler(res.body.result);
            }
            if (window.__BJM_MODULE__ === 'spinning' && fnName === 'saveProduction' && typeof window.loadProductionDashboard === 'function') {
              setTimeout(function() { try { window.loadProductionDashboard(); } catch (e) {} }, 80);
            }
            setTimeout(cleanUnwantedHelperTexts, 30);
          })
          .catch(function(err) {
            showBridgeToast(err.message || 'Network error', true);
            if (typeof failureHandler === 'function') {
              failureHandler(err);
            }
          });
        };
      }
    });
  }

  window.google = {
    script: {
      run: createRunner(null, null)
    }
  };

  // Auto-authenticate internal login screens (Carding, Spinning, Spreader)
  // and enforce module-level RBAC/User permissions in UI controls
  function applySsoAndPermissions() {
    cleanUnwantedHelperTexts();
    var modKey = window.__BJM_MODULE__;
    var user = window.__BJM_USER__;
    var perms = window.__BJM_PERMS__;
    var displayUserName = user.fullName || user.username || 'ANKANA';

    // 1. Carding SSO bypass
    if (modKey === 'carding') {
      var loginPage = document.getElementById('page-login');
      if (loginPage) loginPage.style.setProperty('display', 'none', 'important');
      var cardApp = document.getElementById('app') || document.getElementById('app-container') || document.getElementById('main-app');
      if (cardApp) cardApp.style.setProperty('display', 'block', 'important');
      if (!window.__BJM_CARD_INIT__ && typeof window.enterApp === 'function') {
        window.__BJM_CARD_INIT__ = true;
        try { window.enterApp(); } catch (e) {}
      }
    }

    // 2. Spinning SSO bypass (Doc 13 uses #loginScreen and #appScreen)
    if (modKey === 'spinning') {
      var spinLogin = document.getElementById('loginScreen');
      if (spinLogin) spinLogin.style.setProperty('display', 'none', 'important');
      var spinApp = document.getElementById('appScreen') || document.getElementById('mainApp');
      if (spinApp) {
        spinApp.classList.remove('hidden');
        spinApp.style.setProperty('display', 'block', 'important');
      }
      var welcomeUser = document.getElementById('welcomeUser');
      if (welcomeUser) welcomeUser.textContent = displayUserName;
      if (!window.__BJM_SPIN_INIT__ && typeof window.initDefaults === 'function') {
        window.__BJM_SPIN_INIT__ = true;
        try { window.initDefaults(); } catch (e) {}
      }
    }

    // 3. Spreader SSO bypass (Doc 14 uses #loginScreen, #appScreen with display:block, and string CURRENT_USER)
    if (modKey === 'spreader') {
      var spreadLogin = document.getElementById('loginScreen');
      if (spreadLogin) spreadLogin.style.setProperty('display', 'none', 'important');
      var spreadApp = document.getElementById('appScreen');
      if (spreadApp) {
        spreadApp.classList.remove('hidden');
        spreadApp.style.setProperty('display', 'block', 'important');
      }
      try {
        window.CURRENT_USER = displayUserName;
      } catch (e) {}
      var loggedUserEl = document.getElementById('loggedUser') || document.getElementById('userBadgeName');
      if (loggedUserEl) loggedUserEl.textContent = displayUserName;
      if (!window.__BJM_SPREAD_INIT__) {
        window.__BJM_SPREAD_INIT__ = true;
        if (typeof window.loadLogBookRecent === 'function') {
          try { window.loadLogBookRecent(); } catch (e) {}
        }
      }
    }

    // Enforce granular Create / Delete / Report button states
    if (!perms.canCreate) {
      var buttons = document.querySelectorAll('button, input[type="submit"]');
      buttons.forEach(function(btn) {
        var txt = (btn.textContent || btn.value || '').toLowerCase();
        if (txt.includes('save') || txt.includes('submit') || txt.includes('add entry')) {
          btn.disabled = true;
          btn.style.opacity = '0.45';
          btn.style.cursor = 'not-allowed';
          btn.title = 'Entry/Create permission is disabled for your user account';
        }
      });
    }
    try {
      window.doLogout = function() {};
    } catch (e) {}
  }

  var _cleanScheduled = false;
  var _isCleaning = false;
  function scheduleClean() {
    if (_cleanScheduled || _isCleaning) return;
    _cleanScheduled = true;
    setTimeout(function() {
      _cleanScheduled = false;
      _isCleaning = true;
      try { cleanUnwantedHelperTexts(); } finally { _isCleaning = false; }
    }, 60);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      cleanUnwantedHelperTexts();
      applySsoAndPermissions();
      setTimeout(applySsoAndPermissions, 40);
      setTimeout(applySsoAndPermissions, 250);
      try {
        if (document.body) {
          var obs = new MutationObserver(function() { scheduleClean(); });
          obs.observe(document.body, { childList: true, subtree: true });
        }
      } catch (e) {}
    });
  } else {
    cleanUnwantedHelperTexts();
    applySsoAndPermissions();
    setTimeout(applySsoAndPermissions, 40);
    setTimeout(applySsoAndPermissions, 250);
  }
})();
</script>
`;

    const injectedHtml = rawHtml.includes('</head>')
      ? rawHtml.replace('</head>', `${bridgeScript}</head>`)
      : rawHtml.includes('<head>')
      ? rawHtml.replace('<head>', `<head>${bridgeScript}`)
      : `${bridgeScript}${rawHtml}`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(injectedHtml);
  });

  // ==========================================================================
  // 6. VITE MIDDLEWARE (DEV) OR STATIC ASSETS (PROD)
  // ==========================================================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Primary port (3000 in AI Studio preview, or PORT env var on Ubuntu server)
  const primaryPort = Number(process.env.PORT || 3000);
  app.listen(primaryPort, '0.0.0.0', () => {
    console.log(`[Bally Jute Mill ERP] Server listening on http://0.0.0.0:${primaryPort}`);
  });

  // Also bind port 3002 simultaneously so local Ubuntu 24 deployment works out-of-the-box on port 3002
  const ubuntuTargetPort = Number(process.env.SECONDARY_PORT || 3002);
  if (ubuntuTargetPort !== primaryPort) {
    const secondServer = app.listen(ubuntuTargetPort, '0.0.0.0', () => {
      console.log(`[Bally Jute Mill ERP] Ubuntu 24 Dedicated Port listener active on http://0.0.0.0:${ubuntuTargetPort}`);
    });
    secondServer.on('error', () => {
      // Ignore if port 3002 is already bound by another process
    });
  }
}

startServer();
