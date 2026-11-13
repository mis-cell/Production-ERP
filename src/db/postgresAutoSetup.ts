import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Client } = pg;

export const POSTGRES_PRODUCTION_SCHEMA_SQL = `-- ============================================================================
-- BALLY JUTE MILL ERP - POSTGRESQL "production" DATABASE SCHEMA
-- Safe for existing PostgreSQL servers (Does NOT touch SQC or bjcl_db)
-- Target Server: BJCL (192.168.1.6:5432) -> Database: "production"
-- ============================================================================

CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  is_admin INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  employee_code TEXT NOT NULL DEFAULT '',
  department TEXT NOT NULL DEFAULT 'All',
  role_id INTEGER NOT NULL REFERENCES roles(id),
  is_active INTEGER NOT NULL DEFAULT 1,
  last_login TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS role_permissions (
  id SERIAL PRIMARY KEY,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  module_key TEXT NOT NULL,
  can_view INTEGER NOT NULL DEFAULT 1,
  can_create INTEGER NOT NULL DEFAULT 1,
  can_edit INTEGER NOT NULL DEFAULT 1,
  can_delete INTEGER NOT NULL DEFAULT 0,
  can_report INTEGER NOT NULL DEFAULT 1,
  UNIQUE(role_id, module_key)
);

CREATE TABLE IF NOT EXISTS user_permissions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_key TEXT NOT NULL,
  override_mode TEXT NOT NULL DEFAULT 'inherit',
  can_view INTEGER NOT NULL DEFAULT 1,
  can_create INTEGER NOT NULL DEFAULT 1,
  can_edit INTEGER NOT NULL DEFAULT 0,
  can_delete INTEGER NOT NULL DEFAULT 0,
  can_report INTEGER NOT NULL DEFAULT 1,
  UNIQUE(user_id, module_key)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  username TEXT NOT NULL,
  module_key TEXT NOT NULL,
  action_name TEXT NOT NULL,
  details TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 1. CARDING DEPARTMENT TABLES
CREATE TABLE IF NOT EXISTS carding_log_book (
  id SERIAL PRIMARY KEY,
  entry_date TEXT NOT NULL,
  shift TEXT NOT NULL,
  machine_type TEXT NOT NULL DEFAULT '',
  machine_no TEXT NOT NULL DEFAULT '',
  quality TEXT NOT NULL DEFAULT '',
  operator_name TEXT NOT NULL DEFAULT '',
  production_mt DOUBLE PRECISION NOT NULL DEFAULT 0,
  remarks TEXT NOT NULL DEFAULT '',
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_by TEXT NOT NULL DEFAULT 'system',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS carding_machine_breakdown (
  id SERIAL PRIMARY KEY,
  entry_date TEXT NOT NULL,
  shift TEXT NOT NULL,
  machine_no TEXT NOT NULL,
  stop_time TEXT NOT NULL DEFAULT '',
  start_time TEXT NOT NULL DEFAULT '',
  duration_mins DOUBLE PRECISION NOT NULL DEFAULT 0,
  reason TEXT NOT NULL DEFAULT '',
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_by TEXT NOT NULL DEFAULT 'system',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS carding_pile_stock (
  id SERIAL PRIMARY KEY,
  entry_date TEXT NOT NULL,
  shift TEXT NOT NULL,
  pile_type TEXT NOT NULL DEFAULT '',
  opening_stock DOUBLE PRECISION NOT NULL DEFAULT 0,
  received_qty DOUBLE PRECISION NOT NULL DEFAULT 0,
  consumed_qty DOUBLE PRECISION NOT NULL DEFAULT 0,
  closing_stock DOUBLE PRECISION NOT NULL DEFAULT 0,
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_by TEXT NOT NULL DEFAULT 'system',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. CUTTING DEPARTMENT TABLES
CREATE TABLE IF NOT EXISTS cutting_shifts (
  id SERIAL PRIMARY KEY,
  shift_date TEXT NOT NULL,
  shift_name TEXT NOT NULL,
  supervisor TEXT NOT NULL DEFAULT '',
  attendance_count INTEGER NOT NULL DEFAULT 0,
  total_cuts DOUBLE PRECISION NOT NULL DEFAULT 0,
  total_mt DOUBLE PRECISION NOT NULL DEFAULT 0,
  payload_json TEXT NOT NULL DEFAULT '{}',
  updated_by TEXT NOT NULL DEFAULT 'system',
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(shift_date, shift_name)
);

CREATE TABLE IF NOT EXISTS cutting_production_rows (
  id SERIAL PRIMARY KEY,
  shift_date TEXT NOT NULL,
  shift_name TEXT NOT NULL,
  machine_no TEXT NOT NULL DEFAULT '',
  quality TEXT NOT NULL DEFAULT '',
  cuts DOUBLE PRECISION NOT NULL DEFAULT 0,
  weight_mt DOUBLE PRECISION NOT NULL DEFAULT 0,
  operator_name TEXT NOT NULL DEFAULT '',
  row_json TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS cutting_masters (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  extra_json TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS cutting_settings (
  setting_key TEXT PRIMARY KEY,
  setting_value TEXT NOT NULL
);

-- 3. DAMPING DEPARTMENT TABLES
CREATE TABLE IF NOT EXISTS damping_shifts (
  id SERIAL PRIMARY KEY,
  shift_date TEXT NOT NULL,
  shift_name TEXT NOT NULL,
  supervisor TEXT NOT NULL DEFAULT '',
  total_rolls DOUBLE PRECISION NOT NULL DEFAULT 0,
  total_weight DOUBLE PRECISION NOT NULL DEFAULT 0,
  payload_json TEXT NOT NULL DEFAULT '{}',
  updated_by TEXT NOT NULL DEFAULT 'system',
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(shift_date, shift_name)
);

CREATE TABLE IF NOT EXISTS damping_production_rows (
  id SERIAL PRIMARY KEY,
  shift_date TEXT NOT NULL,
  shift_name TEXT NOT NULL,
  machine_no TEXT NOT NULL DEFAULT '',
  quality TEXT NOT NULL DEFAULT '',
  rolls DOUBLE PRECISION NOT NULL DEFAULT 0,
  weight_kg DOUBLE PRECISION NOT NULL DEFAULT 0,
  row_json TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS damping_masters (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  extra_json TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS damping_settings (
  setting_key TEXT PRIMARY KEY,
  setting_value TEXT NOT NULL
);

-- 4. HEMMING DEPARTMENT TABLES
CREATE TABLE IF NOT EXISTS hemming_shifts (
  id SERIAL PRIMARY KEY,
  shift_date TEXT NOT NULL,
  shift_name TEXT NOT NULL,
  supervisor TEXT NOT NULL DEFAULT '',
  total_bags DOUBLE PRECISION NOT NULL DEFAULT 0,
  total_mt DOUBLE PRECISION NOT NULL DEFAULT 0,
  payload_json TEXT NOT NULL DEFAULT '{}',
  updated_by TEXT NOT NULL DEFAULT 'system',
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(shift_date, shift_name)
);

CREATE TABLE IF NOT EXISTS hemming_production_rows (
  id SERIAL PRIMARY KEY,
  shift_date TEXT NOT NULL,
  shift_name TEXT NOT NULL,
  machine_no TEXT NOT NULL DEFAULT '',
  quality TEXT NOT NULL DEFAULT '',
  bags DOUBLE PRECISION NOT NULL DEFAULT 0,
  weight_mt DOUBLE PRECISION NOT NULL DEFAULT 0,
  row_json TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS hemming_masters (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  extra_json TEXT NOT NULL DEFAULT '{}'
);

-- 5. HERACKLE PRODUCTION TABLES
CREATE TABLE IF NOT EXISTS herackle_records (
  id SERIAL PRIMARY KEY,
  record_date TEXT NOT NULL,
  shift_name TEXT NOT NULL,
  supervisor TEXT NOT NULL DEFAULT '',
  total_qty DOUBLE PRECISION NOT NULL DEFAULT 0,
  total_weight DOUBLE PRECISION NOT NULL DEFAULT 0,
  payload_json TEXT NOT NULL DEFAULT '{}',
  updated_by TEXT NOT NULL DEFAULT 'system',
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(record_date, shift_name)
);

CREATE TABLE IF NOT EXISTS herackle_rows (
  id SERIAL PRIMARY KEY,
  record_date TEXT NOT NULL,
  shift_name TEXT NOT NULL,
  machine_no TEXT NOT NULL DEFAULT '',
  quality TEXT NOT NULL DEFAULT '',
  qty DOUBLE PRECISION NOT NULL DEFAULT 0,
  weight_mt DOUBLE PRECISION NOT NULL DEFAULT 0,
  row_json TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS herackle_masters (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  extra_json TEXT NOT NULL DEFAULT '{}'
);

-- 6. LAPPING PRODUCTION TABLE
CREATE TABLE IF NOT EXISTS lapping_production (
  id SERIAL PRIMARY KEY,
  entry_date TEXT NOT NULL,
  shift TEXT NOT NULL,
  machine_no TEXT NOT NULL DEFAULT '',
  operator_name TEXT NOT NULL DEFAULT '',
  quality TEXT NOT NULL DEFAULT '',
  cuts DOUBLE PRECISION NOT NULL DEFAULT 0,
  meters DOUBLE PRECISION NOT NULL DEFAULT 0,
  weight_kg DOUBLE PRECISION NOT NULL DEFAULT 0,
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_by TEXT NOT NULL DEFAULT 'system',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. NARROW BEAMING TABLES
CREATE TABLE IF NOT EXISTS narrow_beaming_rounds (
  id SERIAL PRIMARY KEY,
  round_id TEXT NOT NULL UNIQUE,
  machine_no TEXT NOT NULL DEFAULT 'NB-01',
  quality TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'OPEN',
  started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP,
  total_cuts DOUBLE PRECISION NOT NULL DEFAULT 0,
  total_meters DOUBLE PRECISION NOT NULL DEFAULT 0,
  raw_json TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS narrow_beaming_logs (
  id SERIAL PRIMARY KEY,
  entry_date TEXT NOT NULL,
  shift TEXT NOT NULL,
  machine_no TEXT NOT NULL DEFAULT '',
  beam_no TEXT NOT NULL DEFAULT '',
  quality TEXT NOT NULL DEFAULT '',
  operator_name TEXT NOT NULL DEFAULT '',
  cuts DOUBLE PRECISION NOT NULL DEFAULT 0,
  meters DOUBLE PRECISION NOT NULL DEFAULT 0,
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS narrow_beaming_production (
  id SERIAL PRIMARY KEY,
  round_id TEXT NOT NULL,
  entry_date TEXT NOT NULL,
  shift TEXT NOT NULL,
  machine_no TEXT NOT NULL DEFAULT '',
  beam_no TEXT NOT NULL DEFAULT '',
  quality TEXT NOT NULL DEFAULT '',
  cuts DOUBLE PRECISION NOT NULL DEFAULT 0,
  meters DOUBLE PRECISION NOT NULL DEFAULT 0,
  operator_name TEXT NOT NULL DEFAULT '',
  verified INTEGER NOT NULL DEFAULT 0,
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 8. NARROW LOOM TABLES
CREATE TABLE IF NOT EXISTS narrow_loom_logbook (
  id SERIAL PRIMARY KEY,
  entry_date TEXT NOT NULL,
  shift TEXT NOT NULL,
  loom_no TEXT NOT NULL DEFAULT '',
  quality TEXT NOT NULL DEFAULT '',
  beam_no TEXT NOT NULL DEFAULT '',
  weaver_name TEXT NOT NULL DEFAULT '',
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS narrow_loom_production (
  id SERIAL PRIMARY KEY,
  entry_date TEXT NOT NULL,
  shift TEXT NOT NULL,
  loom_no TEXT NOT NULL DEFAULT '',
  quality TEXT NOT NULL DEFAULT '',
  cuts DOUBLE PRECISION NOT NULL DEFAULT 0,
  meters DOUBLE PRECISION NOT NULL DEFAULT 0,
  efficiency DOUBLE PRECISION NOT NULL DEFAULT 0,
  weaver_name TEXT NOT NULL DEFAULT '',
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 9. PRE BEAMING TABLES
CREATE TABLE IF NOT EXISTS pre_beaming_rounds (
  id SERIAL PRIMARY KEY,
  round_id TEXT NOT NULL UNIQUE,
  machine_no TEXT NOT NULL DEFAULT 'PB-01',
  quality TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'OPEN',
  started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP,
  total_beams INTEGER NOT NULL DEFAULT 0,
  total_meters DOUBLE PRECISION NOT NULL DEFAULT 0,
  raw_json TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS pre_beaming_logs (
  id SERIAL PRIMARY KEY,
  entry_date TEXT NOT NULL,
  shift TEXT NOT NULL,
  machine_no TEXT NOT NULL DEFAULT '',
  beam_no TEXT NOT NULL DEFAULT '',
  quality TEXT NOT NULL DEFAULT '',
  meters DOUBLE PRECISION NOT NULL DEFAULT 0,
  operator_name TEXT NOT NULL DEFAULT '',
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pre_beaming_production (
  id SERIAL PRIMARY KEY,
  round_id TEXT NOT NULL,
  entry_date TEXT NOT NULL,
  shift TEXT NOT NULL,
  machine_no TEXT NOT NULL DEFAULT '',
  beam_no TEXT NOT NULL DEFAULT '',
  quality TEXT NOT NULL DEFAULT '',
  meters DOUBLE PRECISION NOT NULL DEFAULT 0,
  weight_kg DOUBLE PRECISION NOT NULL DEFAULT 0,
  operator_name TEXT NOT NULL DEFAULT '',
  verified INTEGER NOT NULL DEFAULT 0,
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 10. PRESS DEPARTMENT TABLES
CREATE TABLE IF NOT EXISTS press_bales (
  id SERIAL PRIMARY KEY,
  bale_serial TEXT NOT NULL UNIQUE,
  entry_date TEXT NOT NULL,
  shift TEXT NOT NULL,
  press_no TEXT NOT NULL DEFAULT 'Press-1',
  quality TEXT NOT NULL DEFAULT '',
  buyer_mark TEXT NOT NULL DEFAULT '',
  bags_per_bale INTEGER NOT NULL DEFAULT 500,
  gross_wt_kg DOUBLE PRECISION NOT NULL DEFAULT 0,
  tare_wt_kg DOUBLE PRECISION NOT NULL DEFAULT 0,
  net_wt_kg DOUBLE PRECISION NOT NULL DEFAULT 0,
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_by TEXT NOT NULL DEFAULT 'system',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS press_options (
  id SERIAL PRIMARY KEY,
  option_type TEXT NOT NULL,
  option_value TEXT NOT NULL,
  extra_json TEXT NOT NULL DEFAULT '{}'
);

-- 11. S4 BEAMING TABLES
CREATE TABLE IF NOT EXISTS s4_beaming_logbook (
  id SERIAL PRIMARY KEY,
  entry_date TEXT NOT NULL,
  shift TEXT NOT NULL,
  machine_no TEXT NOT NULL,
  order_color TEXT NOT NULL DEFAULT '',
  quality TEXT NOT NULL DEFAULT '',
  operator_name TEXT NOT NULL DEFAULT '',
  opening_meter DOUBLE PRECISION NOT NULL DEFAULT 0,
  closing_meter DOUBLE PRECISION NOT NULL DEFAULT 0,
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS s4_beaming_production (
  id SERIAL PRIMARY KEY,
  entry_date TEXT NOT NULL,
  shift TEXT NOT NULL,
  machine_no TEXT NOT NULL,
  round_no TEXT NOT NULL DEFAULT 'R-1',
  beam_no TEXT NOT NULL DEFAULT '',
  order_color TEXT NOT NULL DEFAULT '',
  meters DOUBLE PRECISION NOT NULL DEFAULT 0,
  cuts DOUBLE PRECISION NOT NULL DEFAULT 0,
  operator_name TEXT NOT NULL DEFAULT '',
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS s4_beaming_verification (
  id SERIAL PRIMARY KEY,
  entry_date TEXT NOT NULL,
  machine_no TEXT NOT NULL,
  round_no TEXT NOT NULL,
  verified_meters DOUBLE PRECISION NOT NULL DEFAULT 0,
  variance_meters DOUBLE PRECISION NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'VERIFIED',
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS s4_beaming_purchase_orders (
  id SERIAL PRIMARY KEY,
  po_number TEXT NOT NULL,
  order_color TEXT NOT NULL,
  quality TEXT NOT NULL DEFAULT '',
  target_meters DOUBLE PRECISION NOT NULL DEFAULT 0,
  produced_meters DOUBLE PRECISION NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 12. S4 LOOM TABLES
CREATE TABLE IF NOT EXISTS s4_loom_logbook (
  id SERIAL PRIMARY KEY,
  entry_date TEXT NOT NULL,
  shift TEXT NOT NULL,
  loom_no TEXT NOT NULL,
  quality TEXT NOT NULL DEFAULT '',
  weaver_name TEXT NOT NULL DEFAULT '',
  beam_no TEXT NOT NULL DEFAULT '',
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS s4_loom_production (
  id SERIAL PRIMARY KEY,
  entry_date TEXT NOT NULL,
  shift TEXT NOT NULL,
  loom_no TEXT NOT NULL,
  quality TEXT NOT NULL DEFAULT '',
  opening_reading DOUBLE PRECISION NOT NULL DEFAULT 0,
  closing_reading DOUBLE PRECISION NOT NULL DEFAULT 0,
  net_meters DOUBLE PRECISION NOT NULL DEFAULT 0,
  cuts DOUBLE PRECISION NOT NULL DEFAULT 0,
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS s4_loom_verification (
  id SERIAL PRIMARY KEY,
  entry_date TEXT NOT NULL,
  shift TEXT NOT NULL,
  loom_no TEXT NOT NULL,
  book_meters DOUBLE PRECISION NOT NULL DEFAULT 0,
  actual_meters DOUBLE PRECISION NOT NULL DEFAULT 0,
  diff_meters DOUBLE PRECISION NOT NULL DEFAULT 0,
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 13. SPINNING DEPARTMENT TABLES
CREATE TABLE IF NOT EXISTS spinning_logbook (
  id SERIAL PRIMARY KEY,
  entry_date TEXT NOT NULL,
  shift TEXT NOT NULL,
  frame_no TEXT NOT NULL,
  quality_count TEXT NOT NULL DEFAULT '',
  rpm DOUBLE PRECISION NOT NULL DEFAULT 0,
  tpi DOUBLE PRECISION NOT NULL DEFAULT 0,
  operator_name TEXT NOT NULL DEFAULT '',
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS spinning_breakdown (
  id SERIAL PRIMARY KEY,
  entry_date TEXT NOT NULL,
  shift TEXT NOT NULL,
  frame_no TEXT NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  down_mins DOUBLE PRECISION NOT NULL DEFAULT 0,
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS spinning_production (
  id SERIAL PRIMARY KEY,
  entry_date TEXT NOT NULL,
  shift TEXT NOT NULL,
  frame_no TEXT NOT NULL,
  quality_count TEXT NOT NULL DEFAULT '',
  doffs INTEGER NOT NULL DEFAULT 0,
  production_kg DOUBLE PRECISION NOT NULL DEFAULT 0,
  efficiency DOUBLE PRECISION NOT NULL DEFAULT 0,
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 14. SPREADER & SOFTENER TABLES
CREATE TABLE IF NOT EXISTS spreader_logbook (
  id SERIAL PRIMARY KEY,
  entry_date TEXT NOT NULL,
  shift TEXT NOT NULL,
  machine_no TEXT NOT NULL,
  grade_mix TEXT NOT NULL DEFAULT '',
  emulsion_pct DOUBLE PRECISION NOT NULL DEFAULT 0,
  operator_name TEXT NOT NULL DEFAULT '',
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS spreader_breakdown (
  id SERIAL PRIMARY KEY,
  entry_date TEXT NOT NULL,
  shift TEXT NOT NULL,
  machine_no TEXT NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  duration_mins DOUBLE PRECISION NOT NULL DEFAULT 0,
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS spreader_meter_reading (
  id SERIAL PRIMARY KEY,
  entry_date TEXT NOT NULL,
  shift TEXT NOT NULL,
  machine_no TEXT NOT NULL,
  opening_reading DOUBLE PRECISION NOT NULL DEFAULT 0,
  closing_reading DOUBLE PRECISION NOT NULL DEFAULT 0,
  net_reading DOUBLE PRECISION NOT NULL DEFAULT 0,
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS spreader_roll_production (
  id SERIAL PRIMARY KEY,
  entry_date TEXT NOT NULL,
  shift TEXT NOT NULL,
  machine_no TEXT NOT NULL,
  quality TEXT NOT NULL DEFAULT '',
  rolls_count INTEGER NOT NULL DEFAULT 0,
  weight_mt DOUBLE PRECISION NOT NULL DEFAULT 0,
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 15. VL BEAMING TABLES
CREATE TABLE IF NOT EXISTS vl_beaming_logbook (
  id SERIAL PRIMARY KEY,
  entry_date TEXT NOT NULL,
  shift TEXT NOT NULL,
  machine_no TEXT NOT NULL DEFAULT 'VLB-01',
  beam_no TEXT NOT NULL DEFAULT '',
  quality TEXT NOT NULL DEFAULT '',
  operator_name TEXT NOT NULL DEFAULT '',
  meters DOUBLE PRECISION NOT NULL DEFAULT 0,
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vl_beaming_rounds (
  id SERIAL PRIMARY KEY,
  round_no TEXT NOT NULL UNIQUE,
  machine_no TEXT NOT NULL DEFAULT 'VLB-01',
  quality TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'OPEN',
  total_meters DOUBLE PRECISION NOT NULL DEFAULT 0,
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vl_beaming_production (
  id SERIAL PRIMARY KEY,
  round_no TEXT NOT NULL DEFAULT 'VLR-101',
  entry_date TEXT NOT NULL,
  shift TEXT NOT NULL,
  machine_no TEXT NOT NULL DEFAULT 'VLB-01',
  beam_no TEXT NOT NULL DEFAULT '',
  quality TEXT NOT NULL DEFAULT '',
  cuts DOUBLE PRECISION NOT NULL DEFAULT 0,
  meters DOUBLE PRECISION NOT NULL DEFAULT 0,
  operator_name TEXT NOT NULL DEFAULT '',
  verified INTEGER NOT NULL DEFAULT 0,
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 16. VL LOOM TABLES
CREATE TABLE IF NOT EXISTS vl_loom_logbook (
  id SERIAL PRIMARY KEY,
  group_id TEXT NOT NULL,
  entry_date TEXT NOT NULL,
  shift TEXT NOT NULL,
  loom_no TEXT NOT NULL,
  quality TEXT NOT NULL DEFAULT '',
  beam_no TEXT NOT NULL DEFAULT '',
  weaver_name TEXT NOT NULL DEFAULT '',
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vl_loom_production (
  id SERIAL PRIMARY KEY,
  entry_date TEXT NOT NULL,
  shift TEXT NOT NULL,
  loom_no TEXT NOT NULL,
  quality TEXT NOT NULL DEFAULT '',
  cuts DOUBLE PRECISION NOT NULL DEFAULT 0,
  meters DOUBLE PRECISION NOT NULL DEFAULT 0,
  weaver_name TEXT NOT NULL DEFAULT '',
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- SEED DEFAULT ROLES & ADMIN USER (ANKANA ONLY) IN POSTGRESQL
INSERT INTO roles (name, description, is_admin) VALUES
  ('Super Admin', '', 1),
  ('Mill Manager', '', 0),
  ('Spinning & Prep Supervisor', '', 0),
  ('Beaming & Loom Supervisor', '', 0),
  ('Finishing & Packing Officer', '', 0)
ON CONFLICT (name) DO UPDATE SET description = '';

INSERT INTO users (username, password_hash, full_name, employee_code, department, role_id, is_active)
SELECT 'admin', 'admin123', 'ANKANA', 'BJM-001', 'All Departments', id, 1
FROM roles WHERE name = 'Super Admin'
ON CONFLICT (username) DO UPDATE SET full_name = 'ANKANA';

DELETE FROM user_permissions
WHERE user_id IN (SELECT id FROM users WHERE username IN ('manager', 'spinning_sup', 'loom_sup', 'finishing_op'));

DELETE FROM users
WHERE username IN ('manager', 'spinning_sup', 'loom_sup', 'finishing_op');
`;

export interface PostgresStatus {
  connected: boolean;
  host: string;
  port: number;
  database: string;
  user: string;
  tableCount: number;
  message: string;
  lastChecked: string;
}

export let currentPostgresStatus: PostgresStatus = {
  connected: false,
  host: process.env.PGHOST || '127.0.0.1',
  port: Number(process.env.PGPORT || 5432),
  database: 'production',
  user: process.env.PGUSER || 'postgres',
  tableCount: 0,
  message: 'Using built-in production database (Ready to auto-create in PostgreSQL on 192.168.1.6)',
  lastChecked: new Date().toISOString(),
};

// Ordered list of all tables in "production" respecting foreign-key dependencies
const ORDERED_SYNC_TABLES = [
  'roles',
  'users',
  'role_permissions',
  'user_permissions',
  'audit_logs',
  'carding_log_book',
  'carding_machine_breakdown',
  'carding_pile_stock',
  'cutting_shifts',
  'cutting_production_rows',
  'cutting_masters',
  'cutting_settings',
  'damping_shifts',
  'damping_production_rows',
  'damping_masters',
  'damping_settings',
  'hemming_shifts',
  'hemming_production_rows',
  'hemming_masters',
  'herackle_records',
  'herackle_rows',
  'herackle_masters',
  'lapping_production',
  'narrow_beaming_rounds',
  'narrow_beaming_logs',
  'narrow_beaming_production',
  'narrow_loom_logbook',
  'narrow_loom_production',
  'pre_beaming_rounds',
  'pre_beaming_logs',
  'pre_beaming_production',
  'press_bales',
  'press_options',
  's4_beaming_logbook',
  's4_beaming_production',
  's4_beaming_verification',
  's4_beaming_purchase_orders',
  's4_loom_logbook',
  's4_loom_production',
  's4_loom_verification',
  'spinning_logbook',
  'spinning_breakdown',
  'spinning_production',
  'spreader_logbook',
  'spreader_breakdown',
  'spreader_meter_reading',
  'spreader_roll_production',
  'vl_beaming_logbook',
  'vl_beaming_rounds',
  'vl_beaming_production',
  'vl_loom_logbook',
  'vl_loom_production',
];

function escapePgLiteral(val: any): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') {
    return Number.isFinite(val) ? String(val) : '0';
  }
  if (typeof val === 'boolean') {
    return val ? '1' : '0';
  }
  const str = String(val).replace(/'/g, "''");
  return `'${str}'`;
}

function buildTableSyncSql(sqliteDb: any, tableNames?: string[]): string {
  const targetSet = tableNames && tableNames.length > 0 ? new Set(tableNames) : null;
  // If syncing users or role_permissions or user_permissions, include parent tables so FK constraints are satisfied
  if (targetSet) {
    if (targetSet.has('user_permissions') || targetSet.has('users')) {
      targetSet.add('roles');
      targetSet.add('users');
    }
    if (targetSet.has('role_permissions')) {
      targetSet.add('roles');
    }
  }

  const tablesToSync = ORDERED_SYNC_TABLES.filter((t) => !targetSet || targetSet.has(t));
  const statements: string[] = ['BEGIN;'];

  // Delete in reverse order to respect foreign keys
  for (const tbl of [...tablesToSync].reverse()) {
    statements.push(`DELETE FROM "${tbl}";`);
  }

  // Insert in forward order
  for (const tbl of tablesToSync) {
    let rows: any[] = [];
    let cols: { name: string }[] = [];
    try {
      cols = sqliteDb.prepare(`PRAGMA table_info("${tbl}")`).all() as { name: string }[];
      rows = sqliteDb.prepare(`SELECT * FROM "${tbl}"`).all() as any[];
    } catch {
      continue;
    }
    if (cols.length === 0 || rows.length === 0) continue;

    const colNames = cols.map((c) => `"${c.name}"`).join(', ');
    for (const row of rows) {
      const vals = cols.map((c) => escapePgLiteral(row[c.name])).join(', ');
      statements.push(`INSERT INTO "${tbl}" (${colNames}) VALUES (${vals});`);
    }

    const hasId = cols.some((c) => c.name === 'id');
    if (hasId) {
      statements.push(
        `SELECT setval(pg_get_serial_sequence('"${tbl}"', 'id'), COALESCE((SELECT MAX(id) FROM "${tbl}"), 1), true);`
      );
    }
  }

  statements.push('COMMIT;');
  return statements.join('\n');
}

async function runPostgresSql(
  sqlText: string,
  targetDatabase: 'postgres' | 'production' = 'production',
  customConfig?: { host?: string; port?: number; user?: string; password?: string }
): Promise<{ ok: boolean; rows?: any[]; error?: string }> {
  const host = customConfig?.host || process.env.PGHOST || '127.0.0.1';
  const port = Number(customConfig?.port || process.env.PGPORT || 5432);
  const user = customConfig?.user || process.env.PGUSER || 'postgres';
  const password = customConfig?.password ?? process.env.PGPASSWORD ?? '';

  // Try 1: TCP connection via pg.Client
  const tcpClient = new Client({
    host,
    port,
    user,
    password,
    database: targetDatabase,
    connectionTimeoutMillis: 2500,
  });
  try {
    await tcpClient.connect();
    const res = await tcpClient.query(sqlText);
    await tcpClient.end();
    return { ok: true, rows: res?.rows || [] };
  } catch (tcpErr: any) {
    try {
      await tcpClient.end();
    } catch {}

    // Try 2: Local Unix domain socket (/var/run/postgresql) for peer auth on Ubuntu
    const socketClient = new Client({
      host: '/var/run/postgresql',
      port,
      user,
      password,
      database: targetDatabase,
      connectionTimeoutMillis: 2500,
    });
    try {
      await socketClient.connect();
      const res = await socketClient.query(sqlText);
      await socketClient.end();
      return { ok: true, rows: res?.rows || [] };
    } catch {
      try {
        await socketClient.end();
      } catch {}
    }

    // Try 3: Non-interactive psql / sudo -n -u postgres psql fallback on Ubuntu
    try {
      const { execFileSync } = await import('child_process');
      const tmpFile = path.resolve(process.cwd(), `.pg_sync_${Date.now()}_${Math.random().toString(36).slice(2)}.sql`);
      fs.writeFileSync(tmpFile, sqlText, 'utf8');
      try {
        try {
          execFileSync('psql', ['-U', user, '-d', targetDatabase, '-f', tmpFile], {
            stdio: 'pipe',
            timeout: 5000,
          });
          fs.unlinkSync(tmpFile);
          return { ok: true, rows: [] };
        } catch {
          execFileSync('sudo', ['-n', '-u', 'postgres', 'psql', '-d', targetDatabase, '-f', tmpFile], {
            stdio: 'pipe',
            timeout: 5000,
          });
          fs.unlinkSync(tmpFile);
          return { ok: true, rows: [] };
        }
      } catch (cliErr: any) {
        try {
          fs.unlinkSync(tmpFile);
        } catch {}
        return { ok: false, error: tcpErr?.message || cliErr?.message || 'PostgreSQL connection failed' };
      }
    } catch {
      return { ok: false, error: tcpErr?.message || 'PostgreSQL connection failed' };
    }
  }
}

export async function syncSqliteTablesToPostgres(
  sqliteDb: any,
  tableNames?: string[]
): Promise<boolean> {
  if (!sqliteDb) return false;
  try {
    const syncSql = buildTableSyncSql(sqliteDb, tableNames);
    const res = await runPostgresSql(syncSql, 'production');
    if (res.ok) {
      currentPostgresStatus.connected = true;
      currentPostgresStatus.lastChecked = new Date().toISOString();
    }
    return res.ok;
  } catch {
    return false;
  }
}

export function writePostgresHelperFiles() {
  try {
    fs.writeFileSync(
      path.resolve(process.cwd(), 'production_postgres_schema.sql'),
      POSTGRES_PRODUCTION_SCHEMA_SQL.trim() + '\n'
    );

    const scriptContent = `#!/usr/bin/env bash
# ============================================================================
# BALLY JUTE MILL ERP - BEGINNER AUTO-SETUP FOR UBUNTU (192.168.1.6:3002)
# Safely creates "production" database in your existing PostgreSQL (BJCL)
# WITHOUT touching or disturbing "SQC" or "bjcl_db"!
# ============================================================================
set -e

echo "=================================================================="
echo " STEP 1: Creating 'production' database in PostgreSQL (BJCL)"
echo " (Existing databases 'SQC' and 'bjcl_db' will NOT be touched)"
echo "=================================================================="

if command -v psql >/dev/null 2>&1; then
  sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = 'production'" | grep -q 1 || sudo -u postgres psql -c "CREATE DATABASE production;"
  echo "-> Database 'production' is ready!"

  echo "=================================================================="
  echo " STEP 2: Creating all 52 Department & Admin Tables in 'production'"
  echo "=================================================================="
  sudo -u postgres psql -d production -f production_postgres_schema.sql
  echo "-> All 52 tables and fields created in PostgreSQL 'production'!"
else
  echo "-> Note: psql CLI not found in PATH, using built-in Node auto-provisioner."
fi

echo "=================================================================="
echo " STEP 3: Installing packages & building web app for Port 3002"
echo "=================================================================="
npm install
npm run build

# Allow port 3002 on firewall if active
if command -v ufw >/dev/null 2>&1; then
  sudo ufw allow 3002/tcp || true
fi

echo "=================================================================="
echo " STEP 4: Starting Server on http://192.168.1.6:3002"
echo "=================================================================="
PORT=3002 SECONDARY_PORT=3002 NODE_ENV=production npx tsx server.ts
`;
    fs.writeFileSync(
      path.resolve(process.cwd(), 'setup-postgres-production.sh'),
      scriptContent,
      { mode: 0o755 }
    );
  } catch {
    // ignore read-only fs errors
  }
}

export async function autoProvisionPostgresDatabase(
  sqliteDb?: any,
  customConfig?: {
    host?: string;
    port?: number;
    user?: string;
    password?: string;
  }
): Promise<PostgresStatus> {
  const host = customConfig?.host || process.env.PGHOST || '127.0.0.1';
  const port = Number(customConfig?.port || process.env.PGPORT || 5432);
  const user = customConfig?.user || process.env.PGUSER || 'postgres';
  const password = customConfig?.password ?? process.env.PGPASSWORD ?? '';

  // Step 1: Ensure 'production' database exists
  const adminClient = new Client({
    host,
    port,
    user,
    password,
    database: 'postgres',
    connectionTimeoutMillis: 3000,
  });

  try {
    await adminClient.connect();
    const checkRes = await adminClient.query(
      "SELECT 1 FROM pg_database WHERE datname = 'production'"
    );
    if (checkRes.rowCount === 0) {
      await adminClient.query('CREATE DATABASE production');
    }
    await adminClient.end();
  } catch {
    try {
      await adminClient.end();
    } catch {}
    // Try creating via psql if local Ubuntu peer auth is active
    try {
      const { execSync } = await import('child_process');
      execSync(
        `sudo -n -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = 'production'" | grep -q 1 || sudo -n -u postgres psql -c "CREATE DATABASE production;"`,
        { stdio: 'pipe', timeout: 4000 }
      );
    } catch {
      // ignore if sudo/psql not available
    }
  }

  // Step 2: Run schema creation in 'production' database
  const schemaRes = await runPostgresSql(POSTGRES_PRODUCTION_SCHEMA_SQL, 'production', {
    host,
    port,
    user,
    password,
  });

  if (schemaRes.ok) {
    process.env.PGHOST = host;
    process.env.PGPORT = String(port);
    process.env.PGUSER = user;
    process.env.PGPASSWORD = password;

    if (sqliteDb) {
      await syncSqliteTablesToPostgres(sqliteDb);
    }

    currentPostgresStatus = {
      connected: true,
      host,
      port,
      database: 'production',
      user,
      tableCount: ORDERED_SYNC_TABLES.length,
      message: `Connected to PostgreSQL (${host}:${port}) · Database "production" & ${ORDERED_SYNC_TABLES.length} tables live-synced!`,
      lastChecked: new Date().toISOString(),
    };
    return currentPostgresStatus;
  }

  currentPostgresStatus = {
    connected: false,
    host,
    port,
    database: 'production',
    user,
    tableCount: ORDERED_SYNC_TABLES.length,
    message:
      schemaRes.error ||
      'PostgreSQL not reachable from current container; using built-in production database.',
    lastChecked: new Date().toISOString(),
  };
  return currentPostgresStatus;
}
