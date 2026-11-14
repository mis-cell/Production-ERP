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
  ensureRequiredRoles();
  db.prepare("UPDATE roles SET description = ''").run();
  cleanupLegacyDummyDataOnce();
}

function ensureRequiredRoles() {
  const requiredRoles: {
    name: string;
    isAdmin: number;
    canView: number;
    canCreate: number;
    canEdit: number;
    canDelete: number;
    canReport: number;
  }[] = [
    { name: 'Super User', isAdmin: 1, canView: 1, canCreate: 1, canEdit: 1, canDelete: 1, canReport: 1 },
    { name: 'User', isAdmin: 0, canView: 1, canCreate: 1, canEdit: 1, canDelete: 0, canReport: 1 },
    { name: 'Operator', isAdmin: 0, canView: 1, canCreate: 1, canEdit: 0, canDelete: 0, canReport: 1 },
  ];

  const findRole = db.prepare('SELECT id FROM roles WHERE LOWER(name) = LOWER(?)');
  const insertRole = db.prepare('INSERT INTO roles (name, description, is_admin) VALUES (?, ?, ?)');
  const upsertPerm = db.prepare(`
    INSERT INTO role_permissions (role_id, module_key, can_view, can_create, can_edit, can_delete, can_report)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(role_id, module_key) DO NOTHING
  `);

  for (const r of requiredRoles) {
    let existing = findRole.get(r.name) as { id: number } | undefined;
    if (!existing) {
      const info = insertRole.run(r.name, '', r.isAdmin);
      existing = { id: Number(info.lastInsertRowid) };
    }
    for (const mod of MODULES) {
      upsertPerm.run(existing.id, mod.key, r.canView, r.canCreate, r.canEdit, r.canDelete, r.canReport);
    }
  }
}

function cleanupLegacyDummyDataOnce() {
  // Always ensure primary admin account is ANKANA
  db.prepare("UPDATE users SET full_name = 'ANKANA' WHERE LOWER(username) = 'admin'").run();

  // Always remove the 4 legacy dummy users if present
  const dummyUsernames = ['manager', 'spinning_sup', 'loom_sup', 'finishing_op'];
  const placeholders = dummyUsernames.map(() => '?').join(',');
  db.prepare(`
    DELETE FROM user_permissions
    WHERE user_id IN (SELECT id FROM users WHERE username IN (${placeholders}))
  `).run(...dummyUsernames);
  db.prepare(`DELETE FROM users WHERE username IN (${placeholders})`).run(...dummyUsernames);

  // Clean up seeded dummy production rows once so only real user-entered data remains
  const flag = db
    .prepare("SELECT setting_value FROM cutting_settings WHERE setting_key = '__dummy_cleaned_v1'")
    .get() as { setting_value: string } | undefined;

  if (!flag) {
    const dummyTablesToClear = [
      'carding_log_book',
      'carding_machine_breakdown',
      'carding_pile_stock',
      'cutting_shifts',
      'cutting_production_rows',
      'cutting_masters',
      'damping_shifts',
      'damping_production_rows',
      'damping_masters',
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
    for (const tbl of dummyTablesToClear) {
      try {
        db.prepare(`DELETE FROM "${tbl}"`).run();
      } catch {
        // ignore
      }
    }
    db.prepare(`
      INSERT INTO cutting_settings (setting_key, setting_value)
      VALUES ('__dummy_cleaned_v1', '1')
      ON CONFLICT(setting_key) DO UPDATE SET setting_value = '1'
    `).run();
  }
}

function seedInitialData() {
  const roleCount = (db.prepare('SELECT COUNT(*) as c FROM roles').get() as { c: number }).c;
  if (roleCount > 0) return;

  // 1. Seed Roles
  const insertRole = db.prepare(
    'INSERT INTO roles (name, description, is_admin) VALUES (?, ?, ?)'
  );
  const superAdminRoleId = Number(
    insertRole.run('Super Admin', '', 1).lastInsertRowid
  );
  const superUserRoleId = Number(
    insertRole.run('Super User', '', 1).lastInsertRowid
  );
  const userRoleId = Number(
    insertRole.run('User', '', 0).lastInsertRowid
  );
  const operatorRoleId = Number(
    insertRole.run('Operator', '', 0).lastInsertRowid
  );
  const millManagerRoleId = Number(
    insertRole.run('Mill Manager', '', 0).lastInsertRowid
  );
  const spinningSupRoleId = Number(
    insertRole.run('Spinning & Prep Supervisor', '', 0).lastInsertRowid
  );
  const beamingWeavingRoleId = Number(
    insertRole.run('Beaming & Loom Supervisor', '', 0).lastInsertRowid
  );
  const finishingRoleId = Number(
    insertRole.run('Finishing & Packing Officer', '', 0).lastInsertRowid
  );

  // 2. Seed Role Permissions for all 16 modules
  const insertRolePerm = db.prepare(`
    INSERT INTO role_permissions (role_id, module_key, can_view, can_create, can_edit, can_delete, can_report)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const mod of MODULES) {
    // Super Admin & Super User: everything enabled
    insertRolePerm.run(superAdminRoleId, mod.key, 1, 1, 1, 1, 1);
    insertRolePerm.run(superUserRoleId, mod.key, 1, 1, 1, 1, 1);
    // User: view, create, edit, report across all modules
    insertRolePerm.run(userRoleId, mod.key, 1, 1, 1, 0, 1);
    // Operator: view, create, report across all modules
    insertRolePerm.run(operatorRoleId, mod.key, 1, 1, 0, 0, 1);
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

  // 3. Seed ONLY the Admin user (ANKANA) - No dummy users or dummy sample rows
  const insertUser = db.prepare(`
    INSERT INTO users (username, password_hash, full_name, employee_code, department, role_id, is_active)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `);
  insertUser.run('admin', 'admin123', 'ANKANA', 'BJM-001', 'All Departments', superAdminRoleId);
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

const CARDING_WASTAGE_TYPES = [
  'Caddis',
  'Dropping',
  'Thread Waste',
  'Rove Waste',
  'Gunny Cutting',
  'Sacking Cutting',
  'Hessian Cutting',
  'Broad Loom Cutting',
  'Sweeping Waste',
  'Drawing Waste',
];

function executeCardingRpc(fnName: string, args: any[], user: { username: string; fullName: string }, today: string) {
  const payload = args[0] || {};
  if (fnName === 'checkLogin') {
    return true;
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
        r.shift || payload.shift || 'A',
        r.machineType || r.type || 'Carding',
        r.idleMachine || r.machineNo || r.machine || '-',
        r.batch || r.quality || '-',
        r.rotation || r.operator || r.operatorName || '',
        Number(r.production || r.weight || r.mt || 0),
        r.instruction || r.remarks || '',
        JSON.stringify(r),
        user.username
      );
    }
    return { success: true, count: rows.length, message: `Saved ${rows.length} Carding Log Book record(s).` };
  }
  if (fnName === 'saveMachineBreakdown') {
    const rows = Array.isArray(payload.rows)
      ? payload.rows
      : Array.isArray(payload.entries)
      ? payload.entries
      : [payload];
    const stmt = db.prepare(`
      INSERT INTO carding_machine_breakdown (entry_date, shift, machine_no, stop_time, start_time, duration_mins, reason, raw_json, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const r of rows) {
      const rec = {
        ...r,
        date: r.date || payload.date || today,
        shift: r.shift || payload.shift || 'A',
      };
      stmt.run(
        rec.date,
        rec.shift,
        r.machineNo || r.machine || 'FC 1',
        r.start || r.stopTime || r.from || '',
        r.end || r.startTime || r.to || '',
        Number(r.breakTime || r.duration || r.minutes || 0),
        r.reason || r.remarks || '',
        JSON.stringify(rec),
        user.username
      );
    }
    return { success: true, count: rows.length, message: 'Carding Machine Breakdown saved.' };
  }
  if (fnName === 'savePileStock') {
    const dateVal = payload.date || today;
    const shiftVal = payload.shift || 'A';
    const wastageList = Array.isArray(payload.wastage) ? payload.wastage : [];
    const totalOpen = wastageList.reduce((a: number, w: any) => a + Number(w.opening || 0), 0);
    const totalRecv = wastageList.reduce((a: number, w: any) => a + Number(w.generation || 0) + Number(w.receivedOS || 0), 0);
    const totalCons = wastageList.reduce((a: number, w: any) => a + Number(w.consumption || 0), 0);
    const totalClose = wastageList.reduce((a: number, w: any) => a + Number(w.closing || 0), 0);
    db.prepare(`
      INSERT INTO carding_pile_stock (entry_date, shift, pile_type, opening_stock, received_qty, consumed_qty, closing_stock, raw_json, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      dateVal,
      shiftVal,
      'Pile Stock Book',
      totalOpen,
      totalRecv,
      totalCons,
      totalClose,
      JSON.stringify(payload),
      user.username
    );
    return { success: true, count: 1, message: 'Pile Stock saved.' };
  }
  if (fnName === 'getReport') {
    const f = payload || {};
    const fromDate = String(f.fromDate || '');
    const toDate = String(f.toDate || '');
    const shiftFilter = String(f.shift || 'All Shift');
    const reportType = String(f.reportType || 'Log Book');
    const search = String(f.search || '').trim().toLowerCase();

    const matchDateShift = (d: string, s: string) => {
      if (fromDate && d < fromDate) return false;
      if (toDate && d > toDate) return false;
      if (shiftFilter && shiftFilter !== 'All Shift' && shiftFilter !== 'ALL' && s !== shiftFilter) return false;
      return true;
    };

    if (reportType === 'Machine Breakdown') {
      const breakdowns = db.prepare('SELECT * FROM carding_machine_breakdown ORDER BY id DESC LIMIT 300').all() as any[];
      const headers = ['Date', 'Shift', 'Type', 'Machine No', 'Reason', 'Start Time', 'End Time', 'Break Time (min)'];
      const rows = breakdowns
        .filter((b) => matchDateShift(b.entry_date, b.shift))
        .map((b) => {
          const j = safeJson(b.raw_json);
          return [
            b.entry_date || j.date || '',
            b.shift || j.shift || '',
            j.type || (String(b.machine_no || '').split(' ')[0] || 'Carding'),
            b.machine_no || j.machineNo || '',
            b.reason || j.reason || '',
            b.stop_time || j.start || '',
            b.start_time || j.end || '',
            String(b.duration_mins ?? j.breakTime ?? 0),
          ];
        })
        .filter((r) => !search || r.some((c) => String(c).toLowerCase().includes(search)));
      return { success: true, headers, rows };
    }

    if (reportType === 'Pile Stock Book') {
      const piles = db.prepare('SELECT * FROM carding_pile_stock ORDER BY id DESC LIMIT 200').all() as any[];
      const headers: string[] = [
        'Date',
        'Shift',
        'Batch & Preparation (kg)',
        'SPG & WDG (kg)',
        'S4 (kg)',
        'Skg V/L & N/L (kg)',
        'Finishing (kg)',
        'Dust Total (kg)',
        'Jute Issue (kg)',
        'Dust Percentage (%)',
        'Eco Fin (N)',
        'Fintex (N)',
        'C/W Rolls',
      ];
      const allTypes = new Set<string>(CARDING_WASTAGE_TYPES);
      for (const p of piles) {
        const j = safeJson(p.raw_json);
        if (Array.isArray(j.wastage)) {
          for (const w of j.wastage) {
            if (w && w.type) allTypes.add(String(w.type));
          }
        }
      }
      const typeList = Array.from(allTypes);
      for (const t of typeList) {
        headers.push(
          `${t} - Opening`,
          `${t} - Generation`,
          `${t} - Received O/S`,
          `${t} - Total`,
          `${t} - Consumption`,
          `${t} - Closing Balance`
        );
      }
      const rows = piles
        .filter((p) => matchDateShift(p.entry_date, p.shift))
        .map((p) => {
          const j = safeJson(p.raw_json);
          const dust = j.dust || {};
          const oil = j.oil || {};
          const wMap: Record<string, any> = {};
          if (Array.isArray(j.wastage)) {
            for (const w of j.wastage) {
              if (w && w.type) wMap[String(w.type)] = w;
            }
          }
          const base = [
            p.entry_date || j.date || '',
            p.shift || j.shift || '',
            dust.batchPrep ?? 0,
            dust.spgWdg ?? 0,
            dust.s4 ?? 0,
            dust.skgVlNl ?? 0,
            dust.finishing ?? 0,
            dust.total ?? 0,
            dust.juteIssue ?? 0,
            dust.dustPct ?? 0,
            oil.ecoFin ?? 0,
            oil.fintex ?? 0,
            oil.cwRolls ?? 0,
          ];
          for (const t of typeList) {
            const w = wMap[t] || {};
            base.push(
              w.opening ?? 0,
              w.generation ?? 0,
              w.receivedOS ?? 0,
              w.total ?? 0,
              w.consumption ?? 0,
              w.closing ?? 0
            );
          }
          return base;
        })
        .filter((r) => !search || r.some((c) => String(c).toLowerCase().includes(search)));
      return { success: true, headers, rows };
    }

    const logs = db.prepare('SELECT * FROM carding_log_book ORDER BY id DESC LIMIT 300').all() as any[];
    const headers = [
      'Date',
      'Shift',
      'Rotation of Staff',
      'Idle Machine',
      'Batch',
      'If Batch Change',
      'Instruction Given by Senior',
    ];
    const rows = logs
      .filter((l) => matchDateShift(l.entry_date, l.shift))
      .map((l) => {
        const j = safeJson(l.raw_json);
        return [
          l.entry_date || j.date || '',
          l.shift || j.shift || '',
          j.rotation || l.operator_name || '',
          j.idleMachine || l.machine_no || '',
          j.batch || l.quality || '',
          j.ifBatchChange || '',
          j.instruction || l.remarks || '',
        ];
      })
      .filter((r) => !search || r.some((c) => String(c).toLowerCase().includes(search)));
    return { success: true, headers, rows };
  }
  return { success: true };
}

function buildShiftInitData(dept: 'cutting' | 'damping' | 'hemming') {
  const masterTable = `${dept}_masters`;
  const settingTable = dept === 'hemming' ? null : `${dept}_settings`;
  const today = new Date().toISOString().slice(0, 10);
  const masters = db.prepare(`SELECT * FROM ${masterTable} ORDER BY id ASC`).all() as any[];
  const settings = settingTable ? (db.prepare(`SELECT * FROM ${settingTable}`).all() as any[]) : [];
  const settingsObj: Record<string, string> = {};
  for (const s of settings) settingsObj[s.setting_key] = s.setting_value;

  const operators = masters
    .filter((m) => m.category === 'op' || m.category === 'operator')
    .map((m) => {
      const ex = safeJson(m.extra_json);
      return { id: m.id, name: m.name, no: ex.no ?? m.code ?? '' };
    });

  const machines = masters
    .filter((m) => m.category === 'mc' || m.category === 'machine')
    .map((m) => {
      const ex = safeJson(m.extra_json);
      return { id: m.id, name: m.name, no: ex.no ?? m.code ?? '' };
    });

  const coolies = masters
    .filter((m) => m.category === 'co' || m.category === 'coolie')
    .map((m) => {
      const ex = safeJson(m.extra_json);
      return { id: m.id, name: m.name, no: ex.no ?? m.code ?? '' };
    });

  const qualities = masters.filter((m) => m.category === 'quality').map((m) => m.name);
  const supervisors = masters.filter((m) => m.category === 'supervisor').map((m) => m.name);

  return {
    ok: true,
    success: true,
    today,
    operators,
    machines,
    coolies,
    qualities,
    supervisors,
    masters,
    unit: settingsObj.unit || 'm',
    tol: Number(settingsObj.tol || 1),
    settings: settingsObj,
  };
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
    return buildShiftInitData(dept);
  }

  if (fnName === 'getShift') {
    const date = String(typeof args[0] === 'object' && args[0] !== null ? args[0].date : args[0] || new Date().toISOString().slice(0, 10));
    const shift = String(typeof args[0] === 'object' && args[0] !== null ? args[0].shift : args[1] || 'A');
    const row = db.prepare(`SELECT * FROM ${shiftTable} WHERE shift_date = ? AND shift_name = ?`).get(date, shift) as any;
    if (!row) {
      return {
        ok: true,
        exists: false,
        found: false,
        date,
        shift,
        lines: [],
        rows: [],
        meta: { supervisor: '', remarks: '', bdRemark: '', s6: '', s2: '', s10: '' },
      };
    }
    const p = safeJson(row.payload_json);
    const lines = Array.isArray(p.lines) ? p.lines : Array.isArray(p.rows) ? p.rows : [];
    const meta = p.meta || {
      supervisor: p.supervisor ?? row.supervisor ?? '',
      remarks: p.remarks ?? '',
      bdRemark: p.bdRemark ?? '',
      s6: p.s6 ?? '',
      s2: p.s2 ?? '',
      s10: p.s10 ?? '',
    };
    return {
      ok: true,
      exists: true,
      found: true,
      id: row.id,
      date,
      shift,
      lines,
      rows: lines,
      meta,
      ...p,
    };
  }

  if (fnName === 'saveShift') {
    const payload = args[0] || {};
    const date = String(payload.date || new Date().toISOString().slice(0, 10));
    const shift = String(payload.shift || 'A');
    const supervisor = String(payload.supervisor || payload.meta?.supervisor || '');
    const lines = Array.isArray(payload.lines) ? payload.lines : Array.isArray(payload.rows) ? payload.rows : [];

    // Auto-register new operators, machines, and coolies into masters table
    const existingMasters = db.prepare(`SELECT * FROM ${masterTable}`).all() as any[];
    const upsertMaster = (cat: string, nameVal: string, noVal: string) => {
      const cleanName = String(nameVal || '').trim();
      if (!cleanName) return;
      const cleanNo = String(noVal || '').trim();
      const found = existingMasters.find(
        (m) => m.category === cat && String(m.name || '').toLowerCase() === cleanName.toLowerCase()
      );
      if (!found) {
        db.prepare(`INSERT INTO ${masterTable} (category, code, name, extra_json) VALUES (?, ?, ?, ?)`).run(
          cat,
          cleanNo || cleanName,
          cleanName,
          JSON.stringify({ name: cleanName, no: cleanNo })
        );
        existingMasters.push({ category: cat, name: cleanName, code: cleanNo });
      }
    };

    for (const l of lines) {
      if (l.operator) upsertMaster('op', l.operator, l.tno || '');
      if (l.machine) upsertMaster('mc', l.machine, '');
      if (l.coolie) upsertMaster('co', l.coolie, l.fno || '');
    }

    const storedPayload = {
      ...payload,
      date,
      shift,
      supervisor,
      lines,
      rows: lines,
      meta: {
        supervisor,
        remarks: payload.remarks ?? payload.meta?.remarks ?? '',
        bdRemark: payload.bdRemark ?? payload.meta?.bdRemark ?? '',
        s6: payload.s6 ?? payload.meta?.s6 ?? '',
        s2: payload.s2 ?? payload.meta?.s2 ?? '',
        s10: payload.s10 ?? payload.meta?.s10 ?? '',
      },
    };

    if (dept === 'cutting') {
      const totalCuts = lines.reduce((acc: number, r: any) => acc + Number(r.pieces || r.cuts || r.qty || 0), 0);
      const totalMt = lines.reduce((acc: number, r: any) => acc + Number(r.inwt || r.mt || r.weight || 0), 0);
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
      `).run(date, shift, supervisor, Number(payload.attendance || lines.length), totalCuts, totalMt, JSON.stringify(storedPayload), user.username);
    } else if (dept === 'damping') {
      const totalRolls = lines.length;
      const totalWeight = lines.reduce((acc: number, r: any) => acc + Number(r.outwt || r.inwt || r.weight || r.mt || 0), 0);
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
      `).run(date, shift, supervisor, totalRolls, totalWeight, JSON.stringify(storedPayload), user.username);
    } else {
      const totalBags = lines.reduce((acc: number, r: any) => acc + Number(r.bh || 0) + Number(r.jb || r.bags || r.qty || 0), 0);
      const totalMt = lines.reduce((acc: number, r: any) => acc + Number(r.bd || r.mt || r.weight || 0), 0);
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
      `).run(date, shift, supervisor, totalBags, totalMt, JSON.stringify(storedPayload), user.username);
    }
    return { ok: true, success: true, message: `${dept.toUpperCase()} shift ${shift} on ${date} saved.` };
  }

  if (fnName === 'deleteShift') {
    const date = String(typeof args[0] === 'object' && args[0] !== null ? args[0].date : args[0] || '');
    const shift = String(typeof args[0] === 'object' && args[0] !== null ? args[0].shift : args[1] || '');
    db.prepare(`DELETE FROM ${shiftTable} WHERE shift_date = ? AND shift_name = ?`).run(date, shift);
    return { ok: true, success: true, message: 'Shift deleted.' };
  }

  if (fnName === 'getReport') {
    const fromDate = typeof args[0] === 'string' ? args[0] : String(args[0]?.from || '');
    const toDate = typeof args[1] === 'string' ? args[1] : String(args[0]?.to || '');
    const allRows = db.prepare(`SELECT * FROM ${shiftTable} ORDER BY shift_date ASC, shift_name ASC`).all() as any[];
    const filteredRows = allRows.filter((r) => {
      if (fromDate && r.shift_date < fromDate) return false;
      if (toDate && r.shift_date > toDate) return false;
      return true;
    });

    const lines: any[] = [];
    const shifts: any[] = [];

    for (const r of filteredRows) {
      const p = safeJson(r.payload_json);
      const meta = p.meta || {};
      const shiftRec = {
        id: r.id,
        date: r.shift_date,
        shift: r.shift_name,
        supervisor: p.supervisor ?? meta.supervisor ?? r.supervisor ?? '',
        remarks: p.remarks ?? meta.remarks ?? '',
        bdRemark: p.bdRemark ?? meta.bdRemark ?? '',
        s6: p.s6 ?? meta.s6 ?? '',
        s2: p.s2 ?? meta.s2 ?? '',
        s10: p.s10 ?? meta.s10 ?? '',
      };
      shifts.push(shiftRec);

      const rawLines = Array.isArray(p.lines) ? p.lines : Array.isArray(p.rows) ? p.rows : [];
      rawLines.forEach((l: any, idx: number) => {
        if (dept === 'cutting') {
          lines.push({
            date: r.shift_date,
            shift: r.shift_name,
            sno: idx + 1,
            operator: String(l.operator || ''),
            tno: String(l.tno || ''),
            machine: String(l.machine || ''),
            roll: String(l.roll || ''),
            inwt: Number(l.inwt || 0),
            inlen: Number(l.inlen || 0),
            cutlen: Number(l.cutlen || 0),
            tgtwt: Number(l.tgtwt || 0),
            pieces: Number(l.pieces || 0),
            rej: Number(l.rej || 0),
            scrap: Number(l.scrap || 0),
          });
        } else if (dept === 'damping') {
          lines.push({
            date: r.shift_date,
            shift: r.shift_name,
            sno: idx + 1,
            operator: String(l.operator || ''),
            tno: String(l.tno || ''),
            machine: String(l.machine || ''),
            roll: String(l.roll || ''),
            inwt: Number(l.inwt || 0),
            inlen: Number(l.inlen || 0),
            mb: Number(l.mb || 0),
            tm: Number(l.tm || 0),
            ma: Number(l.ma || 0),
            outwt: Number(l.outwt || 0),
            used: Number(l.used || 0),
            time: Number(l.time || 0),
          });
        } else {
          const bh = Number(l.bh || 0);
          const jb = Number(l.jb || 0);
          const bd = Number(l.bd || 0);
          lines.push({
            date: r.shift_date,
            shift: r.shift_name,
            sno: idx + 1,
            operator: String(l.operator || ''),
            tno: String(l.tno || ''),
            coolie: String(l.coolie || ''),
            fno: String(l.fno || ''),
            bh,
            jb,
            bd,
            total: bh + jb,
          });
        }
      });
    }

    return { ok: true, success: true, lines, shifts, records: shifts, rows: lines, data: shifts };
  }

  if (fnName === 'saveMaster') {
    if (typeof args[0] === 'string') {
      const category = args[0]; // 'op' | 'mc' | 'co'
      const name = String(args[1] || '').trim();
      const no = String(args[2] || '').trim();
      if (name) {
        db.prepare(`DELETE FROM ${masterTable} WHERE category = ? AND LOWER(name) = LOWER(?)`).run(category, name);
        db.prepare(`INSERT INTO ${masterTable} (category, code, name, extra_json) VALUES (?, ?, ?, ?)`).run(
          category,
          no || name,
          name,
          JSON.stringify({ name, no })
        );
      }
    } else {
      const p = args[0] || {};
      const cat = p.category || p.type || 'op';
      const name = String(p.name || p.value || 'Item').trim();
      const no = String(p.no || p.code || '').trim();
      db.prepare(`INSERT INTO ${masterTable} (category, code, name, extra_json) VALUES (?, ?, ?, ?)`).run(
        cat,
        no || name,
        name,
        JSON.stringify({ name, no, ...p })
      );
    }
    return buildShiftInitData(dept);
  }

  if (fnName === 'deleteMaster') {
    if (typeof args[0] === 'string' && args[1] !== undefined) {
      const category = args[0];
      const name = String(args[1] || '');
      db.prepare(`DELETE FROM ${masterTable} WHERE category = ? AND LOWER(name) = LOWER(?)`).run(category, name);
    } else {
      const id = Number(args[0]?.id || args[0] || 0);
      db.prepare(`DELETE FROM ${masterTable} WHERE id = ?`).run(id);
    }
    return buildShiftInitData(dept);
  }

  if (fnName === 'saveSetting' && settingTable) {
    if (typeof args[0] === 'string') {
      const key = args[0];
      const val = String(args[1] ?? '');
      db.prepare(`INSERT OR REPLACE INTO ${settingTable} (setting_key, setting_value) VALUES (?, ?)`).run(key, val);
    } else {
      const p = args[0] || {};
      for (const [k, v] of Object.entries(p)) {
        db.prepare(`INSERT OR REPLACE INTO ${settingTable} (setting_key, setting_value) VALUES (?, ?)`).run(k, String(v));
      }
    }
    return buildShiftInitData(dept);
  }

  return buildShiftInitData(dept);
}

function getHerackleMastersList() {
  const rows = db.prepare('SELECT * FROM herackle_masters ORDER BY id ASC').all() as any[];
  return rows
    .map((m) => {
      const ex = safeJson(m.extra_json);
      return {
        Operator: ex.Operator || m.name || '',
        OpToken: ex.OpToken || m.code || '',
        Coolie: ex.Coolie || '',
        CoolieToken: ex.CoolieToken || '',
      };
    })
    .filter((m) => m.Operator || m.OpToken);
}

function executeHerackleRpc(fnName: string, args: any[], user: { username: string }) {
  const today = new Date().toISOString().slice(0, 10);
  if (fnName === 'getInit') {
    const masters = getHerackleMastersList();
    return {
      ok: true,
      today,
      masters,
      qualities: ['A Twill', 'B Twill'],
      machines: ['1', '2', '3', '4'],
    };
  }
  if (fnName === 'saveRecord') {
    const p = args[0] || {};
    const date = String(p.date || today);
    const shift = String(p.shift || 'A');
    const mech = String(p.mech || '1').trim();
    const shiftKey = mech ? `${shift}|${mech}` : shift;
    const rawLines = Array.isArray(p.lines) ? p.lines : Array.isArray(p.rows) ? p.rows : [];
    const activeLines = rawLines.filter((l: any) => l.operator || l.opToken || l.Operator || l.OpToken);

    const existing = db
      .prepare('SELECT * FROM herackle_records WHERE record_date = ? AND (shift_name = ? OR (shift_name = ? AND supervisor = ?))')
      .get(date, shiftKey, shift, mech) as any;

    if (existing && !p.overwrite && String(p.id || '') !== String(existing.id)) {
      return { ok: true, duplicate: true, id: existing.id };
    }

    let production = 0;
    for (const l of activeLines) {
      const tot =
        (Number(l.a ?? l.ATwill ?? 0) || 0) +
        (Number(l.b ?? l.BTwill ?? 0) || 0) +
        (Number(l.o1 ?? l.Other1 ?? 0) || 0) +
        (Number(l.o2 ?? l.Other2 ?? 0) || 0);
      production += tot;

      const opName = String(l.operator || l.Operator || '').trim();
      const opTok = String(l.opToken || l.OpToken || '').trim();
      const coName = String(l.coolie || l.Coolie || '').trim();
      const coTok = String(l.coolieToken || l.CoolieToken || '').trim();
      if (opName || opTok) {
        db.prepare('DELETE FROM herackle_masters WHERE LOWER(name) = LOWER(?)').run(opName || opTok);
        db.prepare('INSERT INTO herackle_masters (category, name, extra_json) VALUES (?, ?, ?)').run(
          'operator',
          opName || opTok,
          JSON.stringify({ Operator: opName, OpToken: opTok, Coolie: coName, CoolieToken: coTok })
        );
      }
    }
    production = Math.round(production * 100) / 100;
    const hands = Number(p.hands || activeLines.length || 0);
    const average = hands > 0 ? Math.round((production / hands) * 100) / 100 : 0;

    const storedPayload = {
      ...p,
      date,
      shift,
      mech,
      hands,
      breakdown: Number(p.breakdown || 0),
      note: p.note || '',
      production,
      average,
      lines: activeLines,
    };

    if (existing) {
      db.prepare(`
        UPDATE herackle_records
        SET record_date = ?, shift_name = ?, supervisor = ?, total_qty = ?, total_weight = ?, payload_json = ?, updated_by = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(date, shiftKey, mech, production, average, JSON.stringify(storedPayload), user.username, existing.id);
      return {
        ok: true,
        duplicate: false,
        id: existing.id,
        production,
        average,
        masters: getHerackleMastersList(),
      };
    } else {
      const info = db.prepare(`
        INSERT INTO herackle_records (record_date, shift_name, supervisor, total_qty, total_weight, payload_json, updated_by, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(date, shiftKey, mech, production, average, JSON.stringify(storedPayload), user.username);
      return {
        ok: true,
        duplicate: false,
        id: Number(info.lastInsertRowid),
        production,
        average,
        masters: getHerackleMastersList(),
      };
    }
  }
  if (fnName === 'findRecord') {
    const date = String(typeof args[0] === 'object' ? args[0]?.date : args[0] || today);
    const shift = String(typeof args[0] === 'object' ? args[0]?.shift : args[1] || 'A');
    const mech = String(typeof args[0] === 'object' ? args[0]?.mech : args[2] || '').trim();
    const shiftKey = mech ? `${shift}|${mech}` : shift;
    const rec = db
      .prepare('SELECT * FROM herackle_records WHERE record_date = ? AND (shift_name = ? OR (shift_name = ? AND supervisor = ?))')
      .get(date, shiftKey, shift, mech) as any;
    if (!rec) return { ok: true, found: false, entry: null, lines: [] };
    const p = safeJson(rec.payload_json);
    const actualShift = String(p.shift || String(rec.shift_name).split('|')[0] || 'A');
    const actualMech = String(p.mech || rec.supervisor || String(rec.shift_name).split('|')[1] || '');
    const hands = Number(p.hands || 0);
    const prod = Number(p.production ?? rec.total_qty ?? 0);
    const avg = hands > 0 ? Math.round((prod / hands) * 100) / 100 : 0;
    const rawLines = Array.isArray(p.lines) ? p.lines : [];
    return {
      ok: true,
      found: true,
      entry: {
        ID: rec.id,
        Date: rec.record_date,
        Shift: actualShift,
        MechNo: actualMech,
        Hands: hands,
        BreakdownHrs: Number(p.breakdown || 0),
        Note: p.note || '',
        Production: prod,
        Average: avg,
      },
      lines: rawLines.map((l: any) => {
        const a = Number(l.a ?? l.ATwill ?? 0);
        const b = Number(l.b ?? l.BTwill ?? 0);
        const o1 = Number(l.o1 ?? l.Other1 ?? 0);
        const o2 = Number(l.o2 ?? l.Other2 ?? 0);
        return {
          ID: rec.id,
          Date: rec.record_date,
          Shift: actualShift,
          MechNo: actualMech,
          Operator: l.operator || l.Operator || '',
          OpToken: l.opToken || l.OpToken || '',
          Coolie: l.coolie || l.Coolie || '',
          CoolieToken: l.coolieToken || l.CoolieToken || '',
          ATwill: a || '',
          BTwill: b || '',
          Other1: o1 || '',
          Other2: o2 || '',
          Total: Math.round((a + b + o1 + o2) * 100) / 100,
          Status: l.status || l.Status || 'Present',
          Remarks: l.remarks || l.Remarks || '',
        };
      }),
    };
  }
  if (fnName === 'deleteRecord') {
    const first = args[0];
    if (typeof first === 'number' || (typeof first === 'string' && /^\d+$/.test(first))) {
      db.prepare('DELETE FROM herackle_records WHERE id = ?').run(Number(first));
    } else {
      const date = String(first?.date || first || '');
      const shift = String(first?.shift || args[1] || '');
      db.prepare('DELETE FROM herackle_records WHERE record_date = ? AND shift_name LIKE ?').run(date, `${shift}%`);
    }
    return { ok: true, success: true };
  }
  if (fnName === 'getReport') {
    const f = args[0] || {};
    const from = String(f.from || '');
    const to = String(f.to || '');
    const shiftFilter = String(f.shift || '');
    const mechFilter = String(f.mech || '').trim().toLowerCase();

    const rows = db.prepare('SELECT * FROM herackle_records ORDER BY record_date ASC, id ASC').all() as any[];
    const entries: any[] = [];
    const lines: any[] = [];

    for (const rec of rows) {
      const p = safeJson(rec.payload_json);
      const d = rec.record_date;
      const sh = String(p.shift || String(rec.shift_name).split('|')[0] || 'A');
      const m = String(p.mech || rec.supervisor || String(rec.shift_name).split('|')[1] || '');

      if (from && d < from) continue;
      if (to && d > to) continue;
      if (shiftFilter && sh !== shiftFilter) continue;
      if (mechFilter && m.toLowerCase() !== mechFilter) continue;

      const hands = Number(p.hands || 0);
      const prod = Number(p.production ?? rec.total_qty ?? 0);
      const avg = hands > 0 ? Math.round((prod / hands) * 100) / 100 : 0;

      entries.push({
        ID: rec.id,
        Date: d,
        Shift: sh,
        MechNo: m,
        Hands: hands,
        Production: prod,
        Average: avg,
        BreakdownHrs: Number(p.breakdown || 0),
        Note: p.note || '',
      });

      const rawLines = Array.isArray(p.lines) ? p.lines : [];
      for (const l of rawLines) {
        const a = Number(l.a ?? l.ATwill ?? 0);
        const b = Number(l.b ?? l.BTwill ?? 0);
        const o1 = Number(l.o1 ?? l.Other1 ?? 0);
        const o2 = Number(l.o2 ?? l.Other2 ?? 0);
        lines.push({
          ID: rec.id,
          Date: d,
          Shift: sh,
          MechNo: m,
          Operator: l.operator || l.Operator || '',
          OpToken: l.opToken || l.OpToken || '',
          Coolie: l.coolie || l.Coolie || '',
          CoolieToken: l.coolieToken || l.CoolieToken || '',
          ATwill: a,
          BTwill: b,
          Other1: o1,
          Other2: o2,
          Total: Math.round((a + b + o1 + o2) * 100) / 100,
          Status: l.status || l.Status || 'Present',
          Remarks: l.remarks || l.Remarks || '',
        });
      }
    }

    return { ok: true, success: true, entries, lines, rows: entries, records: entries };
  }
  return { ok: true, success: true };
}

function executeLappingRpc(fnName: string, args: any[], user: { username: string }, today: string) {
  const p = args[0] || {};
  if (fnName === 'saveProduction') {
    const rows = Array.isArray(p.entries) ? p.entries : Array.isArray(p.rows) ? p.rows : [p];
    const stmt = db.prepare(`
      INSERT INTO lapping_production (entry_date, shift, machine_no, operator_name, quality, cuts, meters, weight_kg, raw_json, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const r of rows) {
      const dateVal = r.date || p.date || today;
      const shiftVal = r.shift || p.shift || 'A';
      const machVal = String(r.machine || r.machineNo || '1');
      const inchVal = Number(r.inch || r.quality || 34);
      const cutsVal = Number(r.cuts || 0);
      const metersVal = Number(r.meters || 0);
      const yardsVal = Number(r.yards || r.weight || r.weightKg || 0);
      stmt.run(
        dateVal,
        shiftVal,
        machVal,
        r.operator || r.operatorName || '',
        String(inchVal),
        cutsVal,
        metersVal,
        yardsVal,
        JSON.stringify({
          ...r,
          date: dateVal,
          shift: shiftVal,
          machine: machVal,
          inch: inchVal,
          cuts: cutsVal,
          meters: metersVal,
          yards: yardsVal,
          readings: Array.isArray(r.readings) ? r.readings.join(', ') : String(r.readings || ''),
        }),
        user.username
      );
    }
    return { ok: true, success: true, count: rows.length, message: `Saved ${rows.length} Lapping entry(s).` };
  }
  if (fnName === 'getReport') {
    const fromDate = String(p.from || '');
    const toDate = String(p.to || '');
    const shiftFilter = String(p.shift || '');
    const rawRows = db.prepare('SELECT * FROM lapping_production ORDER BY id ASC').all() as any[];
    const filtered = rawRows.filter((r) => {
      if (fromDate && r.entry_date < fromDate) return false;
      if (toDate && r.entry_date > toDate) return false;
      if (shiftFilter && r.shift !== shiftFilter) return false;
      return true;
    });
    return filtered.map((r) => {
      const j = safeJson(r.raw_json);
      const inch = Number(j.inch || r.quality || 34);
      return {
        id: r.id,
        date: r.entry_date,
        shift: r.shift,
        machine: String(j.machine || r.machine_no || '1'),
        inch,
        cuts: Number(r.cuts ?? j.cuts ?? 0),
        meters: Number(r.meters ?? j.meters ?? 0),
        yards: Number(j.yards ?? r.weight_kg ?? 0),
        readings: Array.isArray(j.readings) ? j.readings.join(', ') : String(j.readings || ''),
      };
    });
  }
  if (fnName === 'deleteRecord') {
    const id = Number(p?.id ?? args[0] ?? 0);
    db.prepare('DELETE FROM lapping_production WHERE id = ?').run(id);
    return { ok: true, success: true };
  }
  return { ok: true, success: true };
}

function getOrCreateNarrowBeamingRound() {
  let round = db.prepare("SELECT * FROM narrow_beaming_rounds WHERE status = 'OPEN' ORDER BY id DESC LIMIT 1").get() as any;
  if (!round) {
    const nextNum = ((db.prepare('SELECT COUNT(*) as c FROM narrow_beaming_rounds').get() as any)?.c || 0) + 1;
    const roundId = String(nextNum);
    db.prepare("INSERT INTO narrow_beaming_rounds (round_id, machine_no, quality, status) VALUES (?, '1', 'Hessian', 'OPEN')").run(roundId);
    round = db.prepare('SELECT * FROM narrow_beaming_rounds WHERE round_id = ? ORDER BY id DESC LIMIT 1').get(roundId);
  }
  return round;
}

function executeNarrowBeamingRpc(fnName: string, arg: any, today: string) {
  const round = getOrCreateNarrowBeamingRound();
  const currentRoundNum = Number(round.id || 1);

  if (fnName === 'getCurrentRound') {
    return { ok: true, data: currentRoundNum };
  }
  if (fnName === 'getShiftContext') {
    const lastLog = db.prepare('SELECT * FROM narrow_beaming_logs ORDER BY id DESC LIMIT 1').get() as any;
    if (!lastLog) {
      return { ok: true, data: { date: today, shift: 'A', operator: '' } };
    }
    const j = safeJson(lastLog.raw_json);
    return {
      ok: true,
      data: {
        date: lastLog.entry_date || j.date || today,
        shift: lastLog.shift || j.shift || 'A',
        operator: lastLog.operator_name || j.operator || '',
      },
    };
  }
  if (fnName === 'saveLogEntry') {
    const p = arg || {};
    db.prepare(`
      INSERT INTO narrow_beaming_logs (entry_date, shift, machine_no, beam_no, quality, operator_name, cuts, meters, raw_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      p.date || today,
      p.shift || 'A',
      p.machineNo || p.idleReason || '-',
      p.beamNo || '-',
      p.quality || '-',
      p.operator || '',
      0,
      0,
      JSON.stringify(p)
    );
    return { ok: true, data: { saved: true, message: 'Log Book entry saved.' } };
  }
  if (fnName === 'getLogEntries') {
    const rows = db.prepare('SELECT * FROM narrow_beaming_logs ORDER BY id DESC LIMIT 50').all() as any[];
    return {
      ok: true,
      data: rows.map((r) => {
        const j = safeJson(r.raw_json);
        return {
          id: r.id,
          Date: r.entry_date || j.date || '',
          Shift: r.shift || j.shift || '',
          'Operator Name': r.operator_name || j.operator || '',
          'Start Time': j.startTime || '',
          'End Time': j.endTime || '',
          'Hours Worked': j.hoursWorked || '',
          'Detention Hours': j.detentionHours || '',
          'Idle Reason': j.idleReason || '',
          Instruction: j.instruction || '',
        };
      }),
    };
  }
  if (fnName === 'getCutStatus') {
    const machineNo = String(arg || '').trim();
    const lastProd = db
      .prepare('SELECT * FROM narrow_beaming_production WHERE machine_no = ? ORDER BY id DESC LIMIT 1')
      .get(machineNo) as any;
    if (!lastProd) {
      return {
        ok: true,
        data: { hasRunningTarget: false, completed: false, lastCut: 0, target: 0, remaining: 0, startCut: 1 },
      };
    }
    const j = safeJson(lastProd.raw_json);
    const target = Number(j.cutsTarget || j['Cuts Target'] || 0);
    const lastCut = Number(j.endCut || j['End Cut'] || lastProd.cuts || 0);
    if (!target) {
      return {
        ok: true,
        data: { hasRunningTarget: false, completed: false, lastCut: 0, target: 0, remaining: 0, startCut: 1 },
      };
    }
    const completed = lastCut >= target;
    return {
      ok: true,
      data: {
        hasRunningTarget: true,
        completed,
        lastCut,
        target,
        remaining: Math.max(0, target - lastCut),
        startCut: completed ? 1 : lastCut + 1,
      },
    };
  }
  if (fnName === 'saveProductionEntry') {
    const p = arg || {};
    const machineNo = String(p.machineNo || '1').trim();
    const lastLog = db.prepare('SELECT * FROM narrow_beaming_logs ORDER BY id DESC LIMIT 1').get() as any;
    const logJson = lastLog ? safeJson(lastLog.raw_json) : {};
    const dateVal = p.date || lastLog?.entry_date || logJson.date || today;
    const shiftVal = p.shift || lastLog?.shift || logJson.shift || 'A';
    const operatorVal = p.operator || lastLog?.operator_name || logJson.operator || 'Operator';

    const lastProd = db
      .prepare('SELECT * FROM narrow_beaming_production WHERE machine_no = ? ORDER BY id DESC LIMIT 1')
      .get(machineNo) as any;
    const lastJson = lastProd ? safeJson(lastProd.raw_json) : {};
    const prevTarget = Number(lastJson.cutsTarget || lastJson['Cuts Target'] || 0);
    const prevEndCut = Number(lastJson.endCut || lastJson['End Cut'] || 0);
    const prevCompleted = prevTarget > 0 && prevEndCut >= prevTarget;

    const isNewRun = Boolean(p.startNewCut || !lastProd || prevCompleted);
    const startCut = isNewRun ? 1 : prevEndCut + 1;
    const endCut = Number(p.endCut || startCut);
    const target = Number(p.cutsTarget || prevTarget || endCut);
    const cuts = Math.max(1, endCut - startCut + 1);
    const lengthPerCut = Number(p.lengthPerCut || 0);
    const production = Math.round(cuts * lengthPerCut * 100) / 100;
    const completed = target > 0 && endCut >= target;

    const recordObj = {
      'Round ID': currentRoundNum,
      'Machine No': machineNo,
      Quality: p.quality || '',
      'Sl No': p.slNo || '',
      'Forma No': p.formaNo || '',
      'Cuts Target': target,
      'Start Cut': startCut,
      'End Cut': endCut,
      'No of Cuts': cuts,
      'Length per Cut': lengthPerCut,
      Production: production,
      'Operator Name': operatorVal,
      Date: dateVal,
      Shift: shiftVal,
      cutsTarget: target,
      startCut,
      endCut,
      cuts,
      lengthPerCut,
      production,
      completed,
    };

    db.prepare(`
      INSERT INTO narrow_beaming_production (round_id, entry_date, shift, machine_no, beam_no, quality, cuts, meters, operator_name, raw_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      String(currentRoundNum),
      dateVal,
      shiftVal,
      machineNo,
      String(p.slNo || ''),
      String(p.quality || ''),
      cuts,
      production,
      operatorVal,
      JSON.stringify(recordObj)
    );

    return {
      ok: true,
      data: {
        saved: true,
        message: 'Production entry saved',
        slNo: p.slNo || '',
        cuts,
        production,
        completed,
        round: currentRoundNum,
      },
    };
  }
  if (fnName === 'stopRound') {
    db.prepare("UPDATE narrow_beaming_rounds SET status = 'CLOSED', closed_at = datetime('now') WHERE status = 'OPEN'").run();
    const newRound = getOrCreateNarrowBeamingRound();
    return {
      ok: true,
      data: {
        closed: true,
        message: `Round stopped. Started Round #${newRound.id}`,
        round: Number(newRound.id),
      },
    };
  }
  if (fnName === 'getCurrentRoundEntries') {
    const rows = db
      .prepare('SELECT * FROM narrow_beaming_production WHERE round_id = ? ORDER BY id DESC')
      .all(String(currentRoundNum)) as any[];
    const mapped = rows.map((r) => {
      const j = safeJson(r.raw_json);
      return {
        id: r.id,
        'Round ID': j['Round ID'] ?? r.round_id,
        'Machine No': j['Machine No'] ?? r.machine_no,
        Quality: j.Quality ?? r.quality,
        'Sl No': j['Sl No'] ?? r.beam_no,
        'Forma No': j['Forma No'] ?? '',
        'Cuts Target': j['Cuts Target'] ?? '',
        'Start Cut': j['Start Cut'] ?? 1,
        'End Cut': j['End Cut'] ?? r.cuts,
        'No of Cuts': j['No of Cuts'] ?? r.cuts,
        'Length per Cut': j['Length per Cut'] ?? '',
        Production: j.Production ?? r.meters,
        'Operator Name': j['Operator Name'] ?? r.operator_name,
        Date: j.Date ?? r.entry_date,
        Shift: j.Shift ?? r.shift,
      };
    });
    return { ok: true, data: { round: currentRoundNum, rows: mapped } };
  }
  if (fnName === 'getVerificationData' || fnName === 'getReportData') {
    const prodRows = db.prepare('SELECT * FROM narrow_beaming_production ORDER BY id DESC LIMIT 300').all() as any[];
    const logRows = db.prepare('SELECT * FROM narrow_beaming_logs ORDER BY id DESC LIMIT 200').all() as any[];

    const productionEntries = prodRows.map((r) => {
      const j = safeJson(r.raw_json);
      return {
        id: r.id,
        'Round ID': j['Round ID'] ?? r.round_id,
        'Machine No': j['Machine No'] ?? r.machine_no,
        Quality: j.Quality ?? r.quality,
        'Sl No': j['Sl No'] ?? r.beam_no,
        'Forma No': j['Forma No'] ?? '',
        'Cuts Target': j['Cuts Target'] ?? '',
        'Start Cut': j['Start Cut'] ?? 1,
        'End Cut': j['End Cut'] ?? r.cuts,
        'No of Cuts': j['No of Cuts'] ?? r.cuts,
        'Length per Cut': j['Length per Cut'] ?? '',
        Production: j.Production ?? r.meters,
        'Operator Name': j['Operator Name'] ?? r.operator_name,
        Date: j.Date ?? r.entry_date,
        Shift: j.Shift ?? r.shift,
      };
    });

    const logEntries = logRows.map((r) => {
      const j = safeJson(r.raw_json);
      return {
        id: r.id,
        Date: r.entry_date || j.date || '',
        Shift: r.shift || j.shift || '',
        'Operator Name': r.operator_name || j.operator || '',
        'Start Time': j.startTime || '',
        'End Time': j.endTime || '',
        'Hours Worked': j.hoursWorked || '',
        'Detention Hours': j.detentionHours || '',
        'Idle Reason': j.idleReason || '',
        Instruction: j.instruction || '',
      };
    });

    const roundMap: Record<string, any> = {};
    for (const e of productionEntries) {
      const rid = String(e['Round ID'] || '1');
      if (!roundMap[rid]) {
        roundMap[rid] = { roundId: rid, entries: 0, cutsValues: [] as any[], lengthValues: [] as any[], totalProduction: 0 };
      }
      const g = roundMap[rid];
      g.entries += 1;
      g.totalProduction = Math.round((g.totalProduction + Number(e.Production || 0)) * 100) / 100;
      if (e['No of Cuts'] !== '' && !g.cutsValues.includes(e['No of Cuts'])) g.cutsValues.push(e['No of Cuts']);
      if (e['Length per Cut'] !== '' && !g.lengthValues.includes(e['Length per Cut'])) g.lengthValues.push(e['Length per Cut']);
    }

    return {
      ok: true,
      data: {
        generatedAt: today,
        currentRound: currentRoundNum,
        productionEntries,
        logEntries,
        rounds: Object.values(roundMap),
      },
    };
  }
  return { ok: true, data: { currentRound: currentRoundNum, generatedAt: today } };
}

function executeNarrowLoomRpc(fnName: string, args: any[], today: string) {
  const p = args[0] || {};
  if (fnName === 'saveLogbookEntry') {
    const total =
      (Number(p.lineSardar) || 0) +
      (Number(p.lineHelper) || 0) +
      (Number(p.beamCooley) || 0) +
      (Number(p.markaMan) || 0) +
      (Number(p.dailySardar) || 0) +
      (Number(p.weaver) || 0);
    const stored = { ...p, total };
    db.prepare(`
      INSERT INTO narrow_loom_logbook (entry_date, shift, loom_no, quality, beam_no, weaver_name, raw_json)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      p.date || today,
      p.shift || 'A',
      String(total),
      p.hoursWorked || '',
      p.instructions || '',
      String(p.weaver || ''),
      JSON.stringify(stored)
    );
    return { success: true, total, message: 'Narrow Loom Logbook entry saved.' };
  }
  if (fnName === 'saveProductionEntries') {
    const rows = Array.isArray(p.rows) ? p.rows : Array.isArray(p.entries) ? p.entries : [p];
    const stmt = db.prepare(`
      INSERT INTO narrow_loom_production (entry_date, shift, loom_no, quality, cuts, meters, efficiency, weaver_name, raw_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    let totalLoom = 0;
    let totalOut = 0;
    for (const r of rows) {
      const loomVal = Number(r.loom || r.loomNo || 0);
      const outVal = Number(r.out || r.cuts || r.meters || 0);
      totalLoom += loomVal;
      totalOut += outVal;
      stmt.run(
        r.date || p.date || today,
        r.shift || p.shift || 'A',
        String(loomVal),
        r.quality || 'Hessian',
        loomVal,
        outVal,
        Number(r.efficiency || 85),
        r.weaver || '',
        JSON.stringify({ ...r, date: r.date || p.date || today, shift: r.shift || p.shift || 'A', loom: loomVal, out: outVal })
      );
    }
    return {
      success: true,
      rowsSaved: rows.length,
      totalLoom,
      totalOut,
      message: `Saved ${rows.length} Narrow Loom production row(s).`,
    };
  }
  if (fnName === 'getReport') {
    const filterDate = String(p.date || '');
    const filterShift = String(p.shift || '');
    const prodRaw = db.prepare('SELECT * FROM narrow_loom_production ORDER BY id DESC LIMIT 200').all() as any[];
    const logsRaw = db.prepare('SELECT * FROM narrow_loom_logbook ORDER BY id DESC LIMIT 200').all() as any[];

    const logbook = logsRaw
      .filter((r) => (!filterDate || r.entry_date === filterDate) && (!filterShift || r.shift === filterShift))
      .map((r) => {
        const j = safeJson(r.raw_json);
        const totalHands =
          Number(j.total ?? 0) ||
          (Number(j.lineSardar) || 0) +
            (Number(j.lineHelper) || 0) +
            (Number(j.beamCooley) || 0) +
            (Number(j.markaMan) || 0) +
            (Number(j.dailySardar) || 0) +
            (Number(j.weaver) || 0);
        return {
          id: r.id,
          Date: r.entry_date,
          Shift: r.shift,
          'Line Sardar': Number(j.lineSardar || 0),
          'Line Helper': Number(j.lineHelper || 0),
          'Beam Cooley': Number(j.beamCooley || 0),
          'Marka Man': Number(j.markaMan || 0),
          'Daily Sardar': Number(j.dailySardar || 0),
          Weaver: Number(j.weaver || 0),
          Total: totalHands,
          'Hours Worked': j.hoursWorked || r.quality || '',
          Instructions: j.instructions || r.beam_no || '',
        };
      });

    const production = prodRaw
      .filter((r) => (!filterDate || r.entry_date === filterDate) && (!filterShift || r.shift === filterShift))
      .map((r) => {
        const j = safeJson(r.raw_json);
        return {
          id: r.id,
          Date: r.entry_date,
          Shift: r.shift,
          Quality: r.quality || j.quality || '',
          Loom: Number(j.loom ?? r.cuts ?? 0),
          Out: Number(j.out ?? r.meters ?? 0),
        };
      });

    const totals = {
      hands: logbook.reduce((a, r) => a + Number(r.Total || 0), 0),
      loom: production.reduce((a, r) => a + Number(r.Loom || 0), 0),
      out: production.reduce((a, r) => a + Number(r.Out || 0), 0),
    };

    return {
      success: true,
      totals,
      logbook,
      production,
      rows: production,
    };
  }
  return { success: true };
}

function getOrCreatePreBeamingRound() {
  let round = db.prepare("SELECT * FROM pre_beaming_rounds WHERE status = 'OPEN' ORDER BY id DESC LIMIT 1").get() as any;
  if (!round) {
    const nextNum = ((db.prepare('SELECT COUNT(*) as c FROM pre_beaming_rounds').get() as any)?.c || 0) + 1;
    const roundId = String(nextNum);
    db.prepare("INSERT INTO pre_beaming_rounds (round_id, machine_no, quality, status) VALUES (?, '1', 'B.Twill Warp', 'OPEN')").run(roundId);
    round = db.prepare('SELECT * FROM pre_beaming_rounds WHERE round_id = ? ORDER BY id DESC LIMIT 1').get(roundId);
  }
  return round;
}

function executePreBeamingRpc(fnName: string, arg: any, today: string) {
  const round = getOrCreatePreBeamingRound();
  const currentRoundNum = Number(round.id || 1);

  if (fnName === 'getCurrentRound') {
    return { ok: true, data: currentRoundNum };
  }
  if (fnName === 'saveLogEntry') {
    const p = arg || {};
    db.prepare(`
      INSERT INTO pre_beaming_logs (entry_date, shift, machine_no, beam_no, quality, meters, operator_name, raw_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      p.date || today,
      p.shift || 'A',
      p.idleMachine || '1',
      p.batch || '-',
      p.ifBatchChange || '-',
      0,
      p.rotationOfStaff || '',
      JSON.stringify(p)
    );
    return { ok: true, data: { saved: true, message: 'Log Book entry saved.' } };
  }
  if (fnName === 'getLogEntries') {
    const rows = db.prepare('SELECT * FROM pre_beaming_logs ORDER BY id DESC LIMIT 50').all() as any[];
    return {
      ok: true,
      data: rows.map((r) => {
        const j = safeJson(r.raw_json);
        return {
          id: r.id,
          Date: r.entry_date || j.date || '',
          Shift: r.shift || j.shift || '',
          'Rotation of Staff': r.operator_name || j.rotationOfStaff || '',
          'Start Time': j.startTime || '',
          'End Time': j.endTime || '',
          'Hours Worked': j.hoursWorked || '',
          'Detention Hours': j.detentionHours || '',
          'Idle Machine When Shift Will Be Changed': j.idleMachine || r.machine_no || '',
          Batch: j.batch || r.beam_no || '',
          'If Batch Change': j.ifBatchChange || '',
          'Instruction Given by Senior': j.instruction || '',
        };
      }),
    };
  }
  if (fnName === 'getBeamStatus') {
    const machineNo = String(arg || '1').trim();
    const lastProd = db
      .prepare('SELECT * FROM pre_beaming_production WHERE machine_no = ? ORDER BY id DESC LIMIT 1')
      .get(machineNo) as any;
    if (!lastProd) {
      return {
        ok: true,
        data: {
          currentRound: currentRoundNum,
          hasRunningBeam: false,
          completed: false,
          beamNo: '',
          target: '',
          startMeter: 0,
          remaining: 0,
        },
      };
    }
    const j = safeJson(lastProd.raw_json);
    const target = Number(j['Beam Target'] ?? j.beamTarget ?? 0);
    const endMeter = Number(j['End Meter'] ?? j.endMeter ?? lastProd.meters ?? 0);
    const beamNo = String(j['Beam No'] ?? lastProd.beam_no ?? '');
    if (!target) {
      return {
        ok: true,
        data: {
          currentRound: currentRoundNum,
          hasRunningBeam: false,
          completed: false,
          beamNo: '',
          target: '',
          startMeter: 0,
          remaining: 0,
        },
      };
    }
    const completed = endMeter >= target;
    return {
      ok: true,
      data: {
        currentRound: currentRoundNum,
        hasRunningBeam: true,
        completed,
        beamNo,
        target,
        startMeter: endMeter,
        remaining: Math.max(0, target - endMeter),
      },
    };
  }
  if (fnName === 'saveProductionEntry') {
    const p = arg || {};
    const machineNo = String(p.machineNo || '1').trim();
    const lastProd = db
      .prepare('SELECT * FROM pre_beaming_production WHERE machine_no = ? ORDER BY id DESC LIMIT 1')
      .get(machineNo) as any;
    const lastJson = lastProd ? safeJson(lastProd.raw_json) : {};
    const prevTarget = Number(lastJson['Beam Target'] ?? lastJson.beamTarget ?? 0);
    const prevEndMeter = Number(lastJson['End Meter'] ?? lastJson.endMeter ?? 0);
    const prevCompleted = prevTarget > 0 && prevEndMeter >= prevTarget;

    const isNewBeam = Boolean(p.startNewBeam || !lastProd || prevCompleted);
    const startMeter = isNewBeam ? 0 : prevEndMeter;
    const endMeter = Number(p.endMeter || 0);
    const target = Number(p.beamTarget || prevTarget || endMeter);
    const production = Math.max(0, Math.round((endMeter - startMeter) * 100) / 100);
    const completed = target > 0 && endMeter >= target;

    const recordObj = {
      'Round ID': currentRoundNum,
      'Fent No': p.fentNo || '',
      'SR No': p.srNo || '',
      Ends: p.ends || '',
      'Beam No': p.beamNo || '',
      'Beam Target': target,
      'Start Meter': startMeter,
      'End Meter': endMeter,
      Production: production,
      'Machine No': machineNo,
      'Operator Name': p.operator || '',
      Date: p.date || today,
      Shift: p.shift || 'A',
      completed,
    };

    db.prepare(`
      INSERT INTO pre_beaming_production (round_id, entry_date, shift, machine_no, beam_no, quality, meters, weight_kg, operator_name, raw_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      String(currentRoundNum),
      p.date || today,
      p.shift || 'A',
      machineNo,
      String(p.beamNo || ''),
      String(p.fentNo || ''),
      production,
      Number(p.ends || 0),
      String(p.operator || ''),
      JSON.stringify(recordObj)
    );

    return {
      ok: true,
      data: {
        saved: true,
        message: 'Production entry saved',
        srNo: p.srNo || '',
        production,
        completed,
        round: currentRoundNum,
      },
    };
  }
  if (fnName === 'stopRound') {
    db.prepare("UPDATE pre_beaming_rounds SET status = 'CLOSED', closed_at = datetime('now') WHERE status = 'OPEN'").run();
    const nextRound = getOrCreatePreBeamingRound();
    return {
      ok: true,
      data: {
        closed: true,
        message: `Round stopped. Started Round #${nextRound.id}`,
        round: Number(nextRound.id),
      },
    };
  }
  if (fnName === 'getCurrentRoundEntries') {
    const rows = db
      .prepare('SELECT * FROM pre_beaming_production WHERE round_id = ? ORDER BY id DESC')
      .all(String(currentRoundNum)) as any[];
    const mapped = rows.map((r) => {
      const j = safeJson(r.raw_json);
      return {
        id: r.id,
        'Round ID': j['Round ID'] ?? r.round_id,
        'SR No': j['SR No'] ?? '',
        'Fent No': j['Fent No'] ?? r.quality,
        Ends: j.Ends ?? r.weight_kg,
        'Beam No': j['Beam No'] ?? r.beam_no,
        'Beam Target': j['Beam Target'] ?? '',
        'Start Meter': j['Start Meter'] ?? 0,
        'End Meter': j['End Meter'] ?? r.meters,
        Production: j.Production ?? r.meters,
        'Machine No': j['Machine No'] ?? r.machine_no,
        'Operator Name': j['Operator Name'] ?? r.operator_name,
        Date: j.Date ?? r.entry_date,
        Shift: j.Shift ?? r.shift,
      };
    });
    return { ok: true, data: { round: currentRoundNum, rows: mapped } };
  }
  if (fnName === 'getVerificationData' || fnName === 'getReportData') {
    const prodRows = db.prepare('SELECT * FROM pre_beaming_production ORDER BY id ASC').all() as any[];
    const logRows = db.prepare('SELECT * FROM pre_beaming_logs ORDER BY id DESC LIMIT 200').all() as any[];
    const productionEntries = prodRows.map((r) => {
      const j = safeJson(r.raw_json);
      return {
        id: r.id,
        'Round ID': j['Round ID'] ?? r.round_id,
        'SR No': j['SR No'] ?? '',
        'Fent No': j['Fent No'] ?? r.quality,
        Ends: j.Ends ?? r.weight_kg,
        'Beam No': j['Beam No'] ?? r.beam_no,
        'Beam Target': j['Beam Target'] ?? '',
        'Start Meter': j['Start Meter'] ?? 0,
        'End Meter': j['End Meter'] ?? r.meters,
        Production: j.Production ?? r.meters,
        'Machine No': j['Machine No'] ?? r.machine_no,
        'Operator Name': j['Operator Name'] ?? r.operator_name,
        Date: j.Date ?? r.entry_date,
        Shift: j.Shift ?? r.shift,
      };
    });
    const logEntries = logRows.map((r) => {
      const j = safeJson(r.raw_json);
      return {
        id: r.id,
        Date: r.entry_date || j.date || '',
        Shift: r.shift || j.shift || '',
        'Rotation of Staff': r.operator_name || j.rotationOfStaff || '',
        'Start Time': j.startTime || '',
        'End Time': j.endTime || '',
        'Hours Worked': j.hoursWorked || '',
        'Detention Hours': j.detentionHours || '',
        'Idle Machine When Shift Will Be Changed': j.idleMachine || r.machine_no || '',
        Batch: j.batch || r.beam_no || '',
        'If Batch Change': j.ifBatchChange || '',
        'Instruction Given by Senior': j.instruction || '',
      };
    });
    return {
      ok: true,
      data: {
        generatedAt: today,
        currentRound: currentRoundNum,
        productionEntries,
        logEntries,
      },
    };
  }
  return { ok: true, data: { currentRound: currentRoundNum, generatedAt: today } };
}

function executePressRpc(fnName: string, payload: any, user: { username: string }) {
  const today = new Date().toISOString().slice(0, 10);
  const p = payload || {};

  if (fnName === 'getOptions') {
    const opts = db.prepare('SELECT * FROM press_options ORDER BY id ASC').all() as any[];
    const baleRows = db.prepare('SELECT DISTINCT press_no, quality FROM press_bales').all() as any[];

    const pressSet = new Set<string>(['1', '2', '3', '4']);
    const typeSet = new Set<string>(['Punjab', 'Haryana', 'UP', 'FCI', 'B.Twill', 'Hessian']);

    for (const o of opts) {
      if (o.option_type === 'press' && o.option_value) pressSet.add(String(o.option_value));
      if ((o.option_type === 'quality' || o.option_type === 'type') && o.option_value) typeSet.add(String(o.option_value));
    }
    for (const b of baleRows) {
      if (b.press_no) pressSet.add(String(b.press_no));
      if (b.quality) typeSet.add(String(b.quality));
    }

    const pressList = Array.from(pressSet);
    const typeList = Array.from(typeSet);
    return {
      ok: true,
      data: {
        press: pressList,
        type: typeList,
        presses: pressList,
        qualities: typeList,
        shifts: ['A', 'B', 'C'],
      },
    };
  }

  if (fnName === 'nextSerial') {
    const dateVal = String(p.date || today);
    const pressVal = String(p.press || '').trim();
    const typeVal = String(p.type || '').trim();
    const rows = db
      .prepare('SELECT * FROM press_bales WHERE entry_date = ? AND press_no = ? AND quality = ? ORDER BY id ASC')
      .all(dateVal, pressVal, typeVal) as any[];
    let maxSl = 0;
    let lastBale = '';
    rows.forEach((r, idx) => {
      const j = safeJson(r.raw_json);
      const sl = Number(j.sl || idx + 1);
      if (sl > maxSl) maxSl = sl;
      if (j.bale || r.bale_serial) lastBale = String(j.bale || r.bale_serial);
    });
    const next = maxSl + 1;
    return {
      ok: true,
      data: {
        next,
        lastBale,
        serial: String(next),
        nextSerial: String(next),
      },
    };
  }

  if (fnName === 'saveBales') {
    const dateVal = String(p.date || today);
    const pressVal = String(p.press || '1').trim();
    const typeVal = String(p.type || 'Punjab').trim();
    const rows = Array.isArray(p.rows) ? p.rows : Array.isArray(p.bales) ? p.bales : [p];

    if (pressVal) {
      const exP = db.prepare("SELECT id FROM press_options WHERE option_type = 'press' AND option_value = ?").get(pressVal);
      if (!exP) db.prepare("INSERT INTO press_options (option_type, option_value) VALUES ('press', ?)").run(pressVal);
    }
    if (typeVal) {
      const exT = db.prepare("SELECT id FROM press_options WHERE option_type = 'type' AND option_value = ?").get(typeVal);
      if (!exT) db.prepare("INSERT INTO press_options (option_type, option_value) VALUES ('type', ?)").run(typeVal);
    }

    const stmt = db.prepare(`
      INSERT OR REPLACE INTO press_bales (bale_serial, entry_date, shift, press_no, quality, buyer_mark, bags_per_bale, gross_wt_kg, tare_wt_kg, net_wt_kg, raw_json, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (let i = 0; i < rows.length; i++) {
      const b = rows[i];
      const sl = Number(b.sl || i + 1);
      const baleNo = String(b.bale || b.serial || b.baleSerial || sl);
      const wt = Number(b.wt || b.net || b.gross || 0);
      const uniqueSerial = `${dateVal}_P${pressVal}_${typeVal}_SL${sl}_B${baleNo}`;
      stmt.run(
        uniqueSerial,
        dateVal,
        p.shift || 'A',
        pressVal,
        typeVal,
        typeVal,
        500,
        wt,
        0,
        wt,
        JSON.stringify({ sl, bale: baleNo, wt, date: dateVal, press: pressVal, type: typeVal }),
        user.username
      );
    }
    return { ok: true, data: { saved: rows.length } };
  }

  if (fnName === 'getBales') {
    const fromDate = String(p.from || '');
    const toDate = String(p.to || '');
    const pressFilter = String(p.press || '').trim();
    const typeFilter = String(p.type || '').trim();

    const rawRows = db.prepare('SELECT * FROM press_bales ORDER BY entry_date ASC, id ASC').all() as any[];
    const filtered = rawRows.filter((r) => {
      if (fromDate && r.entry_date < fromDate) return false;
      if (toDate && r.entry_date > toDate) return false;
      if (pressFilter && String(r.press_no) !== pressFilter) return false;
      if (typeFilter && String(r.quality) !== typeFilter) return false;
      return true;
    });

    const mapped = filtered.map((r, idx) => {
      const j = safeJson(r.raw_json);
      return {
        id: String(r.id),
        date: r.entry_date,
        press: String(r.press_no || j.press || ''),
        type: String(r.quality || j.type || ''),
        sl: Number(j.sl || idx + 1),
        bale: String(j.bale || r.bale_serial || ''),
        wt: Number(j.wt ?? r.net_wt_kg ?? r.gross_wt_kg ?? 0),
      };
    });
    return { ok: true, data: mapped };
  }

  if (fnName === 'getSummary') {
    const fromDate = String(p.from || '');
    const toDate = String(p.to || '');
    const pressFilter = String(p.press || '').trim();
    const typeFilter = String(p.type || '').trim();

    const rawRows = db.prepare('SELECT * FROM press_bales ORDER BY entry_date ASC, id ASC').all() as any[];
    const filtered = rawRows.filter((r) => {
      if (fromDate && r.entry_date < fromDate) return false;
      if (toDate && r.entry_date > toDate) return false;
      if (pressFilter && String(r.press_no) !== pressFilter) return false;
      if (typeFilter && String(r.quality) !== typeFilter) return false;
      return true;
    });

    const groups: Record<string, any> = {};
    for (const r of filtered) {
      const j = safeJson(r.raw_json);
      const date = r.entry_date;
      const press = String(r.press_no || j.press || '');
      const type = String(r.quality || j.type || '');
      const bale = String(j.bale || r.bale_serial || '');
      const wt = Number(j.wt ?? r.net_wt_kg ?? r.gross_wt_kg ?? 0);
      const key = `${date}|${press}|${type}`;
      if (!groups[key]) {
        groups[key] = {
          date,
          press,
          type,
          bales: 0,
          first: bale,
          last: bale,
          min: wt,
          max: wt,
          wt: 0,
        };
      }
      const g = groups[key];
      g.bales += 1;
      g.last = bale;
      if (wt < g.min) g.min = wt;
      if (wt > g.max) g.max = wt;
      g.wt = Math.round((g.wt + wt) * 100) / 100;
    }

    return { ok: true, data: Object.values(groups) };
  }

  if (fnName === 'updateBale') {
    const id = Number(p.id || 0);
    const existing = db.prepare('SELECT * FROM press_bales WHERE id = ?').get(id) as any;
    const prevJson = existing ? safeJson(existing.raw_json) : {};
    const sl = Number(p.sl ?? prevJson.sl ?? 1);
    const bale = String(p.bale ?? prevJson.bale ?? '');
    const wt = Number(p.wt ?? prevJson.wt ?? 0);
    const updatedJson = { ...prevJson, sl, bale, wt };
    db.prepare('UPDATE press_bales SET gross_wt_kg = ?, net_wt_kg = ?, raw_json = ? WHERE id = ?').run(
      wt,
      wt,
      JSON.stringify(updatedJson),
      id
    );
    return { ok: true, data: { updated: true } };
  }

  if (fnName === 'deleteBale') {
    const id = Number(p.id || 0);
    db.prepare('DELETE FROM press_bales WHERE id = ?').run(id);
    return { ok: true, data: { deleted: true } };
  }

  return { ok: true, data: {} };
}

function executeS4BeamingRpc(fnName: string, args: any[], today: string) {
  const p = args[0] || {};

  if (fnName === 'getMachines') {
    return { Indotex: ['8', '9', '10'], Krishna: ['7', '11', '12'] };
  }

  if (fnName === 'getOrderColors') {
    const pos = db.prepare('SELECT DISTINCT order_color FROM s4_beaming_purchase_orders').all() as any[];
    const defaults = ['Blue Stripe', 'Red Double', 'Green Plain', 'Yellow Natural'];
    const merged = Array.from(new Set([...pos.map((x) => String(x.order_color)).filter(Boolean), ...defaults]));
    return merged;
  }

  if (fnName === 'saveLogBook') {
    db.prepare(`
      INSERT INTO s4_beaming_logbook (entry_date, shift, machine_no, order_color, quality, operator_name, opening_meter, closing_meter, raw_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      p.date || today,
      p.shift || 'A',
      p.idleMachine || '-',
      p.batch || '-',
      p.ifBatchChange || '-',
      p.rotation || '',
      Number(p.hoursWorked || 0),
      0,
      JSON.stringify(p)
    );
    return { success: true, message: 'S4 Beaming LogBook saved.' };
  }

  if (fnName === 'getLogBookForShift') {
    const dateVal = typeof args[0] === 'string' ? args[0] : String(p.date || today);
    const shiftVal = typeof args[1] === 'string' ? args[1] : String(p.shift || 'A');
    const row = db
      .prepare('SELECT * FROM s4_beaming_logbook WHERE entry_date = ? AND shift = ? ORDER BY id DESC LIMIT 1')
      .get(dateVal, shiftVal) as any;
    if (!row) return null;
    const j = safeJson(row.raw_json);
    return {
      id: row.id,
      date: row.entry_date,
      shift: row.shift,
      worker: j.rotation || row.operator_name || '',
      hoursWorked: j.hoursWorked ?? row.opening_meter ?? 8,
      ...j,
    };
  }

  if (fnName === 'getLogBooks') {
    const f = p || {};
    const from = String(f.dateFrom || '');
    const to = String(f.dateTo || '');
    const shift = String(f.shift || '');
    const rows = db.prepare('SELECT * FROM s4_beaming_logbook ORDER BY id DESC LIMIT 200').all() as any[];
    return rows
      .filter((r) => {
        if (from && r.entry_date < from) return false;
        if (to && r.entry_date > to) return false;
        if (shift && r.shift !== shift) return false;
        return true;
      })
      .map((r) => {
        const j = safeJson(r.raw_json);
        return {
          id: r.id,
          Date: r.entry_date,
          Shift: r.shift,
          RotationOfStaff: j.rotation || r.operator_name || '',
          HoursWorked: j.hoursWorked ?? rowHours(r.opening_meter),
          IdleMachine: j.idleMachine || r.machine_no || '',
          Batch: j.batch || r.order_color || '',
          IfBatchChange: j.ifBatchChange || r.quality || '',
          Instruction: j.instruction || '',
        };
      });
  }

  if (fnName === 'getLastMeterForMachine') {
    const machine = String(args[0] || '8');
    const last = db
      .prepare('SELECT * FROM s4_beaming_production WHERE machine_no = ? ORDER BY id DESC LIMIT 1')
      .get(machine) as any;
    if (!last) {
      return {
        round: 1,
        newBeam: true,
        beamNumber: '',
        startMeter: 0,
        beamTarget: '',
        color: '',
        ringLength: '',
        status: 'New',
      };
    }
    const j = safeJson(last.raw_json);
    const prevRound = Number(j.Round || last.round_no || 1);
    const prevStatus = String(j.BeamStatus || 'Running');
    if (prevStatus === 'Completed') {
      return {
        round: prevRound + 1,
        newBeam: true,
        beamNumber: '',
        startMeter: 0,
        beamTarget: '',
        color: j.Color || last.order_color || '',
        ringLength: j.RingLength || '',
        status: 'New',
      };
    }
    return {
      round: prevRound,
      newBeam: false,
      beamNumber: j.BeamNumber || last.beam_no || '',
      startMeter: Number(j.EndMeter ?? last.meters ?? 0),
      beamTarget: Number(j.BeamTarget ?? 1000),
      color: j.Color || last.order_color || '',
      ringLength: j.RingLength || '',
      status: prevStatus,
    };
  }

  if (fnName === 'saveProduction') {
    const machine = String(p.machine || p.machineNo || '8');
    const last = db
      .prepare('SELECT * FROM s4_beaming_production WHERE machine_no = ? ORDER BY id DESC LIMIT 1')
      .get(machine) as any;
    const lastJson = last ? safeJson(last.raw_json) : {};
    const prevRound = Number(lastJson.Round || last?.round_no || 1);
    const prevStatus = String(lastJson.BeamStatus || '');

    const start = Number(p.startMeter || 0);
    const entered = Number(p.endMeter || 0);
    const actualEnd = start > 0 ? start + entered : entered;
    const production = start > 0 ? entered : actualEnd;
    const target = Number(p.beamTarget || 0);
    const round = !last ? 1 : start === 0 && prevStatus === 'Completed' ? prevRound + 1 : prevRound;
    const status = p.action === 'stop' ? 'Stopped' : target > 0 && actualEnd >= target ? 'Completed' : 'Running';

    const rec = {
      Date: p.date || today,
      Shift: p.shift || 'A',
      Unit: p.unit || (['8', '9', '10'].includes(machine) ? 'Indotex' : 'Krishna'),
      Machine: machine,
      BeamNumber: p.beamNumber || '',
      Round: round,
      Worker: p.worker || '',
      HoursWorked: Number(p.hoursWorked || 0),
      Color: p.color || '',
      BeamTarget: target,
      StartMeter: start,
      EndMeter: actualEnd,
      Production: production,
      RingLength: p.ringLength || '',
      Weight: p.weight || '',
      BeamStatus: status,
    };

    db.prepare(`
      INSERT INTO s4_beaming_production (entry_date, shift, machine_no, round_no, beam_no, order_color, meters, cuts, operator_name, raw_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      rec.Date,
      rec.Shift,
      machine,
      String(round),
      rec.BeamNumber,
      rec.Color,
      production,
      0,
      rec.Worker,
      JSON.stringify(rec)
    );

    return {
      success: true,
      status,
      beamNumber: rec.BeamNumber,
      round,
      production,
      hoursWorked: rec.HoursWorked,
    };
  }

  if (fnName === 'getProductionLogForMachine') {
    const machine = String(args[0] || '');
    const rows = db
      .prepare('SELECT * FROM s4_beaming_production WHERE machine_no = ? ORDER BY id ASC')
      .all(machine) as any[];
    return rows.map((r) => mapS4BeamingProdRow(r));
  }

  if (fnName === 'getRoundSummaryForMachine') {
    const machine = String(args[0] || '');
    const rows = db
      .prepare('SELECT * FROM s4_beaming_production WHERE machine_no = ? ORDER BY id ASC')
      .all(machine) as any[];
    const verRows = db
      .prepare('SELECT * FROM s4_beaming_verification WHERE machine_no = ? ORDER BY id DESC')
      .all(machine) as any[];

    const groups: Record<string, any[]> = {};
    const order: string[] = [];
    for (const r of rows) {
      const mapped = mapS4BeamingProdRow(r);
      const rnd = String(mapped.Round || '1');
      if (!groups[rnd]) {
        groups[rnd] = [];
        order.push(rnd);
      }
      groups[rnd].push(mapped);
    }

    return order.reverse().map((rnd) => {
      const entries = groups[rnd];
      const last = entries[entries.length - 1];
      const seenHours: Record<string, boolean> = {};
      let totalHours = 0;
      let systemTotal = 0;
      for (const e of entries) {
        systemTotal += Number(e.Production || 0);
        const hk = `${e.Date}|${e.Shift}`;
        if (!seenHours[hk]) {
          seenHours[hk] = true;
          totalHours += Number(e.HoursWorked || 0);
        }
      }
      const ver = verRows.find((v) => String(v.round_no) === String(rnd));
      const verJson = ver ? safeJson(ver.raw_json) : {};
      return {
        round: Number(rnd),
        beamNumber: last.BeamNumber || '',
        beamTarget: last.BeamTarget || '',
        status: last.BeamStatus || 'Running',
        systemTotal,
        totalHours,
        manualProduction: ver ? Number(ver.verified_meters) : null,
        difference: ver ? Number(ver.variance_meters) : null,
        verifiedDate: ver ? ver.entry_date : null,
        remarks: verJson.remarks || '',
      };
    });
  }

  if (fnName === 'saveVerification') {
    const machine = String(p.machine || '');
    const round = String(p.round || '1');
    const prodRows = db
      .prepare('SELECT * FROM s4_beaming_production WHERE machine_no = ? AND round_no = ?')
      .all(machine, round) as any[];
    const systemTotal = prodRows.reduce((a, r) => a + Number(r.meters || 0), 0);
    const manual = Number(p.manualProduction || 0);
    const difference = manual - systemTotal;

    db.prepare('DELETE FROM s4_beaming_verification WHERE machine_no = ? AND round_no = ?').run(machine, round);
    db.prepare(`
      INSERT INTO s4_beaming_verification (entry_date, machine_no, round_no, verified_meters, variance_meters, status, raw_json)
      VALUES (?, ?, ?, ?, ?, 'VERIFIED', ?)
    `).run(p.date || today, machine, round, manual, difference, JSON.stringify({ ...p, systemTotal, difference }));
    return { success: true, difference };
  }

  if (fnName === 'getPurchaseOrderSummary') {
    const pos = db.prepare('SELECT * FROM s4_beaming_purchase_orders ORDER BY id ASC').all() as any[];
    const prod = db.prepare('SELECT * FROM s4_beaming_production').all() as any[];
    const colors = Array.from(new Set([...pos.map((x) => String(x.order_color)), 'Blue Stripe', 'Red Double', 'Green Plain', 'Yellow Natural'])).filter(Boolean);

    return colors.map((color) => {
      const colorOrders = pos.filter((o) => o.order_color === color);
      const totalOrderedBales = colorOrders.reduce((a, o) => {
        const j = safeJson(o.raw_json);
        return a + Number(j.orderQtyBales ?? o.target_meters ?? 0);
      }, 0);
      const totalProdMeters = prod
        .filter((r) => r.order_color === color)
        .reduce((a, r) => a + Number(r.meters || 0), 0);
      const totalProducedBales = Number((totalProdMeters / 1000).toFixed(2));
      return {
        color,
        totalOrderedBales,
        totalProducedBales,
        remainingBales: Math.max(0, Number((totalOrderedBales - totalProducedBales).toFixed(2))),
        openOrders: colorOrders.filter((o) => o.status !== 'Completed').length,
        completedOrders: colorOrders.filter((o) => o.status === 'Completed').length,
      };
    });
  }

  if (fnName === 'savePurchaseOrder') {
    const color = String(p.color || p.orderColor || 'Blue Stripe');
    const qtyBales = Number(p.orderQtyBales || p.targetMeters || 0);
    db.prepare(`
      INSERT INTO s4_beaming_purchase_orders (po_number, order_color, quality, target_meters, produced_meters, status, raw_json)
      VALUES (?, ?, ?, ?, 0, 'Open', ?)
    `).run(
      `PO-${Date.now().toString().slice(-5)}`,
      color,
      'S4 Fabric',
      qtyBales,
      JSON.stringify({ ...p, color, orderQtyBales: qtyBales, date: p.date || today })
    );
    return { success: true };
  }

  if (fnName === 'getCumulativeProductionForColor') {
    const color = String(args[0] || 'Blue Stripe');
    const pos = db
      .prepare('SELECT * FROM s4_beaming_purchase_orders WHERE order_color = ? ORDER BY id ASC')
      .all(color) as any[];
    const prod = db
      .prepare('SELECT * FROM s4_beaming_production WHERE order_color = ? ORDER BY entry_date ASC, id ASC')
      .all(color) as any[];

    const orders = pos.map((o) => {
      const j = safeJson(o.raw_json);
      return {
        id: o.id,
        date: j.date || today,
        orderQtyBales: Number(j.orderQtyBales ?? o.target_meters ?? 0),
        status: o.status === 'Completed' ? 'Completed' : 'Open',
        matchedDate: j.matchedDate || null,
        remarks: j.remarks || '',
      };
    });

    const byDate: Record<string, number> = {};
    for (const r of prod) {
      byDate[r.entry_date] = (byDate[r.entry_date] || 0) + Number(r.meters || 0);
    }
    let cum = 0;
    const targetBales = orders.length ? orders[0].orderQtyBales : null;
    const rows = Object.keys(byDate)
      .sort()
      .map((d) => {
        const daily = byDate[d];
        cum += daily;
        const beam = cum / 1000;
        const cart = beam / 2;
        const bales = Number((cum / 1000).toFixed(2));
        return {
          date: d,
          dailyProduction: daily,
          cumulativeProduction: cum,
          beam,
          cart,
          bales,
          currentOrderTargetBales: targetBales,
          orderMatched: targetBales !== null && bales >= targetBales,
        };
      });

    return { orders, rows };
  }

  if (fnName === 'getProduction') {
    const f = p || {};
    const from = String(f.dateFrom || '');
    const to = String(f.dateTo || '');
    const shift = String(f.shift || '');
    const unit = String(f.unit || '');
    const machine = String(f.machine || '');
    const worker = String(f.worker || '').trim().toLowerCase();
    const beamNumber = String(f.beamNumber || '').trim().toLowerCase();

    const rows = db.prepare('SELECT * FROM s4_beaming_production ORDER BY id DESC LIMIT 300').all() as any[];
    return rows
      .map((r) => mapS4BeamingProdRow(r))
      .filter((r) => {
        if (from && r.Date < from) return false;
        if (to && r.Date > to) return false;
        if (shift && r.Shift !== shift) return false;
        if (unit && r.Unit !== unit) return false;
        if (machine && String(r.Machine) !== machine) return false;
        if (worker && !String(r.Worker || '').toLowerCase().includes(worker)) return false;
        if (beamNumber && !String(r.BeamNumber || '').toLowerCase().includes(beamNumber)) return false;
        return true;
      });
  }

  return { success: true };
}

function rowHours(val: any): number {
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

function mapS4BeamingProdRow(r: any) {
  const j = safeJson(r.raw_json);
  const mach = String(j.Machine || r.machine_no || '8');
  return {
    id: r.id,
    Date: j.Date || r.entry_date || '',
    Shift: j.Shift || r.shift || 'A',
    Unit: j.Unit || (['8', '9', '10'].includes(mach) ? 'Indotex' : 'Krishna'),
    Machine: mach,
    BeamNumber: j.BeamNumber || r.beam_no || '',
    Round: Number(j.Round || r.round_no || 1),
    Worker: j.Worker || r.operator_name || '',
    HoursWorked: Number(j.HoursWorked ?? 8),
    Color: j.Color || r.order_color || '',
    BeamTarget: j.BeamTarget ?? 1000,
    StartMeter: Number(j.StartMeter ?? 0),
    EndMeter: Number(j.EndMeter ?? r.meters ?? 0),
    Production: Number(j.Production ?? r.meters ?? 0),
    RingLength: j.RingLength ?? '',
    Weight: j.Weight ?? '',
    BeamStatus: j.BeamStatus || 'Running',
  };
}

function executeS4LoomRpc(fnName: string, args: any[], today: string) {
  const p = args[0] || {};

  if (fnName === 'getMachineList') {
    return Array.from({ length: 336 }, (_, i) => i + 1);
  }

  if (fnName === 'getLogbookEntry') {
    const dateVal = typeof args[0] === 'string' ? args[0] : String(p.date || today);
    const shiftVal = typeof args[1] === 'string' ? args[1] : String(p.shift || 'A');
    const row = db
      .prepare('SELECT * FROM s4_loom_logbook WHERE entry_date = ? AND shift = ? ORDER BY id DESC LIMIT 1')
      .get(dateVal, shiftVal) as any;
    if (!row) return null;
    const j = safeJson(row.raw_json);
    const comp = Number(j.companyReading || 0);
    const cont = Number(j.contractorReading || 0);
    return {
      id: row.id,
      date: row.entry_date,
      shift: row.shift,
      companyReading: j.companyReading ?? '',
      contractorReading: j.contractorReading ?? '',
      total: j.total ?? comp + cont,
      breakdownReason: j.breakdownReason || '',
      instruction: j.instruction || '',
    };
  }

  if (fnName === 'saveLogbookEntry') {
    const comp = Number(p.companyReading || 0);
    const cont = Number(p.contractorReading || 0);
    const total = comp + cont;
    const stored = { ...p, total };
    db.prepare('DELETE FROM s4_loom_logbook WHERE entry_date = ? AND shift = ?').run(p.date || today, p.shift || 'A');
    db.prepare(`
      INSERT INTO s4_loom_logbook (entry_date, shift, loom_no, quality, weaver_name, beam_no, raw_json)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      p.date || today,
      p.shift || 'A',
      String(total),
      p.breakdownReason || '',
      String(comp),
      String(cont),
      JSON.stringify(stored)
    );
    return { ok: true, success: true, total };
  }

  if (fnName === 'getProductionData') {
    const dateVal = typeof args[0] === 'string' ? args[0] : String(p.date || today);
    const rows = db.prepare('SELECT * FROM s4_loom_production WHERE entry_date = ?').all(dateVal) as any[];
    const dataMap: Record<string, any> = {};
    for (const r of rows) {
      const j = safeJson(r.raw_json);
      const mId = String(j.machineId || r.loom_no || '');
      if (mId) {
        dataMap[mId] = j;
      }
    }
    return dataMap;
  }

  if (fnName === 'saveProductionData') {
    const dateVal = typeof args[0] === 'string' ? args[0] : String(p.date || today);
    const rows = Array.isArray(args[1]) ? args[1] : Array.isArray(p.rows) ? p.rows : [];
    let updated = 0;
    let inserted = 0;

    const findStmt = db.prepare('SELECT id FROM s4_loom_production WHERE entry_date = ? AND loom_no = ?');
    const updStmt = db.prepare(`
      UPDATE s4_loom_production
      SET opening_reading = ?, closing_reading = ?, net_meters = ?, cuts = ?, raw_json = ?
      WHERE id = ?
    `);
    const insStmt = db.prepare(`
      INSERT INTO s4_loom_production (entry_date, shift, loom_no, quality, opening_reading, closing_reading, net_meters, cuts, raw_json)
      VALUES (?, 'ALL', ?, 'S4', ?, ?, ?, ?, ?)
    `);

    for (const r of rows) {
      const mId = String(r.machineId || r.loomNo || '1');
      const netMtr =
        (Number(r.A_AMtr) || 0) + (Number(r.B_AMtr) || 0) + (Number(r.C_AMtr) || 0);
      const totalCuts =
        (Number(r.A_Cuts) || 0) + (Number(r.B_Cuts) || 0) + (Number(r.C_Cuts) || 0);
      const openRead = Number(r.A_Reading || 0);
      const closeRead = Number(r.C_Reading || r.B_Reading || r.A_Reading || 0);
      const existing = findStmt.get(dateVal, mId) as any;
      if (existing) {
        updStmt.run(openRead, closeRead, netMtr, totalCuts, JSON.stringify({ ...r, date: dateVal, machineId: Number(mId) }), existing.id);
        updated++;
      } else {
        insStmt.run(dateVal, mId, openRead, closeRead, netMtr, totalCuts, JSON.stringify({ ...r, date: dateVal, machineId: Number(mId) }));
        inserted++;
      }
    }
    return { ok: true, success: true, updated, inserted };
  }

  if (fnName === 'getVerificationRows') {
    const row = db
      .prepare("SELECT * FROM s4_loom_verification WHERE entry_date = 'CONFIG' AND shift = 'ROWS' ORDER BY id DESC LIMIT 1")
      .get() as any;
    if (!row) return [];
    const j = safeJson(row.raw_json);
    return Array.isArray(j.rows) ? j.rows : [];
  }

  if (fnName === 'saveVerificationRows') {
    const rows = Array.isArray(args[0]) ? args[0] : Array.isArray(p.rows) ? p.rows : [];
    db.prepare("DELETE FROM s4_loom_verification WHERE entry_date = 'CONFIG' AND shift = 'ROWS'").run();
    db.prepare(`
      INSERT INTO s4_loom_verification (entry_date, shift, loom_no, book_meters, actual_meters, diff_meters, raw_json)
      VALUES ('CONFIG', 'ROWS', 'CONFIG', 0, 0, 0, ?)
    `).run(JSON.stringify({ rows }));
    return { ok: true, saved: rows.length };
  }

  if (fnName === 'getVerificationSummary') {
    const dateVal = typeof args[0] === 'string' ? args[0] : String(p.date || today);
    const cfgRow = db
      .prepare("SELECT * FROM s4_loom_verification WHERE entry_date = 'CONFIG' AND shift = 'ROWS' ORDER BY id DESC LIMIT 1")
      .get() as any;
    const cfgRows = cfgRow ? (safeJson(cfgRow.raw_json).rows || []) : [];

    const verRows = db
      .prepare("SELECT * FROM s4_loom_verification WHERE entry_date = ? AND shift IN ('A', 'B', 'C')")
      .all(dateVal) as any[];
    const shifts: Record<string, Record<string, any>> = { A: {}, B: {}, C: {} };
    for (const r of verRows) {
      const j = safeJson(r.raw_json);
      const entries = Array.isArray(j.entries) ? j.entries : [j];
      for (const e of entries) {
        if (e && e.name) {
          shifts[r.shift] = shifts[r.shift] || {};
          shifts[r.shift][e.name] = e;
        }
      }
    }
    return { date: dateVal, rows: cfgRows, shifts };
  }

  if (fnName === 'saveVerificationEntries') {
    const dateVal = String(args[0] || today);
    const shiftVal = String(args[1] || 'A');
    const entries = Array.isArray(args[2]) ? args[2] : [];
    db.prepare('DELETE FROM s4_loom_verification WHERE entry_date = ? AND shift = ?').run(dateVal, shiftVal);
    db.prepare(`
      INSERT INTO s4_loom_verification (entry_date, shift, loom_no, book_meters, actual_meters, diff_meters, raw_json)
      VALUES (?, ?, 'SHIFT', 0, 0, 0, ?)
    `).run(dateVal, shiftVal, JSON.stringify({ date: dateVal, shift: shiftVal, entries }));
    return { ok: true, success: true };
  }

  if (fnName === 'getReportData') {
    const fromDate = typeof args[0] === 'string' ? args[0] : String(p.from || '');
    const toDate = typeof args[1] === 'string' ? args[1] : String(p.to || '');
    const machineFilter = String(args[2] ?? p.machine ?? '').trim();
    const filterIds = machineFilter
      ? machineFilter.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    const rows = db
      .prepare('SELECT * FROM s4_loom_production ORDER BY entry_date ASC, CAST(loom_no AS INTEGER) ASC')
      .all() as any[];

    return rows
      .filter((r) => {
        if (fromDate && r.entry_date < fromDate) return false;
        if (toDate && r.entry_date > toDate) return false;
        if (filterIds.length > 0 && !filterIds.includes(String(r.loom_no))) return false;
        return true;
      })
      .map((r) => {
        const j = safeJson(r.raw_json);
        return {
          date: r.entry_date,
          machineId: Number(j.machineId || r.loom_no || 1),
          A_Reading: j.A_Reading ?? '',
          A_AMtr: j.A_AMtr ?? '',
          A_TMtrEfy: j.A_TMtrEfy ?? '',
          A_Cuts: j.A_Cuts ?? '',
          B_Reading: j.B_Reading ?? '',
          B_AMtr: j.B_AMtr ?? '',
          B_TMtrEfy: j.B_TMtrEfy ?? '',
          B_Cuts: j.B_Cuts ?? '',
          C_Reading: j.C_Reading ?? '',
          C_AMtr: j.C_AMtr ?? '',
          C_TMtrEfy: j.C_TMtrEfy ?? '',
          C_Cuts: j.C_Cuts ?? '',
        };
      });
  }

  return { ok: true, success: true };
}

function parseBreakTimeToMins(val: any): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return val;
  const s = String(val).trim();
  if (s.includes(':')) {
    const parts = s.split(':');
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    return h * 60 + m;
  }
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

function executeSpinningRpc(fnName: string, args: any[], user: { fullName: string }, today: string) {
  const p = args[0] || {};
  if (fnName === 'checkLogin') {
    return true;
  }

  const parseFilters = () => {
    if (typeof args[0] === 'string') {
      return {
        startDate: String(args[0] || ''),
        endDate: String(args[0] || ''),
        shift: String(args[1] || 'ALL'),
      };
    }
    return {
      startDate: String(p.startDate || p.date || ''),
      endDate: String(p.endDate || p.date || ''),
      shift: String(p.shift || 'ALL'),
    };
  };

  if (fnName === 'getLogBookEntries' || fnName === 'getLogBookReport') {
    const f = parseFilters();
    const rawRows = db.prepare('SELECT * FROM spinning_logbook ORDER BY id DESC LIMIT 200').all() as any[];
    const filtered = rawRows.filter((r) => {
      if (f.startDate && r.entry_date < f.startDate) return false;
      if (f.endDate && r.entry_date > f.endDate) return false;
      if (f.shift && f.shift.toUpperCase() !== 'ALL' && String(r.shift).toUpperCase() !== f.shift.toUpperCase()) {
        return false;
      }
      return true;
    });
    return {
      headers: ['Date', 'Shift', 'Rotation of Staff', 'Idle Machine', 'Shift Change', 'Instructions', 'Saved At'],
      rows: filtered.map((r) => {
        const j = safeJson(r.raw_json);
        return [
          r.entry_date || j.date || '-',
          r.shift || j.shift || '-',
          j.rotation || r.operator_name || '-',
          j.idleMachine || r.frame_no || '-',
          j.shiftChange || r.quality_count || '-',
          j.instructions || '-',
          r.created_at || '-',
        ];
      }),
    };
  }

  if (fnName === 'getBreakdownEntries' || fnName === 'getBreakdownReport') {
    const f = parseFilters();
    const rawRows = db.prepare('SELECT * FROM spinning_breakdown ORDER BY id DESC LIMIT 200').all() as any[];
    const filtered = rawRows.filter((r) => {
      if (f.startDate && r.entry_date < f.startDate) return false;
      if (f.endDate && r.entry_date > f.endDate) return false;
      if (f.shift && f.shift.toUpperCase() !== 'ALL' && String(r.shift).toUpperCase() !== f.shift.toUpperCase()) {
        return false;
      }
      return true;
    });
    return {
      headers: ['Date', 'Shift', 'Machine No', 'Reason', 'Start Time', 'End Time', 'Break Time', 'Saved At'],
      rows: filtered.map((r) => {
        const j = safeJson(r.raw_json);
        return [
          r.entry_date || j.date || '-',
          r.shift || j.shift || '-',
          r.frame_no || j.machineNo || '-',
          r.reason || j.reason || '-',
          j.startTime || '-',
          j.endTime || '-',
          j.breakTime || (r.down_mins ? `${r.down_mins} mins` : '-'),
          r.created_at || '-',
        ];
      }),
    };
  }

  if (fnName === 'getProductionEntries' || fnName === 'getProductionReport') {
    const f = parseFilters();
    const rawRows = db.prepare('SELECT * FROM spinning_production ORDER BY id DESC LIMIT 200').all() as any[];
    const filtered = rawRows.filter((r) => {
      if (f.startDate && r.entry_date < f.startDate) return false;
      if (f.endDate && r.entry_date > f.endDate) return false;
      if (f.shift && f.shift.toUpperCase() !== 'ALL' && String(r.shift).toUpperCase() !== f.shift.toUpperCase()) {
        return false;
      }
      return true;
    });
    return {
      headers: ['Date', 'Shift', 'Quality', 'Frame', 'Production', 'Production / Frame', 'Saved At'],
      rows: filtered.map((r) => {
        const j = safeJson(r.raw_json);
        return [
          r.entry_date || j.date || '-',
          r.shift || j.shift || '-',
          r.quality_count || j.quality || '-',
          j.frame ?? r.frame_no ?? '-',
          r.production_kg ?? j.production ?? 0,
          j.productionPerFrame ?? r.doffs ?? 0,
          r.created_at || '-',
        ];
      }),
    };
  }

  if (fnName === 'saveLogBook') {
    db.prepare(`
      INSERT INTO spinning_logbook (entry_date, shift, frame_no, quality_count, rpm, tpi, operator_name, raw_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      p.date || today,
      p.shift || 'A',
      p.idleMachine || p.frameNo || '-',
      p.shiftChange || p.count || '-',
      Number(p.rpm || 0),
      Number(p.tpi || 0),
      p.rotation || p.operator || user.fullName || '',
      JSON.stringify(p)
    );
    return { status: 'success', success: true, message: 'Spinning Log Book saved successfully.' };
  }

  if (fnName === 'saveMachineBreakdown') {
    const rows = Array.isArray(p.rows) ? p.rows : [p];
    const stmt = db.prepare(`
      INSERT INTO spinning_breakdown (entry_date, shift, frame_no, reason, down_mins, raw_json)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    for (const r of rows) {
      const mins = parseBreakTimeToMins(r.breakTime ?? r.downMins ?? r.duration);
      stmt.run(
        p.date || r.date || today,
        p.shift || r.shift || 'A',
        String(r.machineNo || r.frameNo || 'RF-01'),
        String(r.reason || ''),
        mins,
        JSON.stringify({ ...r, date: p.date || today, shift: p.shift || 'A' })
      );
    }
    return { status: 'success', success: true, message: `Saved ${rows.length} Machine Breakdown record(s).` };
  }

  if (fnName === 'saveProduction') {
    const rows = Array.isArray(p.rows) ? p.rows : [p];
    const stmt = db.prepare(`
      INSERT INTO spinning_production (entry_date, shift, frame_no, quality_count, doffs, production_kg, efficiency, raw_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const r of rows) {
      stmt.run(
        p.date || r.date || today,
        p.shift || r.shift || 'A',
        String(r.frame || r.frameNo || '1'),
        String(r.quality || r.count || ''),
        Number(r.productionPerFrame || r.doffs || 0),
        Number(r.production || r.productionKg || 0),
        Number(r.efficiency || 0),
        JSON.stringify({ ...r, date: p.date || today, shift: p.shift || 'A' })
      );
    }
    return { status: 'success', success: true, message: `Saved ${rows.length} Spinning Production record(s).` };
  }

  return { status: 'success', success: true };
}

function executeSpreaderRpc(fnName: string, args: any[], user: { username: string; fullName: string }, today: string) {
  const p = args[0] || {};
  if (fnName === 'authenticateUser') {
    return {
      success: true,
      authenticated: true,
      username: user.fullName || user.username,
      name: user.fullName,
      role: 'Authorized',
    };
  }
  if (fnName === 'saveLogBook') {
    db.prepare(`
      INSERT INTO spreader_logbook (entry_date, shift, machine_no, grade_mix, emulsion_pct, operator_name, raw_json)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      p.date || today,
      p.shift || 'A',
      String(p.idleMachine || p.machineNo || '-'),
      String(p.batch || p.gradeMix || ''),
      Number(p.emulsionPct || 0),
      String(p.rotationOfStaff || p.operator || p.savedBy || user.fullName || ''),
      JSON.stringify({ ...p, savedBy: p.savedBy || user.fullName })
    );
    return { success: true, message: 'Log Book entry saved' };
  }
  if (fnName === 'getLogBookEntries') {
    const rows = db.prepare('SELECT * FROM spreader_logbook ORDER BY id DESC LIMIT 100').all() as any[];
    return rows.map((r) => {
      const j = safeJson(r.raw_json);
      return {
        id: r.id,
        date: r.entry_date,
        shift: r.shift,
        machineNo: r.machine_no,
        gradeMix: r.grade_mix,
        emulsionPct: r.emulsion_pct,
        operator: r.operator_name,
        Date: r.entry_date,
        Shift: r.shift,
        RotationOfStaff: j.rotationOfStaff || r.operator_name || '',
        IdleMachine: j.idleMachine || r.machine_no || '',
        Batch: j.batch || r.grade_mix || '',
        BatchChange: j.batchChange || '',
        Instruction: j.instruction || '',
        SavedBy: j.savedBy || r.operator_name || user.fullName,
        ...j,
      };
    });
  }
  if (fnName === 'saveMachineBreakdown') {
    const rawRows = Array.isArray(p.rows) ? p.rows : [p];
    const activeRows = rawRows.filter(
      (r: any) =>
        (r.reason && String(r.reason).trim() !== '') ||
        (r.startTime && String(r.startTime).trim() !== '') ||
        (r.endTime && String(r.endTime).trim() !== '') ||
        (r.breakTimeMin !== undefined && r.breakTimeMin !== '')
    );
    const rowsToInsert = activeRows.length > 0 ? activeRows : rawRows.slice(0, 1);
    const stmt = db.prepare(`
      INSERT INTO spreader_breakdown (entry_date, shift, machine_no, reason, duration_mins, raw_json)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    for (const r of rowsToInsert) {
      stmt.run(
        p.date || r.date || today,
        p.shift || r.shift || 'A',
        String(r.machineNo || '1'),
        String(r.reason || ''),
        Number(r.breakTimeMin || r.duration || 0),
        JSON.stringify({ ...r, date: p.date || today, shift: p.shift || 'A', savedBy: p.savedBy || user.fullName })
      );
    }
    return { success: true, message: 'Machine Breakdown saved' };
  }
  if (fnName === 'saveMeterReading') {
    const dateVal = String(p.date || today);
    const shiftVal = String(p.shift || 'A');
    const targetVal = parseFloat(p.target) || 8;
    const rawRows = Array.isArray(p.rows) ? p.rows : [p];
    const activeRows = rawRows.filter(
      (r: any) =>
        (r.startReading !== undefined && r.startReading !== '') ||
        (r.endReading !== undefined && r.endReading !== '') ||
        (r.openingReading !== undefined && r.openingReading !== '') ||
        (r.closingReading !== undefined && r.closingReading !== '')
    );
    if (activeRows.length === 0) {
      return { success: false, message: 'Please enter meter readings for at least one machine.' };
    }
    const delStmt = db.prepare(
      'DELETE FROM spreader_meter_reading WHERE entry_date = ? AND shift = ? AND machine_no = ?'
    );
    const insStmt = db.prepare(`
      INSERT INTO spreader_meter_reading (entry_date, shift, machine_no, opening_reading, closing_reading, net_reading, raw_json)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    for (const r of activeRows) {
      const mNo = String(r.machineNo || '1');
      const openR = parseFloat(r.startReading ?? r.openingReading ?? 0) || 0;
      const closeR = parseFloat(r.endReading ?? r.closingReading ?? 0) || 0;
      const diff = Number((closeR - openR).toFixed(2));
      const efficiency = targetVal > 0 ? Number((diff / targetVal).toFixed(2)) : 0;
      delStmt.run(dateVal, shiftVal, mNo);
      insStmt.run(
        dateVal,
        shiftVal,
        mNo,
        openR,
        closeR,
        diff,
        JSON.stringify({
          machineNo: mNo,
          startReading: openR,
          endReading: closeR,
          diff,
          target: targetVal,
          efficiency,
          savedBy: p.savedBy || user.fullName,
        })
      );
    }
    return { success: true, message: 'Meter Reading saved' };
  }
  if (fnName === 'getMeterReadingForDateShift') {
    const dateVal = typeof args[0] === 'string' ? args[0] : String(p.date || today);
    const shiftVal = typeof args[1] === 'string' ? args[1] : String(p.shift || 'A');
    const rows = db
      .prepare('SELECT * FROM spreader_meter_reading WHERE entry_date = ? AND shift = ? ORDER BY id ASC')
      .all(dateVal, shiftVal) as any[];
    return rows.map((r) => {
      const j = safeJson(r.raw_json);
      const targetVal = parseFloat(j.target) || 8;
      const eff =
        j.efficiency !== undefined
          ? Number(j.efficiency)
          : targetVal > 0
          ? Number((Number(r.net_reading || 0) / targetVal).toFixed(2))
          : 0;
      return {
        id: r.id,
        date: r.entry_date,
        shift: r.shift,
        machineNo: String(r.machine_no),
        startReading: r.opening_reading,
        endReading: r.closing_reading,
        diff: r.net_reading,
        efficiency: eff,
        ...j,
      };
    });
  }
  if (fnName === 'saveRollProduction') {
    const dateVal = String(p.date || today);
    const shiftVal = String(p.shift || 'A');
    const machineRows = Array.isArray(p.machineRows) ? p.machineRows : [];
    const qualityRows = Array.isArray(p.qualityRows) ? p.qualityRows : [];
    const stmt = db.prepare(`
      INSERT INTO spreader_roll_production (entry_date, shift, machine_no, quality, rolls_count, weight_mt, raw_json)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    let inserted = 0;
    for (const mr of machineRows) {
      if (mr.netRoll !== '' && mr.netRoll !== null && mr.netRoll !== undefined && !isNaN(Number(mr.netRoll))) {
        stmt.run(
          dateVal,
          shiftVal,
          String(mr.machineNo || '1'),
          'Machine Roll',
          Number(mr.netRoll),
          Number(mr.netRoll),
          JSON.stringify({
            type: 'Machine',
            machineNo: mr.machineNo,
            netRoll: Number(mr.netRoll),
            allocatedMachine: p.allocatedMachine,
            efficiency: p.efficiency,
            savedBy: p.savedBy || user.fullName,
          })
        );
        inserted++;
      }
    }
    for (const qr of qualityRows) {
      if (qr.netRoll !== '' && qr.netRoll !== null && qr.netRoll !== undefined && !isNaN(Number(qr.netRoll))) {
        stmt.run(
          dateVal,
          shiftVal,
          'Quality',
          String(qr.quality || 'Standard'),
          Number(qr.netRoll),
          Number(qr.netRoll),
          JSON.stringify({
            type: 'Quality',
            quality: qr.quality,
            netRoll: Number(qr.netRoll),
            totalQualityRoll: p.totalNetRoll,
            savedBy: p.savedBy || user.fullName,
          })
        );
        inserted++;
      }
    }
    if (inserted === 0) {
      stmt.run(
        dateVal,
        shiftVal,
        String(p.machineNo || '1'),
        String(p.quality || 'Roll Production'),
        Number(p.totalNetRoll || p.rolls || 0),
        Number(p.totalNetRoll || p.weightMt || 0),
        JSON.stringify(p)
      );
    }
    return { success: true, message: 'Roll Production saved' };
  }
  if (fnName === 'getReportData') {
    const modType = String(p.module || 'RollProductionMachine');
    const rolls = db.prepare('SELECT * FROM spreader_roll_production ORDER BY id DESC LIMIT 100').all() as any[];
    const logs = db.prepare('SELECT * FROM spreader_logbook ORDER BY id DESC LIMIT 100').all() as any[];
    const breakdowns = db.prepare('SELECT * FROM spreader_breakdown ORDER BY id DESC LIMIT 100').all() as any[];
    const meters = db.prepare('SELECT * FROM spreader_meter_reading ORDER BY id DESC LIMIT 100').all() as any[];
    let rowsOut: any[] = [];
    if (modType === 'LogBook') {
      rowsOut = logs.map((r) => {
        const j = safeJson(r.raw_json);
        return {
          Date: r.entry_date,
          Shift: r.shift,
          RotationOfStaff: j.rotationOfStaff || r.operator_name,
          IdleMachine: j.idleMachine || r.machine_no,
          Batch: j.batch || r.grade_mix,
          BatchChange: j.batchChange || '',
          Instruction: j.instruction || '',
        };
      });
    } else if (modType === 'MachineBreakdown') {
      rowsOut = breakdowns.map((r) => {
        const j = safeJson(r.raw_json);
        return {
          Date: r.entry_date,
          Shift: r.shift,
          MachineNo: r.machine_no,
          Reason: r.reason,
          StartTime: j.startTime || '',
          EndTime: j.endTime || '',
          BreakTimeMins: r.duration_mins,
        };
      });
    } else if (modType === 'MeterReading') {
      rowsOut = meters.map((r) => {
        const j = safeJson(r.raw_json);
        return {
          Date: r.entry_date,
          Shift: r.shift,
          MachineNo: r.machine_no,
          StartReading: r.opening_reading,
          EndReading: r.closing_reading,
          Difference: r.net_reading,
          Efficiency: j.efficiency ?? '',
        };
      });
    } else {
      rowsOut = rolls.map((r) => ({
        Date: r.entry_date,
        Shift: r.shift,
        MachineOrType: r.machine_no,
        Quality: r.quality,
        NetRolls: r.rolls_count,
      }));
    }
    return {
      success: true,
      rows: rowsOut,
    };
  }
  return { success: true };
}

function calcVlHoursWorked(start: string, end: string): string {
  if (!start || !end || !start.includes(':') || !end.includes(':')) return '';
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let diff = eh * 60 + em - (sh * 60 + sm);
  if (diff < 0) diff += 24 * 60;
  return (diff / 60).toFixed(2);
}

function executeVlBeamingRpc(fnName: string, args: any[], today: string) {
  const p = args[0] || {};

  if (fnName === 'getOperatorList') {
    const lbOps = db.prepare('SELECT DISTINCT operator_name FROM vl_beaming_logbook').all() as any[];
    const prOps = db.prepare('SELECT DISTINCT operator_name FROM vl_beaming_production').all() as any[];
    const set = new Set<string>();
    for (const r of lbOps) if (r.operator_name) set.add(String(r.operator_name));
    for (const r of prOps) if (r.operator_name) set.add(String(r.operator_name));
    return Array.from(set);
  }

  if (fnName === 'saveLogBookEntry') {
    const hoursWorked = calcVlHoursWorked(p.startTime || '', p.endTime || '') || p.hoursWorked || '';
    const stored = { ...p, hoursWorked };
    db.prepare(`
      INSERT INTO vl_beaming_logbook (entry_date, shift, machine_no, beam_no, quality, operator_name, meters, raw_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      p.date || today,
      p.shift || 'A',
      p.idleMachine || '-',
      p.batch || '-',
      p.batchChange || '-',
      p.operatorName || p.operator || '',
      Number(hoursWorked || 0),
      JSON.stringify(stored)
    );
    return { ok: true, success: true, hoursWorked };
  }

  if (fnName === 'getLogBookData') {
    const rows = db.prepare('SELECT * FROM vl_beaming_logbook ORDER BY id DESC LIMIT 100').all() as any[];
    return rows.map((r) => {
      const j = safeJson(r.raw_json);
      return {
        id: r.id,
        Date: r.entry_date || j.date || '',
        Shift: r.shift || j.shift || '',
        'Operator Name': r.operator_name || j.operatorName || '',
        Batch: j.batch || r.beam_no || '',
        'Start Time': j.startTime || '',
        'End Time': j.endTime || '',
        'Hours Worked': j.hoursWorked || (r.meters ? String(r.meters) : ''),
        'Detention Hours': j.detentionHours || '',
        'Idle Machine': j.idleMachine || r.machine_no || '',
        'Batch Change': j.batchChange || '',
        Instructions: j.instructions || '',
      };
    });
  }

  if (fnName === 'getLastLogBookInfo') {
    const last = db.prepare('SELECT * FROM vl_beaming_logbook ORDER BY id DESC LIMIT 1').get() as any;
    if (!last) return { date: today, shift: 'A', operatorName: '' };
    const j = safeJson(last.raw_json);
    return {
      date: last.entry_date || j.date || today,
      shift: last.shift || j.shift || 'A',
      operatorName: last.operator_name || j.operatorName || '',
    };
  }

  if (fnName === 'getRoundState') {
    const last = db.prepare('SELECT * FROM vl_beaming_production ORDER BY id DESC LIMIT 1').get() as any;
    if (!last) {
      return { initialized: false, target: '' };
    }
    const j = safeJson(last.raw_json);
    if (j.roundCompleted) {
      return { initialized: false, target: j.target || '' };
    }
    return {
      initialized: true,
      roundNo: j.preBeamingRoundNo || last.round_no || '1',
      beamNo: j.beamNo || last.beam_no || '',
      beamType: j.beamType || last.quality || '',
      noOfCart: j.noOfCart || '',
      target: Number(j.target || 0),
      startMeter: Number(j.endMeter ?? last.meters ?? 0),
    };
  }

  if (fnName === 'saveProductionEntry') {
    const last = db.prepare('SELECT * FROM vl_beaming_production ORDER BY id DESC LIMIT 1').get() as any;
    const lastJson = last ? safeJson(last.raw_json) : {};
    const isNew = Boolean(p.startNew || !last || lastJson.roundCompleted);
    const startMeter = isNew ? 0 : Number(lastJson.endMeter ?? 0);
    const endMeter = Number(p.endMeter || 0);
    const target = Number(p.target || lastJson.target || endMeter);
    const production = Math.max(0, Math.round((endMeter - startMeter) * 100) / 100);
    const cumulative = endMeter;
    const roundCompleted = Boolean(p.completeRound || (target > 0 && cumulative >= target));

    const stored = {
      ...p,
      startMeter,
      endMeter,
      target,
      production,
      cumulative,
      roundCompleted,
      Date: p.date || today,
      Shift: p.shift || 'A',
      'Operator Name': p.operatorName || '',
      'Beam No': p.beamNo || '',
      'Beam Type': p.beamType || '',
      'No of Cart': p.noOfCart || '',
      'Length Target': target,
      'Start Meter': startMeter,
      'End Meter': endMeter,
      'Production (Mtrs)': production,
      'Cumulative (Mtrs)': cumulative,
    };

    db.prepare(`
      INSERT INTO vl_beaming_production (round_no, entry_date, shift, machine_no, beam_no, quality, cuts, meters, operator_name, raw_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      String(p.preBeamingRoundNo || '1'),
      p.date || today,
      p.shift || 'A',
      String(p.slNo || '1'),
      String(p.beamNo || ''),
      String(p.beamType || ''),
      Number(p.noOfCart || 0),
      production,
      String(p.operatorName || ''),
      JSON.stringify(stored)
    );

    return {
      ok: true,
      success: true,
      roundCompleted,
      beamNo: p.beamNo || '',
      cumulative,
      target,
      production,
    };
  }

  if (fnName === 'getOpenRoundEntries') {
    const rows = db.prepare('SELECT * FROM vl_beaming_production ORDER BY id DESC LIMIT 50').all() as any[];
    return rows.map((r) => mapVlBeamingProdRow(r));
  }

  if (fnName === 'getVerificationData') {
    const prodRows = db.prepare('SELECT * FROM vl_beaming_production ORDER BY id ASC').all() as any[];
    const logRows = db.prepare('SELECT * FROM vl_beaming_logbook ORDER BY id DESC').all() as any[];

    const logByDateShift: Record<string, any> = {};
    for (const l of logRows) {
      const j = safeJson(l.raw_json);
      const k = `${l.entry_date}|${l.shift}`;
      if (!logByDateShift[k]) logByDateShift[k] = j;
    }

    const mappedProd = prodRows.map((r) => mapVlBeamingProdRow(r));
    const roundGroups: Record<string, any> = {};
    for (const r of mappedProd) {
      const key = `${r.roundNo}|${r.beamNo}`;
      if (!roundGroups[key]) {
        roundGroups[key] = {
          roundNo: r.roundNo,
          beamNo: r.beamNo,
          beamType: r.beamType,
          cumulative: 0,
          target: r.target,
          noOfCart: r.noOfCart,
          totalBeamLength: 0,
          entries: 0,
          status: 'Open',
        };
      }
      const g = roundGroups[key];
      g.entries += 1;
      g.cumulative = r.cumulative;
      g.totalBeamLength = Math.round((g.totalBeamLength + r.production) * 100) / 100;
      if (r.roundCompleted) g.status = 'Completed';
    }

    const shiftGroups: Record<string, { date: string; shift: string; dayProduction: number }> = {};
    for (const r of mappedProd) {
      const k = `${r.Date}|${r.Shift}`;
      if (!shiftGroups[k]) shiftGroups[k] = { date: r.Date, shift: r.Shift, dayProduction: 0 };
      shiftGroups[k].dayProduction = Math.round((shiftGroups[k].dayProduction + r.production) * 100) / 100;
    }
    let runningCum = 0;
    const shiftCumulative = Object.values(shiftGroups).map((s) => {
      runningCum = Math.round((runningCum + s.dayProduction) * 100) / 100;
      return {
        date: s.date,
        shift: s.shift,
        dayProduction: s.dayProduction,
        cumulativeProduction: runningCum,
      };
    });

    const entries = mappedProd.slice().reverse().map((r) => {
      const lg = logByDateShift[`${r.Date}|${r.Shift}`] || {};
      return {
        beamingSrNo: r.slNo,
        beamNo: r.beamNo,
        beamType: r.beamType,
        noOfCart: r.noOfCart,
        cumulative: r.cumulative,
        lengthTarget: r.target,
        shift: r.Shift,
        production: r.production,
        hoursWorked: lg.hoursWorked || '-',
        detentionHours: lg.detentionHours || '-',
        idleMachine: lg.idleMachine || '-',
        operatorName: r['Operator Name'],
        roundStatus: r.roundCompleted ? 'Completed' : 'Open',
      };
    });

    return {
      roundSummary: Object.values(roundGroups).reverse(),
      shiftCumulative: shiftCumulative.reverse(),
      entries,
    };
  }

  if (fnName === 'getReportSummary') {
    const f = p || {};
    const fromDate = String(f.fromDate || '');
    const toDate = String(f.toDate || '');
    const shift = String(f.shift || '');
    const opName = String(f.operatorName || '');

    const prodRows = db.prepare('SELECT * FROM vl_beaming_production ORDER BY id DESC LIMIT 300').all() as any[];
    const logRows = db.prepare('SELECT * FROM vl_beaming_logbook ORDER BY id DESC LIMIT 300').all() as any[];

    const production = prodRows
      .map((r) => mapVlBeamingProdRow(r))
      .filter((r) => {
        if (fromDate && r.Date < fromDate) return false;
        if (toDate && r.Date > toDate) return false;
        if (shift && r.Shift !== shift) return false;
        if (opName && r['Operator Name'] !== opName) return false;
        return true;
      });

    const logbook = logRows
      .map((r) => {
        const j = safeJson(r.raw_json);
        return {
          id: r.id,
          Date: r.entry_date || j.date || '',
          Shift: r.shift || j.shift || '',
          'Operator Name': r.operator_name || j.operatorName || '',
          Batch: j.batch || r.beam_no || '',
          'Start Time': j.startTime || '',
          'End Time': j.endTime || '',
          'Hours Worked': j.hoursWorked || (r.meters ? String(r.meters) : ''),
          'Detention Hours': j.detentionHours || '',
        };
      })
      .filter((r) => {
        if (fromDate && r.Date < fromDate) return false;
        if (toDate && r.Date > toDate) return false;
        if (shift && r.Shift !== shift) return false;
        if (opName && r['Operator Name'] !== opName) return false;
        return true;
      });

    const totalProduction = Math.round(production.reduce((a, r) => a + Number(r['Production (Mtrs)'] || 0), 0) * 100) / 100;
    const totalHours = Math.round(logbook.reduce((a, r) => a + Number(r['Hours Worked'] || 0), 0) * 100) / 100;
    const totalDetention = Math.round(logbook.reduce((a, r) => a + Number(r['Detention Hours'] || 0), 0) * 100) / 100;

    return {
      totals: {
        totalProduction,
        totalHours,
        totalDetention,
        entries: production.length,
      },
      production,
      logbook,
    };
  }

  return { ok: true, success: true };
}

function mapVlBeamingProdRow(r: any) {
  const j = safeJson(r.raw_json);
  const prod = Number(j.production ?? j['Production (Mtrs)'] ?? r.meters ?? 0);
  const cum = Number(j.cumulative ?? j['Cumulative (Mtrs)'] ?? prod);
  const target = Number(j.target ?? j['Length Target'] ?? 0);
  const startMeter = Number(j.startMeter ?? j['Start Meter'] ?? 0);
  const endMeter = Number(j.endMeter ?? j['End Meter'] ?? cum);
  return {
    id: r.id,
    roundNo: j.preBeamingRoundNo || r.round_no || '1',
    slNo: j.slNo || r.machine_no || '1',
    beamNo: j.beamNo || j['Beam No'] || r.beam_no || '',
    beamType: j.beamType || j['Beam Type'] || r.quality || '',
    noOfCart: j.noOfCart || j['No of Cart'] || (r.cuts ? String(r.cuts) : ''),
    target,
    startMeter,
    endMeter,
    production: prod,
    cumulative: cum,
    roundCompleted: Boolean(j.roundCompleted),
    Date: j.Date || r.entry_date || '',
    Shift: j.Shift || r.shift || 'A',
    'Operator Name': j['Operator Name'] || r.operator_name || '',
    'Beam No': j['Beam No'] || j.beamNo || r.beam_no || '',
    'Beam Type': j['Beam Type'] || j.beamType || r.quality || '',
    'No of Cart': j['No of Cart'] || j.noOfCart || (r.cuts ? String(r.cuts) : ''),
    'Length Target': target,
    'Start Meter': startMeter,
    'End Meter': endMeter,
    'Production (Mtrs)': prod,
    'Cumulative (Mtrs)': cum,
  };
}

function executeVlLoomRpc(fnName: string, args: any[], today: string) {
  const p = args[0] || {};

  if (fnName === 'saveLogbookEntry') {
    const groupId = p.groupId || `GRP-${Date.now().toString().slice(-6)}`;
    const opRows = Array.isArray(p.rows) && p.rows.length > 0 ? p.rows : [{ operatorName: p.weaver || '', machineNo: p.loomNo || '' }];
    const stored = {
      ...p,
      groupId,
      date: p.date || today,
      shift: p.shift || 'A',
      rows: opRows,
    };
    db.prepare(`
      INSERT INTO vl_loom_logbook (group_id, entry_date, shift, loom_no, quality, beam_no, weaver_name, raw_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      groupId,
      p.date || today,
      p.shift || 'A',
      String(opRows.map((r: any) => r.machineNo).filter(Boolean).join(', ') || '-'),
      p.batch || '-',
      p.idleMachine || '-',
      String(opRows.map((r: any) => r.operatorName).filter(Boolean).join(', ') || '-'),
      JSON.stringify(stored)
    );
    return { ok: true, success: true, groupId };
  }

  if (fnName === 'getLogbookEntries') {
    const filterDate = typeof args[0] === 'string' && args[0] ? args[0] : '';
    const rows = db.prepare('SELECT * FROM vl_loom_logbook ORDER BY id DESC LIMIT 100').all() as any[];
    return rows
      .filter((r) => !filterDate || r.entry_date === filterDate)
      .map((r) => {
        const j = safeJson(r.raw_json);
        return {
          id: r.id,
          groupId: r.group_id || j.groupId || String(r.id),
          date: r.entry_date || j.date || '',
          shift: r.shift || j.shift || 'A',
          hoursWorked: j.hoursWorked || '',
          idleMachine: j.idleMachine || r.beam_no || '',
          batch: j.batch || r.quality || '',
          batchChange: j.batchChange || '',
          instructions: j.instructions || '',
          rows: Array.isArray(j.rows)
            ? j.rows
            : [{ operatorName: r.weaver_name || '', machineNo: r.loom_no || '' }],
        };
      });
  }

  if (fnName === 'deleteLogbookGroup') {
    const id = String(p?.groupId ?? args[0] ?? '');
    db.prepare('DELETE FROM vl_loom_logbook WHERE group_id = ? OR id = ?').run(id, Number(id) || 0);
    return { ok: true, success: true };
  }

  if (fnName === 'saveProductionEntry') {
    const dateVal = String(p.date || today);
    const rows = Array.isArray(p.rows) ? p.rows : [p];
    const stmt = db.prepare(`
      INSERT INTO vl_loom_production (entry_date, shift, loom_no, quality, cuts, meters, weaver_name, raw_json)
      VALUES (?, 'ALL', ?, 'VL', ?, ?, '', ?)
    `);

    for (const r of rows) {
      const machineNo = String(r.machineNo || r.loomNo || '1').trim();
      const a = r.a !== '' && r.a !== undefined && r.a !== null ? Number(r.a) : null;
      const b = r.b !== '' && r.b !== undefined && r.b !== null ? Number(r.b) : null;
      const c = r.c !== '' && r.c !== undefined && r.c !== null ? Number(r.c) : null;

      // Calculate shift production values
      const aProd = a !== null ? a : 0;
      const bProd = b !== null ? (a !== null && b >= a ? b - a : b) : 0;
      const cProd = c !== null ? (b !== null && c >= b ? c - b : c) : 0;
      const totalProd = Math.round((aProd + bProd + cProd) * 100) / 100;

      const rec = {
        date: dateVal,
        machineNo,
        a: a ?? '',
        aProd: Math.round(aProd * 100) / 100,
        b: b ?? '',
        bProd: Math.round(bProd * 100) / 100,
        c: c ?? '',
        cProd: Math.round(cProd * 100) / 100,
        totalProd,
      };
      stmt.run(dateVal, machineNo, 0, totalProd, JSON.stringify(rec));
    }
    return { ok: true, success: true };
  }

  if (fnName === 'getProductionEntries') {
    const filterDate = typeof args[0] === 'string' && args[0] ? args[0] : '';
    const rows = db.prepare('SELECT * FROM vl_loom_production ORDER BY id DESC LIMIT 200').all() as any[];
    return rows
      .filter((r) => !filterDate || r.entry_date === filterDate)
      .map((r) => {
        const j = safeJson(r.raw_json);
        return {
          rowId: String(r.id),
          id: r.id,
          date: r.entry_date || j.date || '',
          machineNo: String(r.loom_no || j.machineNo || '1'),
          a: j.a ?? '',
          aProd: j.aProd ?? 0,
          b: j.b ?? '',
          bProd: j.bProd ?? 0,
          c: j.c ?? '',
          cProd: j.cProd ?? 0,
        };
      });
  }

  if (fnName === 'deleteProductionRow') {
    const id = Number(p?.id ?? args[0] ?? 0);
    db.prepare('DELETE FROM vl_loom_production WHERE id = ?').run(id);
    return { ok: true, success: true };
  }

  if (fnName === 'getReportData') {
    const fromDate = typeof args[0] === 'string' ? args[0] : String(p.from || '');
    const toDate = typeof args[1] === 'string' ? args[1] : String(p.to || '');

    const prodRows = db.prepare('SELECT * FROM vl_loom_production ORDER BY entry_date ASC').all() as any[];
    const logRows = db.prepare('SELECT * FROM vl_loom_logbook').all() as any[];

    const filteredProd = prodRows.filter((r) => {
      if (fromDate && r.entry_date < fromDate) return false;
      if (toDate && r.entry_date > toDate) return false;
      return true;
    });
    const filteredLogs = logRows.filter((r) => {
      if (fromDate && r.entry_date < fromDate) return false;
      if (toDate && r.entry_date > toDate) return false;
      return true;
    });

    const machMap: Record<string, { machineNo: string; totalA: number; totalB: number; totalC: number; totalProd: number; daySet: Set<string> }> = {};
    let grandTotal = 0;

    for (const r of filteredProd) {
      const j = safeJson(r.raw_json);
      const m = String(r.loom_no || j.machineNo || '1');
      if (!machMap[m]) {
        machMap[m] = { machineNo: m, totalA: 0, totalB: 0, totalC: 0, totalProd: 0, daySet: new Set() };
      }
      const aP = Number(j.aProd ?? 0);
      const bP = Number(j.bProd ?? 0);
      const cP = Number(j.cProd ?? 0);
      const tot = Number(j.totalProd ?? r.meters ?? aP + bP + cP);
      machMap[m].totalA = Math.round((machMap[m].totalA + aP) * 100) / 100;
      machMap[m].totalB = Math.round((machMap[m].totalB + bP) * 100) / 100;
      machMap[m].totalC = Math.round((machMap[m].totalC + cP) * 100) / 100;
      machMap[m].totalProd = Math.round((machMap[m].totalProd + tot) * 100) / 100;
      machMap[m].daySet.add(r.entry_date);
      grandTotal = Math.round((grandTotal + tot) * 100) / 100;
    }

    const machineTotals = Object.values(machMap)
      .sort((a, b) => a.machineNo.localeCompare(b.machineNo, undefined, { numeric: true }))
      .map((m) => ({
        machineNo: m.machineNo,
        totalA: m.totalA,
        totalB: m.totalB,
        totalC: m.totalC,
        totalProd: m.totalProd,
        days: m.daySet.size,
      }));

    return {
      grandTotal,
      logCount: filteredLogs.length,
      machineTotals,
    };
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

