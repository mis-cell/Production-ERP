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

  // ==========================================================================
  // 1. AUTHENTICATION & SESSION ROUTES
  // ==========================================================================
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
        isAdmin: Boolean(user.is_admin),
      },
      permissions,
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
        isAdmin: Boolean(user.is_admin),
      },
      permissions: getUserEffectivePermissions(user.id),
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
    const rows = db.prepare(`SELECT * FROM "${tableName}" ORDER BY rowid DESC LIMIT 100`).all();
    res.json({ ok: true, tableName, columns, rows });
  });

  // ==========================================================================
  // 3B. UNIFIED & DEPARTMENT-WISE REPORT SECTION ENDPOINT
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
    const rawTablesByModule: Record<string, { tableName: string; rows: any[] }[]> = {};

    for (const mod of reportableModules) {
      if (moduleFilter !== 'all' && mod.key !== moduleFilter) continue;

      let modRecordCount = 0;
      let modTotalPrimary = 0;
      let modPrimaryUnit = 'Units';
      rawTablesByModule[mod.key] = [];

      for (const tbl of mod.tables) {
        if (tbl.endsWith('_masters') || tbl.endsWith('_settings') || tbl.endsWith('_options')) {
          continue;
        }
        try {
          const rows = db.prepare(`SELECT * FROM "${tbl}" ORDER BY rowid DESC LIMIT 250`).all() as any[];
          rawTablesByModule[mod.key].push({ tableName: tbl, rows });

          for (const r of rows) {
            const rowDate = String(
              r.entry_date || r.shift_date || r.record_date || (r.started_at ? r.started_at.slice(0, 10) : '') || (r.created_at ? r.created_at.slice(0, 10) : '')
            );
            const rowShift = String(r.shift || r.shift_name || 'General');

            if (fromDate && rowDate && rowDate < fromDate) continue;
            if (toDate && rowDate && rowDate > toDate) continue;
            if (shiftFilter !== 'all' && !rowShift.toLowerCase().includes(shiftFilter)) continue;

            const machine = String(
              r.machine_no || r.loom_no || r.frame_no || r.press_no || r.round_no || r.round_id || r.po_number || '-'
            );
            const quality = String(
              r.quality || r.quality_count || r.order_color || r.grade_mix || r.pile_type || '-'
            );
            const operator = String(
              r.operator_name || r.weaver_name || r.supervisor || r.buyer_mark || r.created_by || '-'
            );

            let primaryVal = 0;
            let primaryLabel = '';
            let secondaryVal = 0;
            let secondaryLabel = '';

            if (r.production_mt !== undefined) {
              primaryVal = Number(r.production_mt || 0);
              primaryLabel = 'MT';
              modPrimaryUnit = 'MT';
            } else if (r.total_mt !== undefined) {
              primaryVal = Number(r.total_mt || 0);
              primaryLabel = 'MT';
              secondaryVal = Number(r.total_cuts || r.total_bags || 0);
              secondaryLabel = r.total_bags !== undefined ? 'Bags' : 'Cuts';
              modPrimaryUnit = 'MT';
            } else if (r.total_weight !== undefined) {
              primaryVal = Number(r.total_weight || 0);
              primaryLabel = 'MT/Kg';
              secondaryVal = Number(r.total_rolls || r.total_qty || 0);
              secondaryLabel = r.total_rolls !== undefined ? 'Rolls' : 'Qty';
              modPrimaryUnit = 'MT/Kg';
            } else if (r.net_wt_kg !== undefined) {
              primaryVal = Number(r.net_wt_kg || 0);
              primaryLabel = 'Net Kg';
              secondaryVal = Number(r.bags_per_bale || 0);
              secondaryLabel = 'Bags';
              modPrimaryUnit = 'Net Kg';
            } else if (r.meters !== undefined || r.net_meters !== undefined || r.total_meters !== undefined) {
              primaryVal = Number(r.meters ?? r.net_meters ?? r.total_meters ?? 0);
              primaryLabel = 'Meters';
              secondaryVal = Number(r.cuts || r.weight_kg || 0);
              secondaryLabel = r.cuts !== undefined ? 'Cuts' : 'Kg';
              modPrimaryUnit = 'Meters';
            } else if (r.production_kg !== undefined) {
              primaryVal = Number(r.production_kg || 0);
              primaryLabel = 'Kg';
              secondaryVal = Number(r.efficiency || 0);
              secondaryLabel = '% Eff';
              modPrimaryUnit = 'Kg';
            } else if (r.weight_mt !== undefined) {
              primaryVal = Number(r.weight_mt || 0);
              primaryLabel = 'MT';
              secondaryVal = Number(r.rolls_count || 0);
              secondaryLabel = 'Rolls';
              modPrimaryUnit = 'MT';
            } else if (r.closing_stock !== undefined) {
              primaryVal = Number(r.closing_stock || 0);
              primaryLabel = 'Stock MT';
            } else if (r.duration_mins !== undefined || r.down_mins !== undefined) {
              primaryVal = Number(r.duration_mins ?? r.down_mins ?? 0);
              primaryLabel = 'Down Mins';
            }

            modRecordCount += 1;
            modTotalPrimary += primaryVal;

            unifiedRows.push({
              id: `${tbl}-${r.id || modRecordCount}`,
              moduleKey: mod.key,
              department: mod.shortName,
              category: mod.category,
              tableName: tbl,
              date: rowDate || '-',
              shift: rowShift,
              machine,
              quality,
              operator,
              primaryVal,
              primaryLabel,
              secondaryVal,
              secondaryLabel,
              remarks: String(r.remarks || r.reason || r.status || ''),
            });
          }
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
        totalPrimary: Number(modTotalPrimary.toFixed(2)),
        primaryUnit: modPrimaryUnit,
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

    const user = db.prepare('SELECT id, username, full_name FROM users WHERE id = ?').get(Number(userId)) as any;
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
          <body style="font-family: sans-serif; padding: 3rem; text-align: center; color: #334155;">
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
<style>
  :root {
    --plate-1: #9E0059;
    --plate-2: #C90D6B;
    --plate-3: #E62A82;
    --plate-4: #F35BA0;
    --plate-5: #EC69A8;
    --plate-6: #F595C3;
    --plate-7: #F9BCDA;
    --plate-8: #FDE2EF;
    --deep-ink: #38001E;
    --primary: #9E0059 !important;
    --primary-dark: #7A0045 !important;
    --accent: #C90D6B !important;
    --bg: #FDE2EF !important;
    --card: #FFFFFF !important;
    --text: #38001E !important;
    --border: #EC69A8 !important;
  }

  p.hint, p.sub, p.subtext, #rp-generated, #beam-status, #cut-status, #lb-worker-info {
    display: none !important;
  }

  html, body {
    background: linear-gradient(180deg, #FDE2EF 0%, #F9BCDA 100%) !important;
    color: #38001E !important;
    font-weight: 800 !important;
  }

  h1, h2, h3, h4, h5, h6, .title, .section-title, .card-title {
    color: #38001E !important;
    font-weight: 900 !important;
  }

  header, .header, .topbar, .app-header, nav.top-nav, .hero-bar, .bg-blue-900, .bg-indigo-900, .bg-slate-900, .bg-teal-900, .bg-emerald-900 {
    background: linear-gradient(135deg, #9E0059 0%, #C90D6B 45%, #E62A82 80%, #F35BA0 100%) !important;
    color: #FFFFFF !important;
    border-bottom: 2px solid #F595C3 !important;
    box-shadow: inset 0 2px 1px rgba(255,255,255,0.42), 0 8px 20px -4px rgba(158,0,89,0.35) !important;
  }

  header h1, header h2, header h3, .header h1, .header h2, .topbar h1, .topbar h2, .topbar .title, .app-header h1, .app-header h2 {
    color: #FFFFFF !important;
    font-weight: 900 !important;
  }

  /* Active / Selected buttons inside top header (white pill -> Deep Bold Berry text) */
  header button.bg-white,
  header button.active,
  header .tab.active,
  header .tab-btn.active,
  header .nav-btn.active,
  .header button.bg-white,
  .header button.active,
  .topbar button.active,
  .topbar .tab.active,
  .app-header button.active {
    background: #FFFFFF !important;
    color: #38001E !important;
    border: 2px solid #FDE2EF !important;
    font-weight: 900 !important;
    box-shadow: 0 3px 10px rgba(56, 0, 30, 0.25) !important;
  }

  header button.bg-white *,
  header button.active *,
  header .tab.active *,
  header .tab-btn.active *,
  header .nav-btn.active *,
  .header button.bg-white *,
  .header button.active *,
  .topbar button.active *,
  .topbar .tab.active *,
  .app-header button.active * {
    color: #38001E !important;
    font-weight: 900 !important;
  }

  .card, .panel, .section-card, .box, .form-card, div.bg-white, section.bg-white, main.bg-white {
    background: linear-gradient(180deg, #FFFFFF 0%, #FFF7FB 70%, #FDE2EF 100%) !important;
    border: 2px solid #F595C3 !important;
    box-shadow: inset 0 1px 0 #FFFFFF, 0 8px 20px -6px rgba(158,0,89,0.16) !important;
    color: #38001E !important;
  }

  label, .label, .field-label, span, p, div {
    font-weight: 800;
  }

  label, .label, .field-label {
    color: #38001E !important;
    font-weight: 900 !important;
  }

  input, select, textarea {
    background-color: #FFFFFF !important;
    color: #38001E !important;
    font-weight: 800 !important;
    border: 2px solid #EC69A8 !important;
  }

  input:focus, select:focus, textarea:focus {
    border-color: #9E0059 !important;
    outline: none !important;
    box-shadow: 0 0 0 3px rgba(201, 13, 107, 0.22) !important;
  }

  table {
    border-collapse: collapse !important;
  }

  thead tr, th {
    background: linear-gradient(180deg, #C90D6B 0%, #9E0059 100%) !important;
    color: #FFFFFF !important;
    font-weight: 900 !important;
    border-color: #F595C3 !important;
  }

  tbody td, td {
    color: #38001E !important;
    font-weight: 800 !important;
    border-color: #F595C3 !important;
  }

  tbody tr:nth-child(even) {
    background-color: #FDE2EF !important;
  }

  tbody tr:hover {
    background-color: #F9BCDA !important;
  }

  button, .btn, .tab-btn, .nav-btn, input[type="submit"], input[type="button"] {
    font-weight: 900 !important;
  }

  button.primary, .btn-primary, .btn-save, button[type="submit"] {
    background: linear-gradient(180deg, #E62A82 0%, #C90D6B 52%, #9E0059 100%) !important;
    color: #FFFFFF !important;
    border: 1px solid #9E0059 !important;
    box-shadow: inset 0 1.5px 0 rgba(255,255,255,0.5), 0 4px 10px rgba(158,0,89,0.3) !important;
  }
</style>
<script>
(function() {
  window.__BJM_USER__ = ${JSON.stringify({
    id: user?.id || 1,
    username: user?.username || 'admin',
    fullName: user?.full_name || 'Administrator',
    roleName: user?.role_name || 'Super Admin',
  })};
  window.__BJM_PERMS__ = ${JSON.stringify(modPerm)};
  window.__BJM_MODULE__ = ${JSON.stringify(mod.key)};
  var STRIP_PHRASES = ${JSON.stringify(phrasesToStrip)};

  function ensureMenuButtonContrast() {
    try {
      var btns = document.querySelectorAll('header button, .header button, .topbar button, .app-header button, nav button, .tabs button, .tab-bar button, .tab, .tab-btn, .nav-btn');
      for (var i = 0; i < btns.length; i++) {
        var b = btns[i];
        var cls = (b.className || '') + '';
        var cs = window.getComputedStyle(b);
        var bg = cs.backgroundColor || '';
        var bgImg = cs.backgroundImage || '';
        var isLightBg = false;

        if (cls.indexOf('bg-white') !== -1 || cls.indexOf('bg-amber') !== -1 || cls.indexOf('bg-yellow') !== -1 || cls.indexOf('bg-pink-50') !== -1 || cls.indexOf('bg-gray-100') !== -1) {
          isLightBg = true;
        } else if (bg.indexOf('rgb') === 0 && bg.indexOf('rgba(0, 0, 0, 0)') === -1) {
          var parts = bg.match(/\\d+(\\.\\d+)?/g);
          if (parts && parts.length >= 3) {
            var r = parseFloat(parts[0]);
            var g = parseFloat(parts[1]);
            var bl = parseFloat(parts[2]);
            var alpha = parts.length >= 4 ? parseFloat(parts[3]) : 1;
            if (alpha > 0.5 && (r * 0.299 + g * 0.587 + bl * 0.114) > 165) {
              isLightBg = true;
            }
          }
        }

        // Also check if button is active inside header
        var inHeader = Boolean(b.closest('header, .header, .topbar, .app-header'));
        var isActive = cls.indexOf('active') !== -1 || b.getAttribute('aria-selected') === 'true';

        if (inHeader && (isLightBg || isActive)) {
          b.style.setProperty('background', '#FFFFFF', 'important');
          b.style.setProperty('color', '#38001E', 'important');
          var kids = b.querySelectorAll('*');
          for (var k = 0; k < kids.length; k++) {
            kids[k].style.setProperty('color', '#38001E', 'important');
          }
        } else if (inHeader && !isLightBg && !isActive) {
          b.style.setProperty('color', '#FFFFFF', 'important');
          var kids2 = b.querySelectorAll('*');
          for (var k2 = 0; k2 < kids2.length; k2++) {
            kids2[k2].style.setProperty('color', '#FFFFFF', 'important');
          }
        } else if (!inHeader && isLightBg && bgImg === 'none') {
          b.style.setProperty('color', '#38001E', 'important');
        }
      }
    } catch (e) {}
  }

  function cleanUnwantedHelperTexts() {
    ensureMenuButtonContrast();
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
    setTimeout(ensureMenuButtonContrast, 10);
    setTimeout(ensureMenuButtonContrast, 80);
  }, true);

  // Non-blocking toast banner for native alert() calls inside iframe
  function showBridgeToast(message, isError) {
    try {
      var existing = document.getElementById('bjm-bridge-toast');
      if (existing) existing.remove();
      var div = document.createElement('div');
      div.id = 'bjm-bridge-toast';
      div.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:999999;max-width:420px;padding:12px 18px;border-radius:8px;font-family:system-ui,sans-serif;font-size:13px;font-weight:600;box-shadow:0 10px 25px rgba(0,0,0,0.22);color:#fff;background:' + (isError ? '#dc2626' : '#0f766e') + ';transition:opacity 0.25s ease;';
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
          fetch('/api/rpc/' + window.__BJM_MODULE__, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fnName: String(prop),
              args: args,
              userId: window.__BJM_USER__.id
            })
          })
          .then(function(r) { return r.json().then(function(d) { return { status: r.status, body: d }; }); })
          .then(function(res) {
            if (!res.body || res.body.ok === false) {
              var errMsg = (res.body && res.body.error) || 'Operation not permitted';
              showBridgeToast(errMsg, true);
              if (typeof failureHandler === 'function') {
                failureHandler(new Error(errMsg));
              }
              return;
            }
            if (typeof successHandler === 'function') {
              successHandler(res.body.result);
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

  // Auto-authenticate legacy internal login screens (Carding, Spinning, Spreader)
  // and enforce module-level RBAC/User permissions in UI controls
  function applySsoAndPermissions() {
    cleanUnwantedHelperTexts();
    var modKey = window.__BJM_MODULE__;
    var user = window.__BJM_USER__;
    var perms = window.__BJM_PERMS__;

    // 1. Carding SSO bypass
    if (modKey === 'carding') {
      var loginPage = document.getElementById('page-login');
      if (loginPage) loginPage.style.display = 'none';
      if (typeof window.enterApp === 'function') {
        try { window.enterApp(user.fullName); } catch (e) {}
      }
      var appContainer = document.getElementById('app-container') || document.getElementById('main-app');
      if (appContainer) appContainer.style.display = 'block';
    }

    // 2. Spinning SSO bypass
    if (modKey === 'spinning') {
      var spinLogin = document.getElementById('loginScreen');
      if (spinLogin) spinLogin.style.display = 'none';
      var spinMain = document.getElementById('mainApp');
      if (spinMain) {
        spinMain.classList.remove('hidden');
        spinMain.style.display = 'block';
      }
      var welcomeUser = document.getElementById('welcomeUser');
      if (welcomeUser) welcomeUser.textContent = user.fullName;
      if (typeof window.initDefaults === 'function') {
        try { window.initDefaults(); } catch (e) {}
      }
    }

    // 3. Spreader SSO bypass
    if (modKey === 'spreader') {
      var spreadLogin = document.getElementById('loginScreen');
      if (spreadLogin) spreadLogin.style.display = 'none';
      var spreadApp = document.getElementById('appScreen');
      if (spreadApp) {
        spreadApp.classList.remove('hidden');
        spreadApp.style.display = 'flex';
      }
      try {
        window.CURRENT_USER = { username: user.username, name: user.fullName, role: user.roleName };
      } catch (e) {}
      var badge = document.getElementById('userBadgeName');
      if (badge) badge.textContent = user.fullName;
      if (typeof window.loadLogBookRecent === 'function') {
        try { window.loadLogBookRecent(); } catch (e) {}
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
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      cleanUnwantedHelperTexts();
      setTimeout(applySsoAndPermissions, 60);
      setTimeout(applySsoAndPermissions, 350);
      try {
        var obs = new MutationObserver(function() { cleanUnwantedHelperTexts(); });
        obs.observe(document.body, { childList: true, subtree: true });
      } catch (e) {}
    });
  } else {
    cleanUnwantedHelperTexts();
    setTimeout(applySsoAndPermissions, 60);
  }
})();
</script>
`;

    const injectedHtml = rawHtml.includes('<head>')
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
