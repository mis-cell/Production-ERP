import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

export interface ModuleDefinition {
  key: string;
  docIndex: number;
  name: string;
  shortName: string;
  category: 'Spinning & Prep' | 'Beaming' | 'Weaving & Looms' | 'Finishing & Packing';
  description: string;
  tables: string[];
}

export const MODULES: ModuleDefinition[] = [
  {
    key: 'carding',
    docIndex: 0,
    name: 'Carding Department',
    shortName: 'Carding',
    category: 'Spinning & Prep',
    description: 'Shift Log Book, Machine Breakdown Tracking & Pile Stock Management',
    tables: ['carding_log_book', 'carding_machine_breakdown', 'carding_pile_stock'],
  },
  {
    key: 'cutting',
    docIndex: 1,
    name: 'Cutting Department',
    shortName: 'Cutting',
    category: 'Finishing & Packing',
    description: 'Shift Cutting Production, Attendance, Machine Allocations & Rate Masters',
    tables: ['cutting_shifts', 'cutting_production_rows', 'cutting_masters', 'cutting_settings'],
  },
  {
    key: 'damping',
    docIndex: 2,
    name: 'Damping Department',
    shortName: 'Damping',
    category: 'Finishing & Packing',
    description: 'Cloth Damping Shift Entries, Bundle Weights & Operator Masters',
    tables: ['damping_shifts', 'damping_production_rows', 'damping_masters', 'damping_settings'],
  },
  {
    key: 'hemming',
    docIndex: 3,
    name: 'Hemming Department',
    shortName: 'Hemming',
    category: 'Finishing & Packing',
    description: 'Sewing & Hemming Line Shift Entry, Worker Output & Quality Masters',
    tables: ['hemming_shifts', 'hemming_production_rows', 'hemming_masters'],
  },
  {
    key: 'herackle',
    docIndex: 4,
    name: 'Herackle Production',
    shortName: 'Herackle',
    category: 'Finishing & Packing',
    description: 'Herackle Stitching Shift Records, Target Comparison & Summary Reports',
    tables: ['herackle_records', 'herackle_rows', 'herackle_masters'],
  },
  {
    key: 'lapping',
    docIndex: 5,
    name: 'Lapping Production',
    shortName: 'Lapping',
    category: 'Finishing & Packing',
    description: 'Lapping Machine Production Entries, Operator Cuts & Shift Reports',
    tables: ['lapping_production'],
  },
  {
    key: 'narrow_beaming',
    docIndex: 6,
    name: 'Narrow Beaming',
    shortName: 'Narrow Beaming',
    category: 'Beaming',
    description: 'Narrow Beam Round Tracking, Cut Verification, Shift Log & Analytics',
    tables: ['narrow_beaming_rounds', 'narrow_beaming_logs', 'narrow_beaming_production'],
  },
  {
    key: 'narrow_loom',
    docIndex: 7,
    name: 'Narrow Loom Department',
    shortName: 'Narrow Loom',
    category: 'Weaving & Looms',
    description: 'Narrow Loom Shift Logbook, Loom-wise Meter/Cut Production & Efficiency',
    tables: ['narrow_loom_logbook', 'narrow_loom_production'],
  },
  {
    key: 'pre_beaming',
    docIndex: 8,
    name: 'Pre Beaming Department',
    shortName: 'Pre Beaming',
    category: 'Beaming',
    description: 'Pre-Beam Round Management, Beam Status, Verification & Production Logs',
    tables: ['pre_beaming_rounds', 'pre_beaming_logs', 'pre_beaming_production'],
  },
  {
    key: 'press',
    docIndex: 9,
    name: 'Press Department (Bale Packing)',
    shortName: 'Press & Baling',
    category: 'Finishing & Packing',
    description: 'Bale Serial Generation, Press Packing Weight Entry & Dispatch Summary',
    tables: ['press_bales', 'press_options'],
  },
  {
    key: 's4_beaming',
    docIndex: 10,
    name: 'S4 Beaming Department',
    shortName: 'S4 Beaming',
    category: 'Beaming',
    description: 'S4 Beam Machine Logbook, Purchase Order Color Tracking & Round Verification',
    tables: ['s4_beaming_logbook', 's4_beaming_production', 's4_beaming_verification', 's4_beaming_purchase_orders'],
  },
  {
    key: 's4_loom',
    docIndex: 11,
    name: 'S4 Loom Department',
    shortName: 'S4 Loom',
    category: 'Weaving & Looms',
    description: '336-Loom Shift Logbook, Meter Production, Cut Verification & Loom Reports',
    tables: ['s4_loom_logbook', 's4_loom_production', 's4_loom_verification'],
  },
  {
    key: 'spinning',
    docIndex: 12,
    name: 'Spinning Department',
    shortName: 'Spinning',
    category: 'Spinning & Prep',
    description: 'Spinning Frame Log Book, Machine Breakdowns & Frame Production Reports',
    tables: ['spinning_logbook', 'spinning_breakdown', 'spinning_production'],
  },
  {
    key: 'spreader',
    docIndex: 13,
    name: 'Spreader & Softener Department',
    shortName: 'Spreader & Softener',
    category: 'Spinning & Prep',
    description: 'Spreader Logbook, Meter Readings, Roll Production & Breakdown Register',
    tables: ['spreader_logbook', 'spreader_breakdown', 'spreader_meter_reading', 'spreader_roll_production'],
  },
  {
    key: 'vl_beaming',
    docIndex: 14,
    name: 'VL Beaming Department',
    shortName: 'VL Beaming',
    category: 'Beaming',
    description: 'VL Beam Round State, Operator Shift Logs, Verification & Summary Reports',
    tables: ['vl_beaming_logbook', 'vl_beaming_rounds', 'vl_beaming_production'],
  },
  {
    key: 'vl_loom',
    docIndex: 15,
    name: 'VL Loom Department',
    shortName: 'VL Loom',
    category: 'Weaving & Looms',
    description: 'VL Loom Group Logbooks, Loom Production Entries & Shift Analytics',
    tables: ['vl_loom_logbook', 'vl_loom_production'],
  },
];

const DB_PATH = path.resolve(process.cwd(), 'production.db');
export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export const PRODUCTION_SCHEMA_SQL = `
-- ============================================================================
-- BALLY JUTE MILL ERP - "production" DATABASE SCHEMA
-- Auto-created by server on startup (SQLite / Ubuntu 24 Ready)
-- ============================================================================

CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  is_admin INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  employee_code TEXT NOT NULL DEFAULT '',
  department TEXT NOT NULL DEFAULT 'All',
  role_id INTEGER NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  last_login TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE IF NOT EXISTS role_permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_id INTEGER NOT NULL,
  module_key TEXT NOT NULL,
  can_view INTEGER NOT NULL DEFAULT 1,
  can_create INTEGER NOT NULL DEFAULT 1,
  can_edit INTEGER NOT NULL DEFAULT 1,
  can_delete INTEGER NOT NULL DEFAULT 0,
  can_report INTEGER NOT NULL DEFAULT 1,
  UNIQUE(role_id, module_key),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

-- User-specific permission overrides:
-- override_mode: 'inherit' | 'grant' | 'revoke'
CREATE TABLE IF NOT EXISTS user_permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  module_key TEXT NOT NULL,
  override_mode TEXT NOT NULL DEFAULT 'inherit',
  can_view INTEGER NOT NULL DEFAULT 1,
  can_create INTEGER NOT NULL DEFAULT 1,
  can_edit INTEGER NOT NULL DEFAULT 0,
  can_delete INTEGER NOT NULL DEFAULT 0,
  can_report INTEGER NOT NULL DEFAULT 1,
  UNIQUE(user_id, module_key),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  username TEXT NOT NULL,
  module_key TEXT NOT NULL,
  action_name TEXT NOT NULL,
  details TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 1. CARDING DEPARTMENT TABLES
CREATE TABLE IF NOT EXISTS carding_log_book (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_date TEXT NOT NULL,
  shift TEXT NOT NULL,
  machine_type TEXT NOT NULL DEFAULT '',
  machine_no TEXT NOT NULL DEFAULT '',
  quality TEXT NOT NULL DEFAULT '',
  operator_name TEXT NOT NULL DEFAULT '',
  production_mt REAL NOT NULL DEFAULT 0,
  remarks TEXT NOT NULL DEFAULT '',
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_by TEXT NOT NULL DEFAULT 'system',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS carding_machine_breakdown (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_date TEXT NOT NULL,
  shift TEXT NOT NULL,
  machine_no TEXT NOT NULL,
  stop_time TEXT NOT NULL DEFAULT '',
  start_time TEXT NOT NULL DEFAULT '',
  duration_mins REAL NOT NULL DEFAULT 0,
  reason TEXT NOT NULL DEFAULT '',
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_by TEXT NOT NULL DEFAULT 'system',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS carding_pile_stock (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_date TEXT NOT NULL,
  shift TEXT NOT NULL,
  pile_type TEXT NOT NULL DEFAULT '',
  opening_stock REAL NOT NULL DEFAULT 0,
  received_qty REAL NOT NULL DEFAULT 0,
  consumed_qty REAL NOT NULL DEFAULT 0,
  closing_stock REAL NOT NULL DEFAULT 0,
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_by TEXT NOT NULL DEFAULT 'system',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 2. CUTTING DEPARTMENT TABLES
CREATE TABLE IF NOT EXISTS cutting_shifts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shift_date TEXT NOT NULL,
  shift_name TEXT NOT NULL,
  supervisor TEXT NOT NULL DEFAULT '',
  attendance_count INTEGER NOT NULL DEFAULT 0,
  total_cuts REAL NOT NULL DEFAULT 0,
  total_mt REAL NOT NULL DEFAULT 0,
  payload_json TEXT NOT NULL DEFAULT '{}',
  updated_by TEXT NOT NULL DEFAULT 'system',
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(shift_date, shift_name)
);

CREATE TABLE IF NOT EXISTS cutting_production_rows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shift_date TEXT NOT NULL,
  shift_name TEXT NOT NULL,
  machine_no TEXT NOT NULL DEFAULT '',
  quality TEXT NOT NULL DEFAULT '',
  cuts REAL NOT NULL DEFAULT 0,
  weight_mt REAL NOT NULL DEFAULT 0,
  operator_name TEXT NOT NULL DEFAULT '',
  row_json TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS cutting_masters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
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
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shift_date TEXT NOT NULL,
  shift_name TEXT NOT NULL,
  supervisor TEXT NOT NULL DEFAULT '',
  total_rolls REAL NOT NULL DEFAULT 0,
  total_weight REAL NOT NULL DEFAULT 0,
  payload_json TEXT NOT NULL DEFAULT '{}',
  updated_by TEXT NOT NULL DEFAULT 'system',
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(shift_date, shift_name)
);

CREATE TABLE IF NOT EXISTS damping_production_rows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shift_date TEXT NOT NULL,
  shift_name TEXT NOT NULL,
  machine_no TEXT NOT NULL DEFAULT '',
  quality TEXT NOT NULL DEFAULT '',
  rolls REAL NOT NULL DEFAULT 0,
  weight_kg REAL NOT NULL DEFAULT 0,
  row_json TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS damping_masters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
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
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shift_date TEXT NOT NULL,
  shift_name TEXT NOT NULL,
  supervisor TEXT NOT NULL DEFAULT '',
  total_bags REAL NOT NULL DEFAULT 0,
  total_mt REAL NOT NULL DEFAULT 0,
  payload_json TEXT NOT NULL DEFAULT '{}',
  updated_by TEXT NOT NULL DEFAULT 'system',
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(shift_date, shift_name)
);

CREATE TABLE IF NOT EXISTS hemming_production_rows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shift_date TEXT NOT NULL,
  shift_name TEXT NOT NULL,
  machine_no TEXT NOT NULL DEFAULT '',
  quality TEXT NOT NULL DEFAULT '',
  bags REAL NOT NULL DEFAULT 0,
  weight_mt REAL NOT NULL DEFAULT 0,
  row_json TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS hemming_masters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  extra_json TEXT NOT NULL DEFAULT '{}'
);

-- 5. HERACKLE PRODUCTION TABLES
CREATE TABLE IF NOT EXISTS herackle_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  record_date TEXT NOT NULL,
  shift_name TEXT NOT NULL,
  supervisor TEXT NOT NULL DEFAULT '',
  total_qty REAL NOT NULL DEFAULT 0,
  total_weight REAL NOT NULL DEFAULT 0,
  payload_json TEXT NOT NULL DEFAULT '{}',
  updated_by TEXT NOT NULL DEFAULT 'system',
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(record_date, shift_name)
);

CREATE TABLE IF NOT EXISTS herackle_rows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  record_date TEXT NOT NULL,
  shift_name TEXT NOT NULL,
  machine_no TEXT NOT NULL DEFAULT '',
  quality TEXT NOT NULL DEFAULT '',
  qty REAL NOT NULL DEFAULT 0,
  weight_mt REAL NOT NULL DEFAULT 0,
  row_json TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS herackle_masters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  extra_json TEXT NOT NULL DEFAULT '{}'
);

-- 6. LAPPING PRODUCTION TABLE
CREATE TABLE IF NOT EXISTS lapping_production (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_date TEXT NOT NULL,
  shift TEXT NOT NULL,
  machine_no TEXT NOT NULL DEFAULT '',
  operator_name TEXT NOT NULL DEFAULT '',
  quality TEXT NOT NULL DEFAULT '',
  cuts REAL NOT NULL DEFAULT 0,
  meters REAL NOT NULL DEFAULT 0,
  weight_kg REAL NOT NULL DEFAULT 0,
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_by TEXT NOT NULL DEFAULT 'system',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 7. NARROW BEAMING TABLES
CREATE TABLE IF NOT EXISTS narrow_beaming_rounds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  round_id TEXT NOT NULL UNIQUE,
  machine_no TEXT NOT NULL DEFAULT 'NB-01',
  quality TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'OPEN',
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  closed_at TEXT,
  total_cuts REAL NOT NULL DEFAULT 0,
  total_meters REAL NOT NULL DEFAULT 0,
  raw_json TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS narrow_beaming_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_date TEXT NOT NULL,
  shift TEXT NOT NULL,
  machine_no TEXT NOT NULL DEFAULT '',
  beam_no TEXT NOT NULL DEFAULT '',
  quality TEXT NOT NULL DEFAULT '',
  operator_name TEXT NOT NULL DEFAULT '',
  cuts REAL NOT NULL DEFAULT 0,
  meters REAL NOT NULL DEFAULT 0,
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS narrow_beaming_production (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  round_id TEXT NOT NULL,
  entry_date TEXT NOT NULL,
  shift TEXT NOT NULL,
  machine_no TEXT NOT NULL DEFAULT '',
  beam_no TEXT NOT NULL DEFAULT '',
  quality TEXT NOT NULL DEFAULT '',
  cuts REAL NOT NULL DEFAULT 0,
  meters REAL NOT NULL DEFAULT 0,
  operator_name TEXT NOT NULL DEFAULT '',
  verified INTEGER NOT NULL DEFAULT 0,
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 8. NARROW LOOM TABLES
CREATE TABLE IF NOT EXISTS narrow_loom_logbook (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_date TEXT NOT NULL,
  shift TEXT NOT NULL,
  loom_no TEXT NOT NULL DEFAULT '',
  quality TEXT NOT NULL DEFAULT '',
  beam_no TEXT NOT NULL DEFAULT '',
  weaver_name TEXT NOT NULL DEFAULT '',
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS narrow_loom_production (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_date TEXT NOT NULL,
  shift TEXT NOT NULL,
  loom_no TEXT NOT NULL DEFAULT '',
  quality TEXT NOT NULL DEFAULT '',
  cuts REAL NOT NULL DEFAULT 0,
  meters REAL NOT NULL DEFAULT 0,
  efficiency REAL NOT NULL DEFAULT 0,
  weaver_name TEXT NOT NULL DEFAULT '',
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 9. PRE BEAMING TABLES
CREATE TABLE IF NOT EXISTS pre_beaming_rounds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  round_id TEXT NOT NULL UNIQUE,
  machine_no TEXT NOT NULL DEFAULT 'PB-01',
  quality TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'OPEN',
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  closed_at TEXT,
  total_beams INTEGER NOT NULL DEFAULT 0,
  total_meters REAL NOT NULL DEFAULT 0,
  raw_json TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS pre_beaming_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_date TEXT NOT NULL,
  shift TEXT NOT NULL,
  machine_no TEXT NOT NULL DEFAULT '',
  beam_no TEXT NOT NULL DEFAULT '',
  quality TEXT NOT NULL DEFAULT '',
  meters REAL NOT NULL DEFAULT 0,
  operator_name TEXT NOT NULL DEFAULT '',
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pre_beaming_production (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  round_id TEXT NOT NULL,
  entry_date TEXT NOT NULL,
  shift TEXT NOT NULL,
  machine_no TEXT NOT NULL DEFAULT '',
  beam_no TEXT NOT NULL DEFAULT '',
  quality TEXT NOT NULL DEFAULT '',
  meters REAL NOT NULL DEFAULT 0,
  weight_kg REAL NOT NULL DEFAULT 0,
  operator_name TEXT NOT NULL DEFAULT '',
  verified INTEGER NOT NULL DEFAULT 0,
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 10. PRESS DEPARTMENT TABLES
CREATE TABLE IF NOT EXISTS press_bales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bale_serial TEXT NOT NULL UNIQUE,
  entry_date TEXT NOT NULL,
  shift TEXT NOT NULL,
  press_no TEXT NOT NULL DEFAULT 'Press-1',
  quality TEXT NOT NULL DEFAULT '',
  buyer_mark TEXT NOT NULL DEFAULT '',
  bags_per_bale INTEGER NOT NULL DEFAULT 500,
  gross_wt_kg REAL NOT NULL DEFAULT 0,
  tare_wt_kg REAL NOT NULL DEFAULT 0,
  net_wt_kg REAL NOT NULL DEFAULT 0,
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_by TEXT NOT NULL DEFAULT 'system',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS press_options (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  option_type TEXT NOT NULL,
  option_value TEXT NOT NULL,
  extra_json TEXT NOT NULL DEFAULT '{}'
);

-- 11. S4 BEAMING TABLES
CREATE TABLE IF NOT EXISTS s4_beaming_logbook (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_date TEXT NOT NULL,
  shift TEXT NOT NULL,
  machine_no TEXT NOT NULL,
  order_color TEXT NOT NULL DEFAULT '',
  quality TEXT NOT NULL DEFAULT '',
  operator_name TEXT NOT NULL DEFAULT '',
  opening_meter REAL NOT NULL DEFAULT 0,
  closing_meter REAL NOT NULL DEFAULT 0,
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS s4_beaming_production (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_date TEXT NOT NULL,
  shift TEXT NOT NULL,
  machine_no TEXT NOT NULL,
  round_no TEXT NOT NULL DEFAULT 'R-1',
  beam_no TEXT NOT NULL DEFAULT '',
  order_color TEXT NOT NULL DEFAULT '',
  meters REAL NOT NULL DEFAULT 0,
  cuts REAL NOT NULL DEFAULT 0,
  operator_name TEXT NOT NULL DEFAULT '',
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS s4_beaming_verification (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_date TEXT NOT NULL,
  machine_no TEXT NOT NULL,
  round_no TEXT NOT NULL,
  verified_meters REAL NOT NULL DEFAULT 0,
  variance_meters REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'VERIFIED',
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS s4_beaming_purchase_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  po_number TEXT NOT NULL,
  order_color TEXT NOT NULL,
  quality TEXT NOT NULL DEFAULT '',
  target_meters REAL NOT NULL DEFAULT 0,
  produced_meters REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 12. S4 LOOM TABLES
CREATE TABLE IF NOT EXISTS s4_loom_logbook (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_date TEXT NOT NULL,
  shift TEXT NOT NULL,
  loom_no TEXT NOT NULL,
  quality TEXT NOT NULL DEFAULT '',
  weaver_name TEXT NOT NULL DEFAULT '',
  beam_no TEXT NOT NULL DEFAULT '',
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS s4_loom_production (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_date TEXT NOT NULL,
  shift TEXT NOT NULL,
  loom_no TEXT NOT NULL,
  quality TEXT NOT NULL DEFAULT '',
  opening_reading REAL NOT NULL DEFAULT 0,
  closing_reading REAL NOT NULL DEFAULT 0,
  net_meters REAL NOT NULL DEFAULT 0,
  cuts REAL NOT NULL DEFAULT 0,
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS s4_loom_verification (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_date TEXT NOT NULL,
  shift TEXT NOT NULL,
  loom_no TEXT NOT NULL,
  book_meters REAL NOT NULL DEFAULT 0,
  actual_meters REAL NOT NULL DEFAULT 0,
  diff_meters REAL NOT NULL DEFAULT 0,
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 13. SPINNING DEPARTMENT TABLES
CREATE TABLE IF NOT EXISTS spinning_logbook (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_date TEXT NOT NULL,
  shift TEXT NOT NULL,
  frame_no TEXT NOT NULL,
  quality_count TEXT NOT NULL DEFAULT '',
  rpm REAL NOT NULL DEFAULT 0,
  tpi REAL NOT NULL DEFAULT 0,
  operator_name TEXT NOT NULL DEFAULT '',
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS spinning_breakdown (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_date TEXT NOT NULL,
  shift TEXT NOT NULL,
  frame_no TEXT NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  down_mins REAL NOT NULL DEFAULT 0,
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS spinning_production (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_date TEXT NOT NULL,
  shift TEXT NOT NULL,
  frame_no TEXT NOT NULL,
  quality_count TEXT NOT NULL DEFAULT '',
  doffs INTEGER NOT NULL DEFAULT 0,
  production_kg REAL NOT NULL DEFAULT 0,
  efficiency REAL NOT NULL DEFAULT 0,
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 14. SPREADER & SOFTENER TABLES
CREATE TABLE IF NOT EXISTS spreader_logbook (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_date TEXT NOT NULL,
  shift TEXT NOT NULL,
  machine_no TEXT NOT NULL,
  grade_mix TEXT NOT NULL DEFAULT '',
  emulsion_pct REAL NOT NULL DEFAULT 0,
  operator_name TEXT NOT NULL DEFAULT '',
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS spreader_breakdown (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_date TEXT NOT NULL,
  shift TEXT NOT NULL,
  machine_no TEXT NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  duration_mins REAL NOT NULL DEFAULT 0,
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS spreader_meter_reading (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_date TEXT NOT NULL,
  shift TEXT NOT NULL,
  machine_no TEXT NOT NULL,
  opening_reading REAL NOT NULL DEFAULT 0,
  closing_reading REAL NOT NULL DEFAULT 0,
  net_reading REAL NOT NULL DEFAULT 0,
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS spreader_roll_production (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_date TEXT NOT NULL,
  shift TEXT NOT NULL,
  machine_no TEXT NOT NULL,
  quality TEXT NOT NULL DEFAULT '',
  rolls_count INTEGER NOT NULL DEFAULT 0,
  weight_mt REAL NOT NULL DEFAULT 0,
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 15. VL BEAMING TABLES
CREATE TABLE IF NOT EXISTS vl_beaming_logbook (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_date TEXT NOT NULL,
  shift TEXT NOT NULL,
  machine_no TEXT NOT NULL DEFAULT 'VLB-01',
  beam_no TEXT NOT NULL DEFAULT '',
  quality TEXT NOT NULL DEFAULT '',
  operator_name TEXT NOT NULL DEFAULT '',
  meters REAL NOT NULL DEFAULT 0,
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS vl_beaming_rounds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  round_no TEXT NOT NULL UNIQUE,
  machine_no TEXT NOT NULL DEFAULT 'VLB-01',
  quality TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'OPEN',
  total_meters REAL NOT NULL DEFAULT 0,
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS vl_beaming_production (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  round_no TEXT NOT NULL DEFAULT 'VLR-101',
  entry_date TEXT NOT NULL,
  shift TEXT NOT NULL,
  machine_no TEXT NOT NULL DEFAULT 'VLB-01',
  beam_no TEXT NOT NULL DEFAULT '',
  quality TEXT NOT NULL DEFAULT '',
  cuts REAL NOT NULL DEFAULT 0,
  meters REAL NOT NULL DEFAULT 0,
  operator_name TEXT NOT NULL DEFAULT '',
  verified INTEGER NOT NULL DEFAULT 0,
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 16. VL LOOM TABLES
CREATE TABLE IF NOT EXISTS vl_loom_logbook (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id TEXT NOT NULL,
  entry_date TEXT NOT NULL,
  shift TEXT NOT NULL,
  loom_no TEXT NOT NULL,
  quality TEXT NOT NULL DEFAULT '',
  beam_no TEXT NOT NULL DEFAULT '',
  weaver_name TEXT NOT NULL DEFAULT '',
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS vl_loom_production (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_date TEXT NOT NULL,
  shift TEXT NOT NULL,
  loom_no TEXT NOT NULL,
  quality TEXT NOT NULL DEFAULT '',
  cuts REAL NOT NULL DEFAULT 0,
  meters REAL NOT NULL DEFAULT 0,
  weaver_name TEXT NOT NULL DEFAULT '',
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

export function initProductionDatabase() {
  db.exec(PRODUCTION_SCHEMA_SQL);

  // Save schema file and Ubuntu 24 deployment script to workspace root
  try {
    fs.writeFileSync(path.resolve(process.cwd(), 'production_schema.sql'), PRODUCTION_SCHEMA_SQL.trim() + '\n');
    const ubuntuScript = `#!/usr/bin/env bash
# ============================================================================
# BALLY JUTE MILL ERP - UBUNTU 24 LOCAL SERVER DEPLOYMENT SCRIPT (PORT 3002)
# Database: "production" (production.db)
# ============================================================================
set -e

echo "=== Installing Bally Jute Mill Production ERP on Ubuntu 24 (Port 3002) ==="
sudo apt-get update -y
sudo apt-get install -y build-essential python3 sqlite3 curl

# Install Node.js 22 LTS if not present
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

npm install
npm run build

# Open port 3002 on UFW if UFW is active
if command -v ufw >/dev/null 2>&1; then
  sudo ufw allow 3002/tcp || true
fi

# Create systemd service on port 3002 so other web apps are never disturbed
SERVICE_FILE="/etc/systemd/system/bally-jute-production.service"
sudo bash -c "cat > $SERVICE_FILE" <<EOF
[Unit]
Description=Bally Jute Mill Production ERP (Port 3002)
After=network.target

[Service]
Type=simple
WorkingDirectory=$(pwd)
Environment=NODE_ENV=production
Environment=PORT=3002
Environment=SECONDARY_PORT=3002
ExecStart=$(command -v npx) tsx server.ts
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable bally-jute-production.service
sudo systemctl restart bally-jute-production.service

echo "=== Bally Jute Mill ERP is live at http://192.168.1.6:3002 ==="
`;
    fs.writeFileSync(path.resolve(process.cwd(), 'deploy-ubuntu24-port3002.sh'), ubuntuScript, { mode: 0o755 });
  } catch {
    // Ignore file write errors if read-only fs
  }

  seedInitialData();
  ensureAllDepartmentSampleRows();
}

function ensureAllDepartmentSampleRows() {
  const today = new Date().toISOString().slice(0, 10);
  const nlCount = (db.prepare('SELECT COUNT(*) as c FROM narrow_loom_production').get() as { c: number }).c;
  if (nlCount === 0) {
    db.prepare(`
      INSERT INTO narrow_loom_production (entry_date, shift, loom_no, quality, cuts, meters, efficiency, weaver_name, raw_json)
      VALUES (?, 'A', 'NL-01', 'Hessian 40x10', 6.5, 650, 88.4, 'Sanjay Paswan', '{}')
    `).run(today);
  }
  const vlbCount = (db.prepare('SELECT COUNT(*) as c FROM vl_beaming_production').get() as { c: number }).c;
  if (vlbCount === 0) {
    db.prepare(`
      INSERT INTO vl_beaming_production (round_no, entry_date, shift, machine_no, beam_no, quality, cuts, meters, operator_name, verified, raw_json)
      VALUES ('VLR-101', ?, 'A', 'VLB-01', 'VB-14', 'Hessian 40x10', 18, 1800, 'B. K. Shaw', 1, '{}')
    `).run(today);
  }
}

function seedInitialData() {
  const roleCount = (db.prepare('SELECT COUNT(*) as c FROM roles').get() as { c: number }).c;
  if (roleCount > 0) return;

  const today = new Date().toISOString().slice(0, 10);

  // 1. Seed Roles
  const insertRole = db.prepare(
    'INSERT INTO roles (name, description, is_admin) VALUES (?, ?, ?)'
  );
  const superAdminRoleId = Number(
    insertRole.run('Super Admin', 'Full administrative access to all 16 departments, users, roles, and database tables', 1).lastInsertRowid
  );
  const millManagerRoleId = Number(
    insertRole.run('Mill Manager', 'View, create, edit, and run reports across all 16 mill departments', 0).lastInsertRowid
  );
  const spinningSupRoleId = Number(
    insertRole.run('Spinning & Prep Supervisor', 'Supervisor access for Spreader, Carding, and Spinning departments', 0).lastInsertRowid
  );
  const beamingWeavingRoleId = Number(
    insertRole.run('Beaming & Loom Supervisor', 'Supervisor access for Pre/Narrow/S4/VL Beaming and Narrow/S4/VL Looms', 0).lastInsertRowid
  );
  const finishingRoleId = Number(
    insertRole.run('Finishing & Packing Officer', 'Access to Damping, Cutting, Hemming, Herackle, Lapping, and Press departments', 0).lastInsertRowid
  );

  // 2. Seed Role Permissions for all 16 modules
  const insertRolePerm = db.prepare(`
    INSERT INTO role_permissions (role_id, module_key, can_view, can_create, can_edit, can_delete, can_report)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const mod of MODULES) {
    // Super Admin: everything enabled
    insertRolePerm.run(superAdminRoleId, mod.key, 1, 1, 1, 1, 1);
    // Mill Manager: view, create, edit, report across all modules
    insertRolePerm.run(millManagerRoleId, mod.key, 1, 1, 1, 0, 1);
    // Spinning & Prep Supervisor
    const isSpin = mod.category === 'Spinning & Prep';
    insertRolePerm.run(spinningSupRoleId, mod.key, isSpin ? 1 : 0, isSpin ? 1 : 0, isSpin ? 1 : 0, isSpin ? 1 : 0, isSpin ? 1 : 0);
    // Beaming & Loom Supervisor
    const isBeamLoom = mod.category === 'Beaming' || mod.category === 'Weaving & Looms';
    insertRolePerm.run(beamingWeavingRoleId, mod.key, isBeamLoom ? 1 : 0, isBeamLoom ? 1 : 0, isBeamLoom ? 1 : 0, 0, isBeamLoom ? 1 : 0);
    // Finishing & Packing Officer
    const isFinish = mod.category === 'Finishing & Packing';
    insertRolePerm.run(finishingRoleId, mod.key, isFinish ? 1 : 0, isFinish ? 1 : 0, isFinish ? 1 : 0, 0, isFinish ? 1 : 0);
  }

  // 3. Seed Users
  const insertUser = db.prepare(`
    INSERT INTO users (username, password_hash, full_name, employee_code, department, role_id, is_active)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `);
  insertUser.run('admin', 'admin123', 'Rajesh Chatterjee (IT & ERP Admin)', 'BJM-001', 'All Departments', superAdminRoleId);
  insertUser.run('manager', '1234', 'Subir Mukherjee (GM Works)', 'BJM-010', 'All Departments', millManagerRoleId);
  const spinUserId = Number(
    insertUser.run('spinning_sup', '1234', 'Amitava Ghosh (Spinning Incharge)', 'BJM-104', 'Spinning & Prep', spinningSupRoleId).lastInsertRowid
  );
  const beamUserId = Number(
    insertUser.run('loom_sup', '1234', 'Debashis Roy (Weaving Master)', 'BJM-208', 'Beaming & Looms', beamingWeavingRoleId).lastInsertRowid
  );
  insertUser.run('finishing_op', '1234', 'Prabir Sen (Finishing Supervisor)', 'BJM-312', 'Finishing & Packing', finishingRoleId);

  // Example User-Level Permission Override: Grant 'spinning_sup' report/view access to 's4_beaming' even though role is Spinning
  const insertUserPerm = db.prepare(`
    INSERT INTO user_permissions (user_id, module_key, override_mode, can_view, can_create, can_edit, can_delete, can_report)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertUserPerm.run(spinUserId, 's4_beaming', 'grant', 1, 0, 0, 0, 1);
  insertUserPerm.run(beamUserId, 'press', 'grant', 1, 1, 0, 0, 1);

  // 4. Seed realistic sample rows in the 16 department tables
  db.prepare(`
    INSERT INTO carding_log_book (entry_date, shift, machine_type, machine_no, quality, operator_name, production_mt, remarks, raw_json)
    VALUES (?, 'Shift A', 'Breaker Card', 'BC-01', 'B.Twill Warp', 'Ratan Das', 4.85, 'Running normal', ?)
  `).run(today, JSON.stringify({ date: today, shift: 'Shift A', machineType: 'Breaker Card', machineNo: 'BC-01', quality: 'B.Twill Warp', operator: 'Ratan Das', production: 4.85 }));

  db.prepare(`
    INSERT INTO carding_machine_breakdown (entry_date, shift, machine_no, stop_time, start_time, duration_mins, reason, raw_json)
    VALUES (?, 'Shift A', 'FC-04', '08:15', '08:50', 35, 'Drawing Roller Bearing Change', ?)
  `).run(today, JSON.stringify({ date: today, shift: 'Shift A', machineNo: 'FC-04', stopTime: '08:15', startTime: '08:50', duration: 35, reason: 'Drawing Roller Bearing Change' }));

  db.prepare(`
    INSERT INTO carding_pile_stock (entry_date, shift, pile_type, opening_stock, received_qty, consumed_qty, closing_stock, raw_json)
    VALUES (?, 'Shift A', 'TD-4 Sacking Pile', 42.5, 18.0, 15.2, 45.3, ?)
  `).run(today, JSON.stringify({ date: today, shift: 'Shift A', pileType: 'TD-4 Sacking Pile', opening: 42.5, received: 18.0, consumed: 15.2, closing: 45.3 }));

  // Seed Cutting, Damping, Hemming, Herackle masters & shifts
  const cuttingInit = {
    qualities: ['B.Twill 945g', 'B.Twill 665g', 'A.Twill 1190g', 'Hessian 40x10', 'L.Twill', 'D.W. Flour'],
    machines: ['CM-01', 'CM-02', 'CM-03', 'CM-04', 'CM-05', 'CM-06', 'CM-07', 'CM-08'],
    supervisors: ['S. K. Mondal', 'P. Chakraborty', 'B. Halder'],
    operators: ['Raju Singh', 'Manoj Shaw', 'Kartick Das', 'Dilip Kumar', 'Gopal Roy'],
  };
  for (const q of cuttingInit.qualities) {
    db.prepare('INSERT INTO cutting_masters (category, code, name) VALUES (?, ?, ?)').run('quality', q, q);
    db.prepare('INSERT INTO damping_masters (category, code, name) VALUES (?, ?, ?)').run('quality', q, q);
    db.prepare('INSERT INTO hemming_masters (category, code, name) VALUES (?, ?, ?)').run('quality', q, q);
    db.prepare('INSERT INTO herackle_masters (category, name) VALUES (?, ?)').run('quality', q);
  }
  for (const m of cuttingInit.machines) {
    db.prepare('INSERT INTO cutting_masters (category, code, name) VALUES (?, ?, ?)').run('machine', m, m);
    db.prepare('INSERT INTO damping_masters (category, code, name) VALUES (?, ?, ?)').run('machine', m, m);
    db.prepare('INSERT INTO hemming_masters (category, code, name) VALUES (?, ?, ?)').run('machine', m, m);
    db.prepare('INSERT INTO herackle_masters (category, name) VALUES (?, ?)').run('machine', m);
  }
  for (const s of cuttingInit.supervisors) {
    db.prepare('INSERT INTO cutting_masters (category, code, name) VALUES (?, ?, ?)').run('supervisor', s, s);
    db.prepare('INSERT INTO damping_masters (category, code, name) VALUES (?, ?, ?)').run('supervisor', s, s);
    db.prepare('INSERT INTO hemming_masters (category, code, name) VALUES (?, ?, ?)').run('supervisor', s, s);
  }

  db.prepare(`
    INSERT INTO cutting_shifts (shift_date, shift_name, supervisor, attendance_count, total_cuts, total_mt, payload_json)
    VALUES (?, 'A', 'S. K. Mondal', 24, 380, 14.6, ?)
  `).run(today, JSON.stringify({
    date: today,
    shift: 'A',
    supervisor: 'S. K. Mondal',
    attendance: 24,
    totalCuts: 380,
    totalMt: 14.6,
    rows: [
      { machine: 'CM-01', quality: 'B.Twill 945g', cuts: 195, mt: 7.5, operator: 'Raju Singh' },
      { machine: 'CM-02', quality: 'B.Twill 665g', cuts: 185, mt: 7.1, operator: 'Manoj Shaw' },
    ],
  }));

  db.prepare(`
    INSERT INTO damping_shifts (shift_date, shift_name, supervisor, total_rolls, total_weight, payload_json)
    VALUES (?, 'A', 'P. Chakraborty', 64, 16.2, ?)
  `).run(today, JSON.stringify({
    date: today,
    shift: 'A',
    supervisor: 'P. Chakraborty',
    totalRolls: 64,
    totalWeight: 16.2,
    rows: [
      { machine: 'DM-01', quality: 'B.Twill 945g', rolls: 34, weight: 8.6 },
      { machine: 'DM-02', quality: 'Hessian 40x10', rolls: 30, weight: 7.6 },
    ],
  }));

  db.prepare(`
    INSERT INTO hemming_shifts (shift_date, shift_name, supervisor, total_bags, total_mt, payload_json)
    VALUES (?, 'A', 'B. Halder', 18500, 12.4, ?)
  `).run(today, JSON.stringify({
    date: today,
    shift: 'A',
    supervisor: 'B. Halder',
    totalBags: 18500,
    totalMt: 12.4,
    rows: [
      { machine: 'HM-01', quality: 'B.Twill 945g', bags: 9500, mt: 6.4 },
      { machine: 'HM-02', quality: 'B.Twill 665g', bags: 9000, mt: 6.0 },
    ],
  }));

  db.prepare(`
    INSERT INTO herackle_records (record_date, shift_name, supervisor, total_qty, total_weight, payload_json)
    VALUES (?, 'A', 'S. K. Mondal', 16400, 11.8, ?)
  `).run(today, JSON.stringify({
    date: today,
    shift: 'A',
    supervisor: 'S. K. Mondal',
    totalQty: 16400,
    totalWeight: 11.8,
    rows: [
      { machine: 'HK-01', quality: 'B.Twill 945g', qty: 8400, weight: 6.1 },
      { machine: 'HK-02', quality: 'A.Twill 1190g', qty: 8000, weight: 5.7 },
    ],
  }));

  db.prepare(`
    INSERT INTO lapping_production (entry_date, shift, machine_no, operator_name, quality, cuts, meters, weight_kg, raw_json)
    VALUES (?, 'Shift A', 'LP-01', 'Bikash Yadav', 'B.Twill 945g', 142, 9230, 4120, ?)
  `).run(today, JSON.stringify({ date: today, shift: 'Shift A', machineNo: 'LP-01', operator: 'Bikash Yadav', quality: 'B.Twill 945g', cuts: 142, meters: 9230, weightKg: 4120 }));

  db.prepare(`
    INSERT INTO narrow_beaming_rounds (round_id, machine_no, quality, status, total_cuts, total_meters, raw_json)
    VALUES ('NBR-2025-01', 'NB-01', 'Hessian 40x10', 'OPEN', 28, 2800, '{}')
  `).run();

  db.prepare(`
    INSERT INTO narrow_beaming_production (round_id, entry_date, shift, machine_no, beam_no, quality, cuts, meters, operator_name, verified, raw_json)
    VALUES ('NBR-2025-01', ?, 'A', 'NB-01', 'BM-104', 'Hessian 40x10', 14, 1400, 'Sunil Paswan', 1, '{}')
  `).run(today);

  db.prepare(`
    INSERT INTO pre_beaming_rounds (round_id, machine_no, quality, status, total_beams, total_meters, raw_json)
    VALUES ('PBR-2025-01', 'PB-01', 'B.Twill Warp', 'OPEN', 6, 4200, '{}')
  `).run();

  db.prepare(`
    INSERT INTO pre_beaming_production (round_id, entry_date, shift, machine_no, beam_no, quality, meters, weight_kg, operator_name, verified, raw_json)
    VALUES ('PBR-2025-01', ?, 'A', 'PB-01', 'PB-88', 'B.Twill Warp', 1800, 620, 'Kishore Mahato', 1, '{}')
  `).run(today);

  // Press Department seed
  const pressQualities = ['B.Twill 945g (500 Bags)', 'B.Twill 665g (500 Bags)', 'A.Twill 1190g (400 Bags)', 'Hessian 40x10 (2000 Yds)'];
  for (const pq of pressQualities) {
    db.prepare('INSERT INTO press_options (option_type, option_value) VALUES (?, ?)').run('quality', pq);
  }
  for (const pr of ['Press-1', 'Press-2', 'Press-3', 'Hydraulic-4']) {
    db.prepare('INSERT INTO press_options (option_type, option_value) VALUES (?, ?)').run('press', pr);
  }
  db.prepare(`
    INSERT INTO press_bales (bale_serial, entry_date, shift, press_no, quality, buyer_mark, bags_per_bale, gross_wt_kg, tare_wt_kg, net_wt_kg, raw_json)
    VALUES ('BJM-00101', ?, 'A', 'Press-1', 'B.Twill 945g (500 Bags)', 'FCI PUNJAB', 500, 478.5, 6.0, 472.5, ?)
  `).run(today, JSON.stringify({ serial: 'BJM-00101', date: today, shift: 'A', press: 'Press-1', quality: 'B.Twill 945g (500 Bags)', buyer: 'FCI PUNJAB', bags: 500, gross: 478.5, tare: 6.0, net: 472.5 }));

  // S4 Beaming seed
  db.prepare(`
    INSERT INTO s4_beaming_purchase_orders (po_number, order_color, quality, target_meters, produced_meters, status)
    VALUES
      ('PO-2025-881', 'Blue Stripe', 'B.Twill 945g', 45000, 18400, 'ACTIVE'),
      ('PO-2025-882', 'Red Double', 'B.Twill 665g', 32000, 14200, 'ACTIVE'),
      ('PO-2025-883', 'Green Plain', 'Hessian 40x10', 25000, 9800, 'ACTIVE')
  `).run();

  db.prepare(`
    INSERT INTO s4_beaming_production (entry_date, shift, machine_no, round_no, beam_no, order_color, meters, cuts, operator_name, raw_json)
    VALUES (?, 'A', 'S4B-01', 'R-101', 'B-401', 'Blue Stripe', 2450, 24.5, 'Tapan Ghosh', '{}')
  `).run(today);

  // S4 Loom seed
  db.prepare(`
    INSERT INTO s4_loom_production (entry_date, shift, loom_no, quality, opening_reading, closing_reading, net_meters, cuts, raw_json)
    VALUES (?, 'A', '1', 'B.Twill 945g', 12400, 12760, 360, 3.6, '{}')
  `).run(today);

  // Spinning seed
  db.prepare(`
    INSERT INTO spinning_production (entry_date, shift, frame_no, quality_count, doffs, production_kg, efficiency, raw_json)
    VALUES (?, 'Shift A', 'SF-01', '8 lbs Warp', 6, 485, 86.5, '{}')
  `).run(today);

  // Spreader seed
  db.prepare(`
    INSERT INTO spreader_roll_production (entry_date, shift, machine_no, quality, rolls_count, weight_mt, raw_json)
    VALUES (?, 'Shift A', 'SP-01', 'TD-4 Warp Mix', 92, 9.65, '{}')
  `).run(today);

  // VL Beaming & VL Loom seed
  db.prepare(`
    INSERT INTO vl_beaming_rounds (round_no, machine_no, quality, status, total_meters, raw_json)
    VALUES ('VLR-101', 'VLB-01', 'Hessian 40x10', 'OPEN', 3100, '{}')
  `).run();

  db.prepare(`
    INSERT INTO vl_loom_production (entry_date, shift, loom_no, quality, cuts, meters, weaver_name, raw_json)
    VALUES (?, 'A', 'VL-01', 'Hessian 40x10', 4.5, 450, 'Naresh Paswan', '{}')
  `).run(today);
}

export interface EffectiveModulePermission {
  moduleKey: string;
  moduleName: string;
  category: string;
  overrideMode: 'inherit' | 'grant' | 'revoke';
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canReport: boolean;
}

export function getUserEffectivePermissions(userId: number): EffectiveModulePermission[] {
  const user = db.prepare(`
    SELECT u.id, u.role_id, r.is_admin
    FROM users u
    JOIN roles r ON r.id = u.role_id
    WHERE u.id = ?
  `).get(userId) as { id: number; role_id: number; is_admin: number } | undefined;

  if (!user) return [];

  const rolePerms = db.prepare('SELECT * FROM role_permissions WHERE role_id = ?').all(user.role_id) as any[];
  const userPerms = db.prepare('SELECT * FROM user_permissions WHERE user_id = ?').all(user.id) as any[];

  const roleMap = new Map(rolePerms.map((p) => [p.module_key, p]));
  const userMap = new Map(userPerms.map((p) => [p.module_key, p]));

  return MODULES.map((mod) => {
    if (user.is_admin === 1) {
      return {
        moduleKey: mod.key,
        moduleName: mod.name,
        category: mod.category,
        overrideMode: 'inherit',
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canReport: true,
      };
    }

    const r = roleMap.get(mod.key);
    const u = userMap.get(mod.key);
    const mode = (u?.override_mode || 'inherit') as 'inherit' | 'grant' | 'revoke';

    if (mode === 'revoke') {
      return {
        moduleKey: mod.key,
        moduleName: mod.name,
        category: mod.category,
        overrideMode: 'revoke',
        canView: false,
        canCreate: false,
        canEdit: false,
        canDelete: false,
        canReport: false,
      };
    }

    if (mode === 'grant' && u) {
      return {
        moduleKey: mod.key,
        moduleName: mod.name,
        category: mod.category,
        overrideMode: 'grant',
        canView: Boolean(u.can_view),
        canCreate: Boolean(u.can_create),
        canEdit: Boolean(u.can_edit),
        canDelete: Boolean(u.can_delete),
        canReport: Boolean(u.can_report),
      };
    }

    return {
      moduleKey: mod.key,
      moduleName: mod.name,
      category: mod.category,
      overrideMode: 'inherit',
      canView: Boolean(r?.can_view),
      canCreate: Boolean(r?.can_create),
      canEdit: Boolean(r?.can_edit),
      canDelete: Boolean(r?.can_delete),
      canReport: Boolean(r?.can_report),
    };
  });
}

function classifyRpcPermission(fnName: string): 'view' | 'create' | 'edit' | 'delete' | 'report' {
  const lower = fnName.toLowerCase();
  if (lower.includes('delete') || lower.includes('remove')) return 'delete';
  if (lower.includes('update')) return 'edit';
  if (lower.includes('save') || lower.includes('stopround')) return 'create';
  if (lower.includes('report') || lower.includes('summary')) return 'report';
  return 'view';
}

export function executeModuleRpc(
  moduleKey: string,
  fnName: string,
  args: any[],
  userContext: { id: number; username: string; fullName: string }
): any {
  const perms = getUserEffectivePermissions(userContext.id);
  const modPerm = perms.find((p) => p.moduleKey === moduleKey);
  if (!modPerm || !modPerm.canView) {
    throw new Error(`Permission Denied: You do not have View access to ${moduleKey}.`);
  }

  const actionType = classifyRpcPermission(fnName);
  if (actionType === 'create' && !modPerm.canCreate) {
    throw new Error(`Permission Denied: You do not have Entry/Create permission for ${moduleKey}.`);
  }
  if (actionType === 'edit' && !modPerm.canEdit && !modPerm.canCreate) {
    throw new Error(`Permission Denied: You do not have Edit permission for ${moduleKey}.`);
  }
  if (actionType === 'delete' && !modPerm.canDelete) {
    throw new Error(`Permission Denied: You do not have Delete permission for ${moduleKey}.`);
  }
  if (actionType === 'report' && !modPerm.canReport) {
    throw new Error(`Permission Denied: You do not have Report permission for ${moduleKey}.`);
  }

  // Record audit log for write operations
  if (actionType === 'create' || actionType === 'edit' || actionType === 'delete') {
    db.prepare(`
      INSERT INTO audit_logs (user_id, username, module_key, action_name, details)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      userContext.id,
      userContext.username,
      moduleKey,
      fnName,
      JSON.stringify(args).slice(0, 500)
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const firstArg = args[0] ?? {};

  // Handle Cutting / Damping / Hemming generic `api(fn, ...args)` wrapper
  if ((moduleKey === 'cutting' || moduleKey === 'damping' || moduleKey === 'hemming') && fnName === 'api') {
    const subFn = String(args[0] || '');
    const subArgs = args.slice(1);
    return executeShiftDepartmentRpc(moduleKey, subFn, subArgs, userContext);
  }

  // Handle Herackle generic `run(fn, ...args)` wrapper
  if (moduleKey === 'herackle' && (fnName === 'run' || fnName === 'api')) {
    const subFn = String(args[0] || '');
    const subArgs = args.slice(1);
    return executeHerackleRpc(subFn, subArgs, userContext);
  }

  // Handle Press generic `api(fn, payload)` wrapper
  if (moduleKey === 'press' && fnName === 'api') {
    const subFn = String(args[0] || '');
    const payload = args[1] || {};
    return executePressRpc(subFn, payload, userContext);
  }

  // Handle Narrow Beaming & Pre Beaming `callServer(fnName, args)` wrapper
  if (moduleKey === 'narrow_beaming') {
    return executeNarrowBeamingRpc(fnName, firstArg, today);
  }
  if (moduleKey === 'pre_beaming') {
    return executePreBeamingRpc(fnName, firstArg, today);
  }

  // Direct module RPCs
  switch (moduleKey) {
    case 'carding':
      return executeCardingRpc(fnName, args, userContext, today);
    case 'cutting':
    case 'damping':
    case 'hemming':
      return executeShiftDepartmentRpc(moduleKey, fnName, args, userContext);
    case 'herackle':
      return executeHerackleRpc(fnName, args, userContext);
    case 'lapping':
      return executeLappingRpc(fnName, args, userContext, today);
    case 'narrow_loom':
      return executeNarrowLoomRpc(fnName, args, today);
    case 'press':
      return executePressRpc(fnName, firstArg, userContext);
    case 's4_beaming':
      return executeS4BeamingRpc(fnName, args, today);
    case 's4_loom':
      return executeS4LoomRpc(fnName, args, today);
    case 'spinning':
      return executeSpinningRpc(fnName, args, userContext, today);
    case 'spreader':
      return executeSpreaderRpc(fnName, args, userContext, today);
    case 'vl_beaming':
      return executeVlBeamingRpc(fnName, args, today);
    case 'vl_loom':
      return executeVlLoomRpc(fnName, args, today);
    default:
      return { success: true, ok: true, data: [] };
  }
}

// ============================================================================
// MODULE RPC HANDLERS
// ============================================================================

function executeCardingRpc(fnName: string, args: any[], user: { username: string; fullName: string }, today: string) {
  const payload = args[0] || {};
  if (fnName === 'checkLogin') {
    return { success: true, valid: true, user: user.fullName, role: 'Authorized' };
  }
  if (fnName === 'saveLogBook') {
    const rows = Array.isArray(payload.entries) ? payload.entries : Array.isArray(payload.rows) ? payload.rows : [payload];
    const stmt = db.prepare(`
      INSERT INTO carding_log_book (entry_date, shift, machine_type, machine_no, quality, operator_name, production_mt, remarks, raw_json, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const r of rows) {
      stmt.run(
        r.date || payload.date || today,
        r.shift || payload.shift || 'Shift A',
        r.machineType || r.type || 'Carding',
        r.machineNo || r.machine || 'BC-01',
        r.quality || 'B.Twill',
        r.operator || r.operatorName || '',
        Number(r.production || r.weight || r.mt || 0),
        r.remarks || '',
        JSON.stringify(r),
        user.username
      );
    }
    return { success: true, message: `Saved ${rows.length} Carding Log Book record(s) to production database.` };
  }
  if (fnName === 'saveMachineBreakdown') {
    const rows = Array.isArray(payload.entries) ? payload.entries : [payload];
    const stmt = db.prepare(`
      INSERT INTO carding_machine_breakdown (entry_date, shift, machine_no, stop_time, start_time, duration_mins, reason, raw_json, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const r of rows) {
      stmt.run(
        r.date || payload.date || today,
        r.shift || payload.shift || 'Shift A',
        r.machineNo || r.machine || 'FC-01',
        r.stopTime || r.from || '',
        r.startTime || r.to || '',
        Number(r.duration || r.minutes || 0),
        r.reason || r.remarks || '',
        JSON.stringify(r),
        user.username
      );
    }
    return { success: true, message: 'Carding Machine Breakdown saved to production database.' };
  }
  if (fnName === 'savePileStock') {
    const rows = Array.isArray(payload.entries) ? payload.entries : [payload];
    const stmt = db.prepare(`
      INSERT INTO carding_pile_stock (entry_date, shift, pile_type, opening_stock, received_qty, consumed_qty, closing_stock, raw_json, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const r of rows) {
      stmt.run(
        r.date || payload.date || today,
        r.shift || payload.shift || 'Shift A',
        r.pileType || r.quality || 'Standard Pile',
        Number(r.opening || 0),
        Number(r.received || 0),
        Number(r.consumed || 0),
        Number(r.closing || 0),
        JSON.stringify(r),
        user.username
      );
    }
    return { success: true, message: 'Pile Stock saved to production database.' };
  }
  if (fnName === 'getReport') {
    const logs = db.prepare('SELECT * FROM carding_log_book ORDER BY id DESC LIMIT 100').all() as any[];
    const breakdowns = db.prepare('SELECT * FROM carding_machine_breakdown ORDER BY id DESC LIMIT 100').all() as any[];
    const piles = db.prepare('SELECT * FROM carding_pile_stock ORDER BY id DESC LIMIT 100').all() as any[];
    return {
      success: true,
      logBook: logs.map((l) => ({
        id: l.id,
        date: l.entry_date,
        shift: l.shift,
        machineType: l.machine_type,
        machineNo: l.machine_no,
        quality: l.quality,
        operator: l.operator_name,
        production: l.production_mt,
        remarks: l.remarks,
        ...safeJson(l.raw_json),
      })),
      breakdown: breakdowns.map((b) => ({
        id: b.id,
        date: b.entry_date,
        shift: b.shift,
        machineNo: b.machine_no,
        stopTime: b.stop_time,
        startTime: b.start_time,
        duration: b.duration_mins,
        reason: b.reason,
        ...safeJson(b.raw_json),
      })),
      pileStock: piles.map((p) => ({
        id: p.id,
        date: p.entry_date,
        shift: p.shift,
        pileType: p.pile_type,
        opening: p.opening_stock,
        received: p.received_qty,
        consumed: p.consumed_qty,
        closing: p.closing_stock,
        ...safeJson(p.raw_json),
      })),
      rows: logs.map((l) => ({
        date: l.entry_date,
        shift: l.shift,
        machineNo: l.machine_no,
        quality: l.quality,
        production: l.production_mt,
      })),
    };
  }
  return { success: true };
}

function executeShiftDepartmentRpc(
  dept: 'cutting' | 'damping' | 'hemming',
  fnName: string,
  args: any[],
  user: { username: string }
) {
  const shiftTable = `${dept}_shifts`;
  const masterTable = `${dept}_masters`;
  const settingTable = dept === 'hemming' ? null : `${dept}_settings`;

  if (fnName === 'getInitData') {
    const masters = db.prepare(`SELECT * FROM ${masterTable} ORDER BY id ASC`).all() as any[];
    const settings = settingTable ? (db.prepare(`SELECT * FROM ${settingTable}`).all() as any[]) : [];
    const qualities = masters.filter((m) => m.category === 'quality').map((m) => m.name);
    const machines = masters.filter((m) => m.category === 'machine').map((m) => m.name);
    const supervisors = masters.filter((m) => m.category === 'supervisor').map((m) => m.name);
    const settingsObj: Record<string, string> = {};
    for (const s of settings) settingsObj[s.setting_key] = s.setting_value;
    return {
      ok: true,
      success: true,
      qualities,
      machines,
      supervisors,
      masters,
      settings: settingsObj,
    };
  }

  if (fnName === 'getShift') {
    const date = String(args[0]?.date || args[0] || new Date().toISOString().slice(0, 10));
    const shift = String(args[0]?.shift || args[1] || 'A');
    const row = db.prepare(`SELECT * FROM ${shiftTable} WHERE shift_date = ? AND shift_name = ?`).get(date, shift) as any;
    if (!row) {
      return { ok: true, found: false, date, shift, rows: [] };
    }
    return { ok: true, found: true, ...safeJson(row.payload_json), id: row.id };
  }

  if (fnName === 'saveShift') {
    const payload = args[0] || {};
    const date = String(payload.date || new Date().toISOString().slice(0, 10));
    const shift = String(payload.shift || 'A');
    const supervisor = String(payload.supervisor || '');
    const rows = Array.isArray(payload.rows) ? payload.rows : [];

    if (dept === 'cutting') {
      const totalCuts = rows.reduce((acc: number, r: any) => acc + Number(r.cuts || r.qty || 0), 0);
      const totalMt = rows.reduce((acc: number, r: any) => acc + Number(r.mt || r.weight || 0), 0);
      db.prepare(`
        INSERT INTO cutting_shifts (shift_date, shift_name, supervisor, attendance_count, total_cuts, total_mt, payload_json, updated_by, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(shift_date, shift_name) DO UPDATE SET
          supervisor = excluded.supervisor,
          attendance_count = excluded.attendance_count,
          total_cuts = excluded.total_cuts,
          total_mt = excluded.total_mt,
          payload_json = excluded.payload_json,
          updated_by = excluded.updated_by,
          updated_at = datetime('now')
      `).run(date, shift, supervisor, Number(payload.attendance || rows.length), totalCuts, totalMt, JSON.stringify(payload), user.username);
    } else if (dept === 'damping') {
      const totalRolls = rows.reduce((acc: number, r: any) => acc + Number(r.rolls || r.cuts || 0), 0);
      const totalWeight = rows.reduce((acc: number, r: any) => acc + Number(r.weight || r.mt || 0), 0);
      db.prepare(`
        INSERT INTO damping_shifts (shift_date, shift_name, supervisor, total_rolls, total_weight, payload_json, updated_by, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(shift_date, shift_name) DO UPDATE SET
          supervisor = excluded.supervisor,
          total_rolls = excluded.total_rolls,
          total_weight = excluded.total_weight,
          payload_json = excluded.payload_json,
          updated_by = excluded.updated_by,
          updated_at = datetime('now')
      `).run(date, shift, supervisor, totalRolls, totalWeight, JSON.stringify(payload), user.username);
    } else {
      const totalBags = rows.reduce((acc: number, r: any) => acc + Number(r.bags || r.qty || 0), 0);
      const totalMt = rows.reduce((acc: number, r: any) => acc + Number(r.mt || r.weight || 0), 0);
      db.prepare(`
        INSERT INTO hemming_shifts (shift_date, shift_name, supervisor, total_bags, total_mt, payload_json, updated_by, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(shift_date, shift_name) DO UPDATE SET
          supervisor = excluded.supervisor,
          total_bags = excluded.total_bags,
          total_mt = excluded.total_mt,
          payload_json = excluded.payload_json,
          updated_by = excluded.updated_by,
          updated_at = datetime('now')
      `).run(date, shift, supervisor, totalBags, totalMt, JSON.stringify(payload), user.username);
    }
    return { ok: true, success: true, message: `${dept.toUpperCase()} shift ${shift} on ${date} saved to production database.` };
  }

  if (fnName === 'deleteShift') {
    const date = String(args[0]?.date || args[0] || '');
    const shift = String(args[0]?.shift || args[1] || '');
    db.prepare(`DELETE FROM ${shiftTable} WHERE shift_date = ? AND shift_name = ?`).run(date, shift);
    return { ok: true, success: true, message: 'Shift deleted.' };
  }

  if (fnName === 'getReport') {
    const rows = db.prepare(`SELECT * FROM ${shiftTable} ORDER BY shift_date DESC, shift_name ASC LIMIT 100`).all() as any[];
    const mapped = rows.map((r) => ({
      id: r.id,
      date: r.shift_date,
      shift: r.shift_name,
      supervisor: r.supervisor,
      ...safeJson(r.payload_json),
    }));
    return { ok: true, success: true, records: mapped, rows: mapped, data: mapped };
  }

  if (fnName === 'saveMaster') {
    const p = args[0] || {};
    db.prepare(`INSERT INTO ${masterTable} (category, code, name, extra_json) VALUES (?, ?, ?, ?)`).run(
      p.category || 'quality',
      p.code || p.name || 'CODE',
      p.name || p.value || 'Item',
      JSON.stringify(p)
    );
    return { ok: true, success: true };
  }

  if (fnName === 'deleteMaster') {
    const id = Number(args[0]?.id || args[0] || 0);
    db.prepare(`DELETE FROM ${masterTable} WHERE id = ?`).run(id);
    return { ok: true, success: true };
  }

  if (fnName === 'saveSetting' && settingTable) {
    const p = args[0] || {};
    for (const [k, v] of Object.entries(p)) {
      db.prepare(`INSERT OR REPLACE INTO ${settingTable} (setting_key, setting_value) VALUES (?, ?)`).run(k, String(v));
    }
    return { ok: true, success: true };
  }

  return { ok: true, success: true };
}

function executeHerackleRpc(fnName: string, args: any[], user: { username: string }) {
  if (fnName === 'getInit') {
    const masters = db.prepare('SELECT * FROM herackle_masters ORDER BY id ASC').all() as any[];
    return {
      ok: true,
      qualities: masters.filter((m) => m.category === 'quality').map((m) => m.name),
      machines: masters.filter((m) => m.category === 'machine').map((m) => m.name),
      masters,
    };
  }
  if (fnName === 'saveRecord') {
    const p = args[0] || {};
    const date = String(p.date || new Date().toISOString().slice(0, 10));
    const shift = String(p.shift || 'A');
    const rows = Array.isArray(p.rows) ? p.rows : [];
    const totalQty = rows.reduce((a: number, r: any) => a + Number(r.qty || r.bags || 0), 0);
    const totalWeight = rows.reduce((a: number, r: any) => a + Number(r.weight || r.mt || 0), 0);
    db.prepare(`
      INSERT INTO herackle_records (record_date, shift_name, supervisor, total_qty, total_weight, payload_json, updated_by, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(record_date, shift_name) DO UPDATE SET
        supervisor = excluded.supervisor,
        total_qty = excluded.total_qty,
        total_weight = excluded.total_weight,
        payload_json = excluded.payload_json,
        updated_by = excluded.updated_by,
        updated_at = datetime('now')
    `).run(date, shift, p.supervisor || '', totalQty, totalWeight, JSON.stringify(p), user.username);
    return { ok: true, success: true, message: 'Herackle record saved.' };
  }
  if (fnName === 'findRecord') {
    const date = String(args[0]?.date || args[0] || new Date().toISOString().slice(0, 10));
    const shift = String(args[0]?.shift || args[1] || 'A');
    const rec = db.prepare('SELECT * FROM herackle_records WHERE record_date = ? AND shift_name = ?').get(date, shift) as any;
    if (!rec) return { ok: true, found: false, date, shift, rows: [] };
    return { ok: true, found: true, ...safeJson(rec.payload_json), id: rec.id };
  }
  if (fnName === 'deleteRecord') {
    const date = String(args[0]?.date || args[0] || '');
    const shift = String(args[0]?.shift || args[1] || '');
    db.prepare('DELETE FROM herackle_records WHERE record_date = ? AND shift_name = ?').run(date, shift);
    return { ok: true, success: true };
  }
  if (fnName === 'getReport') {
    const rows = db.prepare('SELECT * FROM herackle_records ORDER BY record_date DESC LIMIT 100').all() as any[];
    const mapped = rows.map((r) => ({
      id: r.id,
      date: r.record_date,
      shift: r.shift_name,
      supervisor: r.supervisor,
      totalQty: r.total_qty,
      totalWeight: r.total_weight,
      ...safeJson(r.payload_json),
    }));
    return { ok: true, success: true, rows: mapped, records: mapped };
  }
  return { ok: true, success: true };
}

function executeLappingRpc(fnName: string, args: any[], user: { username: string }, today: string) {
  const p = args[0] || {};
  if (fnName === 'saveProduction') {
    const rows = Array.isArray(p.rows) ? p.rows : Array.isArray(p.entries) ? p.entries : [p];
    const stmt = db.prepare(`
      INSERT INTO lapping_production (entry_date, shift, machine_no, operator_name, quality, cuts, meters, weight_kg, raw_json, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const r of rows) {
      stmt.run(
        r.date || p.date || today,
        r.shift || p.shift || 'Shift A',
        r.machineNo || r.machine || 'LP-01',
        r.operator || r.operatorName || '',
        r.quality || 'B.Twill',
        Number(r.cuts || 0),
        Number(r.meters || 0),
        Number(r.weight || r.weightKg || 0),
        JSON.stringify(r),
        user.username
      );
    }
    return { success: true, message: `Saved ${rows.length} Lapping entry(s).` };
  }
  if (fnName === 'getReport') {
    const rows = db.prepare('SELECT * FROM lapping_production ORDER BY id DESC LIMIT 100').all() as any[];
    const mapped = rows.map((r) => ({
      id: r.id,
      date: r.entry_date,
      shift: r.shift,
      machineNo: r.machine_no,
      operator: r.operator_name,
      quality: r.quality,
      cuts: r.cuts,
      meters: r.meters,
      weightKg: r.weight_kg,
      ...safeJson(r.raw_json),
    }));
    return { success: true, rows: mapped, data: mapped };
  }
  if (fnName === 'deleteRecord') {
    const id = Number(p.id || args[0] || 0);
    db.prepare('DELETE FROM lapping_production WHERE id = ?').run(id);
    return { success: true };
  }
  return { success: true };
}

function executeNarrowBeamingRpc(fnName: string, arg: any, today: string) {
  if (fnName === 'getCurrentRound') {
    let round = db.prepare("SELECT * FROM narrow_beaming_rounds WHERE status = 'OPEN' ORDER BY id DESC LIMIT 1").get() as any;
    if (!round) {
      const roundId = `NBR-${Date.now().toString().slice(-5)}`;
      db.prepare("INSERT INTO narrow_beaming_rounds (round_id, machine_no, quality, status) VALUES (?, 'NB-01', 'Hessian 40x10', 'OPEN')").run(roundId);
      round = db.prepare("SELECT * FROM narrow_beaming_rounds WHERE round_id = ?").get(roundId);
    }
    return { ok: true, data: { roundId: round.round_id, machineNo: round.machine_no, quality: round.quality, status: round.status, totalCuts: round.total_cuts, totalMeters: round.total_meters } };
  }
  if (fnName === 'getShiftContext') {
    return { ok: true, data: { date: today, shift: 'Shift A', machines: ['NB-01', 'NB-02', 'NB-03', 'NB-04'], qualities: ['Hessian 40x10', 'B.Twill Warp', 'Sacking Warp'] } };
  }
  if (fnName === 'getCutStatus') {
    return { ok: true, data: { targetCuts: 40, completedCuts: 28, remainingCuts: 12 } };
  }
  if (fnName === 'saveLogEntry') {
    db.prepare(`
      INSERT INTO narrow_beaming_logs (entry_date, shift, machine_no, beam_no, quality, operator_name, cuts, meters, raw_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      arg.date || today,
      arg.shift || 'A',
      arg.machineNo || arg.machine || 'NB-01',
      arg.beamNo || 'BM-101',
      arg.quality || 'Hessian 40x10',
      arg.operator || '',
      Number(arg.cuts || 0),
      Number(arg.meters || 0),
      JSON.stringify(arg)
    );
    return { ok: true, data: { saved: true } };
  }
  if (fnName === 'getLogEntries') {
    const rows = db.prepare('SELECT * FROM narrow_beaming_logs ORDER BY id DESC LIMIT 50').all() as any[];
    return {
      ok: true,
      data: rows.map((r) => ({
        id: r.id,
        date: r.entry_date,
        shift: r.shift,
        machineNo: r.machine_no,
        beamNo: r.beam_no,
        quality: r.quality,
        operator: r.operator_name,
        cuts: r.cuts,
        meters: r.meters,
        ...safeJson(r.raw_json),
      })),
    };
  }
  if (fnName === 'saveProductionEntry') {
    const roundId = arg.roundId || 'NBR-2025-01';
    db.prepare(`
      INSERT INTO narrow_beaming_production (round_id, entry_date, shift, machine_no, beam_no, quality, cuts, meters, operator_name, raw_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      roundId,
      arg.date || today,
      arg.shift || 'A',
      arg.machineNo || 'NB-01',
      arg.beamNo || 'BM-105',
      arg.quality || 'Hessian 40x10',
      Number(arg.cuts || 0),
      Number(arg.meters || 0),
      arg.operator || '',
      JSON.stringify(arg)
    );
    return { ok: true, data: { saved: true } };
  }
  if (fnName === 'stopRound') {
    db.prepare("UPDATE narrow_beaming_rounds SET status = 'CLOSED', closed_at = datetime('now') WHERE status = 'OPEN'").run();
    const newId = `NBR-${Date.now().toString().slice(-5)}`;
    db.prepare("INSERT INTO narrow_beaming_rounds (round_id, machine_no, quality, status) VALUES (?, 'NB-01', 'Hessian 40x10', 'OPEN')").run(newId);
    return { ok: true, data: { closed: true, nextRoundId: newId } };
  }
  if (fnName === 'getCurrentRoundEntries' || fnName === 'getVerificationData' || fnName === 'getReportData') {
    const rows = db.prepare('SELECT * FROM narrow_beaming_production ORDER BY id DESC LIMIT 100').all() as any[];
    const mapped = rows.map((r) => ({
      id: r.id,
      roundId: r.round_id,
      date: r.entry_date,
      shift: r.shift,
      machineNo: r.machine_no,
      beamNo: r.beam_no,
      quality: r.quality,
      cuts: r.cuts,
      meters: r.meters,
      operator: r.operator_name,
      verified: Boolean(r.verified),
      ...safeJson(r.raw_json),
    }));
    return { ok: true, data: mapped, entries: mapped, rows: mapped };
  }
  return { ok: true, data: {} };
}

function executeNarrowLoomRpc(fnName: string, args: any[], today: string) {
  const p = args[0] || {};
  if (fnName === 'saveLogbookEntry') {
    db.prepare(`
      INSERT INTO narrow_loom_logbook (entry_date, shift, loom_no, quality, beam_no, weaver_name, raw_json)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(p.date || today, p.shift || 'A', p.loomNo || 'NL-01', p.quality || 'Hessian', p.beamNo || 'BM-104', p.weaver || '', JSON.stringify(p));
    return { success: true, message: 'Narrow Loom Logbook entry saved.' };
  }
  if (fnName === 'saveProductionEntries') {
    const rows = Array.isArray(p.entries) ? p.entries : Array.isArray(p) ? p : [p];
    const stmt = db.prepare(`
      INSERT INTO narrow_loom_production (entry_date, shift, loom_no, quality, cuts, meters, efficiency, weaver_name, raw_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const r of rows) {
      stmt.run(
        r.date || p.date || today,
        r.shift || p.shift || 'A',
        r.loomNo || r.loom || 'NL-01',
        r.quality || 'Hessian',
        Number(r.cuts || 0),
        Number(r.meters || 0),
        Number(r.efficiency || 85),
        r.weaver || '',
        JSON.stringify(r)
      );
    }
    return { success: true, message: `Saved ${rows.length} Narrow Loom production row(s).` };
  }
  if (fnName === 'getReport') {
    const prod = db.prepare('SELECT * FROM narrow_loom_production ORDER BY id DESC LIMIT 100').all() as any[];
    const logs = db.prepare('SELECT * FROM narrow_loom_logbook ORDER BY id DESC LIMIT 100').all() as any[];
    return {
      success: true,
      rows: prod.map((r) => ({
        id: r.id,
        date: r.entry_date,
        shift: r.shift,
        loomNo: r.loom_no,
        quality: r.quality,
        cuts: r.cuts,
        meters: r.meters,
        efficiency: r.efficiency,
        weaver: r.weaver_name,
        ...safeJson(r.raw_json),
      })),
      logbook: logs,
    };
  }
  return { success: true };
}

function executePreBeamingRpc(fnName: string, arg: any, today: string) {
  if (fnName === 'getCurrentRound') {
    let round = db.prepare("SELECT * FROM pre_beaming_rounds WHERE status = 'OPEN' ORDER BY id DESC LIMIT 1").get() as any;
    if (!round) {
      const roundId = `PBR-${Date.now().toString().slice(-5)}`;
      db.prepare("INSERT INTO pre_beaming_rounds (round_id, machine_no, quality, status) VALUES (?, 'PB-01', 'B.Twill Warp', 'OPEN')").run(roundId);
      round = db.prepare("SELECT * FROM pre_beaming_rounds WHERE round_id = ?").get(roundId);
    }
    return { ok: true, data: { roundId: round.round_id, machineNo: round.machine_no, quality: round.quality, status: round.status, totalBeams: round.total_beams, totalMeters: round.total_meters } };
  }
  if (fnName === 'getBeamStatus') {
    return { ok: true, data: { activeBeams: 8, readyBeams: 5, emptyBeams: 3 } };
  }
  if (fnName === 'saveLogEntry') {
    db.prepare(`
      INSERT INTO pre_beaming_logs (entry_date, shift, machine_no, beam_no, quality, meters, operator_name, raw_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(arg.date || today, arg.shift || 'A', arg.machineNo || 'PB-01', arg.beamNo || 'PB-101', arg.quality || 'B.Twill Warp', Number(arg.meters || 0), arg.operator || '', JSON.stringify(arg));
    return { ok: true, data: { saved: true } };
  }
  if (fnName === 'getLogEntries') {
    const rows = db.prepare('SELECT * FROM pre_beaming_logs ORDER BY id DESC LIMIT 50').all() as any[];
    return {
      ok: true,
      data: rows.map((r) => ({
        id: r.id,
        date: r.entry_date,
        shift: r.shift,
        machineNo: r.machine_no,
        beamNo: r.beam_no,
        quality: r.quality,
        meters: r.meters,
        operator: r.operator_name,
        ...safeJson(r.raw_json),
      })),
    };
  }
  if (fnName === 'saveProductionEntry') {
    db.prepare(`
      INSERT INTO pre_beaming_production (round_id, entry_date, shift, machine_no, beam_no, quality, meters, weight_kg, operator_name, raw_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(arg.roundId || 'PBR-2025-01', arg.date || today, arg.shift || 'A', arg.machineNo || 'PB-01', arg.beamNo || 'PB-89', arg.quality || 'B.Twill Warp', Number(arg.meters || 0), Number(arg.weightKg || 0), arg.operator || '', JSON.stringify(arg));
    return { ok: true, data: { saved: true } };
  }
  if (fnName === 'stopRound') {
    db.prepare("UPDATE pre_beaming_rounds SET status = 'CLOSED', closed_at = datetime('now') WHERE status = 'OPEN'").run();
    const nextId = `PBR-${Date.now().toString().slice(-5)}`;
    db.prepare("INSERT INTO pre_beaming_rounds (round_id, machine_no, quality, status) VALUES (?, 'PB-01', 'B.Twill Warp', 'OPEN')").run(nextId);
    return { ok: true, data: { closed: true, nextRoundId: nextId } };
  }
  if (fnName === 'getCurrentRoundEntries' || fnName === 'getVerificationData' || fnName === 'getReportData') {
    const rows = db.prepare('SELECT * FROM pre_beaming_production ORDER BY id DESC LIMIT 100').all() as any[];
    const mapped = rows.map((r) => ({
      id: r.id,
      roundId: r.round_id,
      date: r.entry_date,
      shift: r.shift,
      machineNo: r.machine_no,
      beamNo: r.beam_no,
      quality: r.quality,
      meters: r.meters,
      weightKg: r.weight_kg,
      operator: r.operator_name,
      ...safeJson(r.raw_json),
    }));
    return { ok: true, data: mapped, rows: mapped };
  }
  return { ok: true, data: {} };
}

function executePressRpc(fnName: string, payload: any, user: { username: string }) {
  const today = new Date().toISOString().slice(0, 10);
  if (fnName === 'getOptions') {
    const opts = db.prepare('SELECT * FROM press_options ORDER BY id ASC').all() as any[];
    return {
      ok: true,
      data: {
        qualities: opts.filter((o) => o.option_type === 'quality').map((o) => o.option_value),
        presses: opts.filter((o) => o.option_type === 'press').map((o) => o.option_value),
        shifts: ['A', 'B', 'C'],
      },
    };
  }
  if (fnName === 'nextSerial') {
    const count = (db.prepare('SELECT COUNT(*) as c FROM press_bales').get() as { c: number }).c;
    const next = `BJM-${String(101 + count).padStart(5, '0')}`;
    return { ok: true, data: { serial: next, nextSerial: next } };
  }
  if (fnName === 'saveBales') {
    const bales = Array.isArray(payload.bales) ? payload.bales : [payload];
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO press_bales (bale_serial, entry_date, shift, press_no, quality, buyer_mark, bags_per_bale, gross_wt_kg, tare_wt_kg, net_wt_kg, raw_json, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const b of bales) {
      const serial = b.serial || b.baleSerial || `BJM-${Date.now().toString().slice(-5)}`;
      const gross = Number(b.gross || b.grossWt || 478);
      const tare = Number(b.tare || b.tareWt || 6);
      const net = Number(b.net || b.netWt || gross - tare);
      stmt.run(
        serial,
        b.date || payload.date || today,
        b.shift || payload.shift || 'A',
        b.press || b.pressNo || 'Press-1',
        b.quality || 'B.Twill 945g (500 Bags)',
        b.buyer || b.mark || 'FCI',
        Number(b.bags || 500),
        gross,
        tare,
        net,
        JSON.stringify(b),
        user.username
      );
    }
    return { ok: true, data: { saved: bales.length } };
  }
  if (fnName === 'getBales' || fnName === 'getSummary') {
    const rows = db.prepare('SELECT * FROM press_bales ORDER BY id DESC LIMIT 100').all() as any[];
    const mapped = rows.map((r) => ({
      id: r.id,
      serial: r.bale_serial,
      date: r.entry_date,
      shift: r.shift,
      press: r.press_no,
      quality: r.quality,
      buyer: r.buyer_mark,
      bags: r.bags_per_bale,
      gross: r.gross_wt_kg,
      tare: r.tare_wt_kg,
      net: r.net_wt_kg,
      ...safeJson(r.raw_json),
    }));
    return { ok: true, data: mapped, bales: mapped, summary: { totalBales: mapped.length, totalNetKg: mapped.reduce((a, b) => a + b.net, 0) } };
  }
  if (fnName === 'updateBale') {
    const id = Number(payload.id || 0);
    db.prepare('UPDATE press_bales SET gross_wt_kg = ?, net_wt_kg = ?, quality = ?, raw_json = ? WHERE id = ?').run(
      Number(payload.gross || 0),
      Number(payload.net || 0),
      payload.quality || '',
      JSON.stringify(payload),
      id
    );
    return { ok: true, data: { updated: true } };
  }
  if (fnName === 'deleteBale') {
    const id = Number(payload.id || 0);
    db.prepare('DELETE FROM press_bales WHERE id = ?').run(id);
    return { ok: true, data: { deleted: true } };
  }
  return { ok: true, data: {} };
}

function executeS4BeamingRpc(fnName: string, args: any[], today: string) {
  const p = args[0] || {};
  if (fnName === 'getMachines') {
    return ['S4B-01', 'S4B-02', 'S4B-03', 'S4B-04', 'S4B-05', 'S4B-06'];
  }
  if (fnName === 'getOrderColors') {
    const pos = db.prepare('SELECT DISTINCT order_color FROM s4_beaming_purchase_orders').all() as any[];
    return pos.length ? pos.map((x) => x.order_color) : ['Blue Stripe', 'Red Double', 'Green Plain', 'Yellow Natural'];
  }
  if (fnName === 'saveLogBook') {
    db.prepare(`
      INSERT INTO s4_beaming_logbook (entry_date, shift, machine_no, order_color, quality, operator_name, opening_meter, closing_meter, raw_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(p.date || today, p.shift || 'A', p.machine || p.machineNo || 'S4B-01', p.orderColor || 'Blue Stripe', p.quality || 'B.Twill', p.operator || '', Number(p.openingMeter || 0), Number(p.closingMeter || 0), JSON.stringify(p));
    return { success: true, message: 'S4 Beaming LogBook saved.' };
  }
  if (fnName === 'getLogBookForShift' || fnName === 'getLogBooks') {
    const rows = db.prepare('SELECT * FROM s4_beaming_logbook ORDER BY id DESC LIMIT 100').all() as any[];
    return rows.map((r) => ({
      id: r.id,
      date: r.entry_date,
      shift: r.shift,
      machine: r.machine_no,
      orderColor: r.order_color,
      quality: r.quality,
      operator: r.operator_name,
      openingMeter: r.opening_meter,
      closingMeter: r.closing_meter,
      ...safeJson(r.raw_json),
    }));
  }
  if (fnName === 'getLastMeterForMachine') {
    const machine = String(args[0] || 'S4B-01');
    const last = db.prepare('SELECT closing_meter FROM s4_beaming_logbook WHERE machine_no = ? ORDER BY id DESC LIMIT 1').get(machine) as any;
    return last?.closing_meter || 0;
  }
  if (fnName === 'saveProduction') {
    db.prepare(`
      INSERT INTO s4_beaming_production (entry_date, shift, machine_no, round_no, beam_no, order_color, meters, cuts, operator_name, raw_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(p.date || today, p.shift || 'A', p.machine || p.machineNo || 'S4B-01', p.roundNo || 'R-101', p.beamNo || 'B-402', p.orderColor || 'Blue Stripe', Number(p.meters || 0), Number(p.cuts || 0), p.operator || '', JSON.stringify(p));
    return { success: true, message: 'S4 Beaming Production saved.' };
  }
  if (fnName === 'getProductionLogForMachine' || fnName === 'getRoundSummaryForMachine' || fnName === 'getProduction') {
    const rows = db.prepare('SELECT * FROM s4_beaming_production ORDER BY id DESC LIMIT 100').all() as any[];
    return rows.map((r) => ({
      id: r.id,
      date: r.entry_date,
      shift: r.shift,
      machine: r.machine_no,
      roundNo: r.round_no,
      beamNo: r.beam_no,
      orderColor: r.order_color,
      meters: r.meters,
      cuts: r.cuts,
      operator: r.operator_name,
      ...safeJson(r.raw_json),
    }));
  }
  if (fnName === 'saveVerification') {
    db.prepare(`
      INSERT INTO s4_beaming_verification (entry_date, machine_no, round_no, verified_meters, variance_meters, status, raw_json)
      VALUES (?, ?, ?, ?, ?, 'VERIFIED', ?)
    `).run(p.date || today, p.machine || 'S4B-01', p.roundNo || 'R-101', Number(p.verifiedMeters || 0), Number(p.variance || 0), JSON.stringify(p));
    return { success: true };
  }
  if (fnName === 'getPurchaseOrderSummary') {
    return db.prepare('SELECT * FROM s4_beaming_purchase_orders ORDER BY id DESC').all();
  }
  if (fnName === 'savePurchaseOrder') {
    db.prepare(`
      INSERT INTO s4_beaming_purchase_orders (po_number, order_color, quality, target_meters, produced_meters, status, raw_json)
      VALUES (?, ?, ?, ?, ?, 'ACTIVE', ?)
    `).run(p.poNumber || 'PO-NEW', p.orderColor || 'Blue Stripe', p.quality || 'B.Twill', Number(p.targetMeters || 10000), Number(p.producedMeters || 0), JSON.stringify(p));
    return { success: true };
  }
  if (fnName === 'getCumulativeProductionForColor') {
    const color = String(args[0] || 'Blue Stripe');
    const row = db.prepare('SELECT SUM(meters) as total FROM s4_beaming_production WHERE order_color = ?').get(color) as any;
    return { orderColor: color, totalMeters: row?.total || 0 };
  }
  return { success: true };
}

function executeS4LoomRpc(fnName: string, args: any[], today: string) {
  const p = args[0] || {};
  if (fnName === 'getMachineList') {
    return Array.from({ length: 336 }, (_, i) => i + 1);
  }
  if (fnName === 'getLogbookEntry') {
    const rows = db.prepare('SELECT * FROM s4_loom_logbook ORDER BY id DESC LIMIT 50').all() as any[];
    return { ok: true, entries: rows.map((r) => ({ id: r.id, date: r.entry_date, shift: r.shift, loomNo: r.loom_no, quality: r.quality, weaver: r.weaver_name, beamNo: r.beam_no, ...safeJson(r.raw_json) })) };
  }
  if (fnName === 'saveLogbookEntry') {
    db.prepare(`
      INSERT INTO s4_loom_logbook (entry_date, shift, loom_no, quality, weaver_name, beam_no, raw_json)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(p.date || today, p.shift || 'A', String(p.loomNo || '1'), p.quality || 'B.Twill', p.weaver || '', p.beamNo || '', JSON.stringify(p));
    return { ok: true, success: true };
  }
  if (fnName === 'getProductionData' || fnName === 'getReportData') {
    const rows = db.prepare('SELECT * FROM s4_loom_production ORDER BY id DESC LIMIT 100').all() as any[];
    const mapped = rows.map((r) => ({
      id: r.id,
      date: r.entry_date,
      shift: r.shift,
      loomNo: r.loom_no,
      quality: r.quality,
      openingReading: r.opening_reading,
      closingReading: r.closing_reading,
      netMeters: r.net_meters,
      cuts: r.cuts,
      ...safeJson(r.raw_json),
    }));
    return { ok: true, success: true, rows: mapped, data: mapped };
  }
  if (fnName === 'saveProductionData') {
    const rows = Array.isArray(p.rows) ? p.rows : Array.isArray(p) ? p : [p];
    const stmt = db.prepare(`
      INSERT INTO s4_loom_production (entry_date, shift, loom_no, quality, opening_reading, closing_reading, net_meters, cuts, raw_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const r of rows) {
      stmt.run(
        r.date || p.date || today,
        r.shift || p.shift || 'A',
        String(r.loomNo || r.machine || '1'),
        r.quality || 'B.Twill',
        Number(r.openingReading || 0),
        Number(r.closingReading || 0),
        Number(r.netMeters || r.meters || 0),
        Number(r.cuts || 0),
        JSON.stringify(r)
      );
    }
    return { ok: true, success: true };
  }
  if (fnName === 'getVerificationRows' || fnName === 'getVerificationSummary') {
    const rows = db.prepare('SELECT * FROM s4_loom_verification ORDER BY id DESC LIMIT 100').all() as any[];
    return { ok: true, rows };
  }
  if (fnName === 'saveVerificationRows' || fnName === 'saveVerificationEntries') {
    const rows = Array.isArray(p.rows) ? p.rows : [p];
    const stmt = db.prepare(`
      INSERT INTO s4_loom_verification (entry_date, shift, loom_no, book_meters, actual_meters, diff_meters, raw_json)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    for (const r of rows) {
      stmt.run(r.date || today, r.shift || 'A', String(r.loomNo || '1'), Number(r.bookMeters || 0), Number(r.actualMeters || 0), Number(r.diffMeters || 0), JSON.stringify(r));
    }
    return { ok: true, success: true };
  }
  return { ok: true, success: true };
}

function executeSpinningRpc(fnName: string, args: any[], user: { fullName: string }, today: string) {
  const p = args[0] || {};
  if (fnName === 'checkLogin') {
    return { success: true, valid: true, user: user.fullName };
  }
  if (fnName === 'getLogBookEntries' || fnName === 'getLogBookReport') {
    const rows = db.prepare('SELECT * FROM spinning_logbook ORDER BY id DESC LIMIT 100').all() as any[];
    return rows.map((r) => ({ id: r.id, date: r.entry_date, shift: r.shift, frameNo: r.frame_no, count: r.quality_count, rpm: r.rpm, tpi: r.tpi, operator: r.operator_name, ...safeJson(r.raw_json) }));
  }
  if (fnName === 'getBreakdownEntries' || fnName === 'getBreakdownReport') {
    const rows = db.prepare('SELECT * FROM spinning_breakdown ORDER BY id DESC LIMIT 100').all() as any[];
    return rows.map((r) => ({ id: r.id, date: r.entry_date, shift: r.shift, frameNo: r.frame_no, reason: r.reason, downMins: r.down_mins, ...safeJson(r.raw_json) }));
  }
  if (fnName === 'getProductionEntries' || fnName === 'getProductionReport') {
    const rows = db.prepare('SELECT * FROM spinning_production ORDER BY id DESC LIMIT 100').all() as any[];
    return rows.map((r) => ({ id: r.id, date: r.entry_date, shift: r.shift, frameNo: r.frame_no, count: r.quality_count, doffs: r.doffs, productionKg: r.production_kg, efficiency: r.efficiency, ...safeJson(r.raw_json) }));
  }
  if (fnName === 'saveLogBook') {
    db.prepare(`
      INSERT INTO spinning_logbook (entry_date, shift, frame_no, quality_count, rpm, tpi, operator_name, raw_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(p.date || today, p.shift || 'Shift A', p.frameNo || 'SF-01', p.count || '8 lbs Warp', Number(p.rpm || 3800), Number(p.tpi || 4.2), p.operator || '', JSON.stringify(p));
    return { success: true, message: 'Spinning Log Book saved.' };
  }
  if (fnName === 'saveMachineBreakdown') {
    db.prepare(`
      INSERT INTO spinning_breakdown (entry_date, shift, frame_no, reason, down_mins, raw_json)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(p.date || today, p.shift || 'Shift A', p.frameNo || 'SF-01', p.reason || 'Belt Replace', Number(p.downMins || p.duration || 30), JSON.stringify(p));
    return { success: true, message: 'Spinning Breakdown saved.' };
  }
  if (fnName === 'saveProduction') {
    db.prepare(`
      INSERT INTO spinning_production (entry_date, shift, frame_no, quality_count, doffs, production_kg, efficiency, raw_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(p.date || today, p.shift || 'Shift A', p.frameNo || 'SF-01', p.count || '8 lbs Warp', Number(p.doffs || 6), Number(p.productionKg || p.production || 450), Number(p.efficiency || 85), JSON.stringify(p));
    return { success: true, message: 'Spinning Production saved.' };
  }
  return { success: true };
}

function executeSpreaderRpc(fnName: string, args: any[], user: { username: string; fullName: string }, today: string) {
  const p = args[0] || {};
  if (fnName === 'authenticateUser') {
    return { success: true, authenticated: true, username: user.username, name: user.fullName, role: 'Admin' };
  }
  if (fnName === 'saveLogBook') {
    db.prepare(`
      INSERT INTO spreader_logbook (entry_date, shift, machine_no, grade_mix, emulsion_pct, operator_name, raw_json)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(p.date || today, p.shift || 'Shift A', p.machineNo || 'SP-01', p.gradeMix || 'TD-4', Number(p.emulsionPct || 22), p.operator || '', JSON.stringify(p));
    return { success: true, message: 'Spreader LogBook saved.' };
  }
  if (fnName === 'getLogBookEntries') {
    const rows = db.prepare('SELECT * FROM spreader_logbook ORDER BY id DESC LIMIT 100').all() as any[];
    return rows.map((r) => ({ id: r.id, date: r.entry_date, shift: r.shift, machineNo: r.machine_no, gradeMix: r.grade_mix, emulsionPct: r.emulsion_pct, operator: r.operator_name, ...safeJson(r.raw_json) }));
  }
  if (fnName === 'saveMachineBreakdown') {
    db.prepare(`
      INSERT INTO spreader_breakdown (entry_date, shift, machine_no, reason, duration_mins, raw_json)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(p.date || today, p.shift || 'Shift A', p.machineNo || 'SP-01', p.reason || 'Pin Roller Clean', Number(p.duration || 20), JSON.stringify(p));
    return { success: true };
  }
  if (fnName === 'saveMeterReading') {
    const openR = Number(p.openingReading || 0);
    const closeR = Number(p.closingReading || 0);
    db.prepare(`
      INSERT INTO spreader_meter_reading (entry_date, shift, machine_no, opening_reading, closing_reading, net_reading, raw_json)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(p.date || today, p.shift || 'Shift A', p.machineNo || 'SP-01', openR, closeR, closeR - openR, JSON.stringify(p));
    return { success: true };
  }
  if (fnName === 'getMeterReadingForDateShift') {
    const rows = db.prepare('SELECT * FROM spreader_meter_reading ORDER BY id DESC LIMIT 20').all() as any[];
    return rows;
  }
  if (fnName === 'saveRollProduction') {
    db.prepare(`
      INSERT INTO spreader_roll_production (entry_date, shift, machine_no, quality, rolls_count, weight_mt, raw_json)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(p.date || today, p.shift || 'Shift A', p.machineNo || 'SP-01', p.quality || 'TD-4 Mix', Number(p.rolls || p.rollsCount || 80), Number(p.weightMt || p.weight || 8.5), JSON.stringify(p));
    return { success: true };
  }
  if (fnName === 'getReportData') {
    const rolls = db.prepare('SELECT * FROM spreader_roll_production ORDER BY id DESC LIMIT 100').all() as any[];
    const logs = db.prepare('SELECT * FROM spreader_logbook ORDER BY id DESC LIMIT 100').all() as any[];
    const breakdowns = db.prepare('SELECT * FROM spreader_breakdown ORDER BY id DESC LIMIT 100').all() as any[];
    return {
      success: true,
      rollProduction: rolls.map((r) => ({ id: r.id, date: r.entry_date, shift: r.shift, machineNo: r.machine_no, quality: r.quality, rolls: r.rolls_count, weightMt: r.weight_mt, ...safeJson(r.raw_json) })),
      logBook: logs,
      breakdowns,
      rows: rolls,
    };
  }
  return { success: true };
}

function executeVlBeamingRpc(fnName: string, args: any[], today: string) {
  const p = args[0] || {};
  if (fnName === 'getOperatorList') {
    return ['B. K. Shaw', 'S. Das', 'M. Routh', 'P. Sardar', 'A. Khan'];
  }
  if (fnName === 'getRoundState') {
    const r = db.prepare("SELECT * FROM vl_beaming_rounds WHERE status = 'OPEN' ORDER BY id DESC LIMIT 1").get() as any;
    return { ok: true, roundNo: r?.round_no || 'VLR-101', machineNo: r?.machine_no || 'VLB-01', status: 'OPEN', totalMeters: r?.total_meters || 0 };
  }
  if (fnName === 'saveLogBookEntry') {
    db.prepare(`
      INSERT INTO vl_beaming_logbook (entry_date, shift, machine_no, beam_no, quality, operator_name, meters, raw_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(p.date || today, p.shift || 'A', p.machineNo || 'VLB-01', p.beamNo || 'VB-11', p.quality || 'Hessian', p.operator || '', Number(p.meters || 0), JSON.stringify(p));
    return { ok: true, success: true };
  }
  if (fnName === 'getLogBookData' || fnName === 'getLastLogBookInfo') {
    const rows = db.prepare('SELECT * FROM vl_beaming_logbook ORDER BY id DESC LIMIT 100').all() as any[];
    return { ok: true, rows, lastEntry: rows[0] || null };
  }
  if (fnName === 'saveProductionEntry') {
    db.prepare(`
      INSERT INTO vl_beaming_production (round_no, entry_date, shift, machine_no, beam_no, quality, cuts, meters, operator_name, raw_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(p.roundNo || 'VLR-101', p.date || today, p.shift || 'A', p.machineNo || 'VLB-01', p.beamNo || 'VB-12', p.quality || 'Hessian', Number(p.cuts || 0), Number(p.meters || 0), p.operator || '', JSON.stringify(p));
    return { ok: true, success: true };
  }
  if (fnName === 'getOpenRoundEntries' || fnName === 'getVerificationData' || fnName === 'getReportSummary') {
    const rows = db.prepare('SELECT * FROM vl_beaming_production ORDER BY id DESC LIMIT 100').all() as any[];
    return { ok: true, rows, entries: rows, summary: rows };
  }
  return { ok: true, success: true };
}

function executeVlLoomRpc(fnName: string, args: any[], today: string) {
  const p = args[0] || {};
  if (fnName === 'saveLogbookEntry') {
    db.prepare(`
      INSERT INTO vl_loom_logbook (group_id, entry_date, shift, loom_no, quality, beam_no, weaver_name, raw_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(p.groupId || `GRP-${Date.now().toString().slice(-4)}`, p.date || today, p.shift || 'A', p.loomNo || 'VL-01', p.quality || 'Hessian', p.beamNo || 'VB-11', p.weaver || '', JSON.stringify(p));
    return { ok: true, success: true };
  }
  if (fnName === 'getLogbookEntries') {
    const rows = db.prepare('SELECT * FROM vl_loom_logbook ORDER BY id DESC LIMIT 100').all() as any[];
    return { ok: true, entries: rows, rows };
  }
  if (fnName === 'deleteLogbookGroup') {
    const id = String(p.groupId || args[0] || '');
    db.prepare('DELETE FROM vl_loom_logbook WHERE group_id = ? OR id = ?').run(id, Number(id) || 0);
    return { ok: true, success: true };
  }
  if (fnName === 'saveProductionEntry') {
    db.prepare(`
      INSERT INTO vl_loom_production (entry_date, shift, loom_no, quality, cuts, meters, weaver_name, raw_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(p.date || today, p.shift || 'A', p.loomNo || 'VL-01', p.quality || 'Hessian', Number(p.cuts || 0), Number(p.meters || 0), p.weaver || '', JSON.stringify(p));
    return { ok: true, success: true };
  }
  if (fnName === 'getProductionEntries' || fnName === 'getReportData') {
    const rows = db.prepare('SELECT * FROM vl_loom_production ORDER BY id DESC LIMIT 100').all() as any[];
    return { ok: true, rows, entries: rows, data: rows };
  }
  if (fnName === 'deleteProductionRow') {
    const id = Number(p.id || args[0] || 0);
    db.prepare('DELETE FROM vl_loom_production WHERE id = ?').run(id);
    return { ok: true, success: true };
  }
  return { ok: true, success: true };
}

function safeJson(str: string): Record<string, any> {
  try {
    return JSON.parse(str || '{}');
  } catch {
    return {};
  }
}
