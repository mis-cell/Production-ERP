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
