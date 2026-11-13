import React, { useState, useCallback } from 'react';
import {
  FileText,
  BarChart3,
  Shield,
  LogOut,
  Users,
  Database,
  Server,
  Search,
  RefreshCw,
  Maximize2,
  Minimize2,
  Menu,
  Lock,
  User as UserIcon,
} from 'lucide-react';
import { UserSession, EffectivePermission, ModuleMeta } from './types';
import { AdminConsole } from './components/AdminConsole';
import { ReportSection } from './components/ReportSection';

// Listed in exact 1..16 order matching the 16 forms in the source file
const ALL_MODULES: ModuleMeta[] = [
  {
    key: 'carding',
    docIndex: 0,
    name: 'Carding Department',
    shortName: '1. Carding',
    category: 'Spinning & Prep',
    description: 'Shift Log Book, Machine Breakdown Tracking & Pile Stock Management',
    tables: ['carding_log_book', 'carding_machine_breakdown', 'carding_pile_stock'],
  },
  {
    key: 'cutting',
    docIndex: 1,
    name: 'Cutting Department',
    shortName: '2. Cutting',
    category: 'Finishing & Packing',
    description: 'Shift Cutting Production, Attendance, Machine Allocations & Rate Masters',
    tables: ['cutting_shifts', 'cutting_production_rows', 'cutting_masters', 'cutting_settings'],
  },
  {
    key: 'damping',
    docIndex: 2,
    name: 'Damping Department',
    shortName: '3. Damping',
    category: 'Finishing & Packing',
    description: 'Cloth Damping Shift Entries, Bundle Weights & Operator Masters',
    tables: ['damping_shifts', 'damping_production_rows', 'damping_masters', 'damping_settings'],
  },
  {
    key: 'hemming',
    docIndex: 3,
    name: 'Hemming Department',
    shortName: '4. Hemming',
    category: 'Finishing & Packing',
    description: 'Sewing & Hemming Line Shift Entry, Worker Output & Quality Masters',
    tables: ['hemming_shifts', 'hemming_production_rows', 'hemming_masters'],
  },
  {
    key: 'herackle',
    docIndex: 4,
    name: 'Herackle Production',
    shortName: '5. Herackle',
    category: 'Finishing & Packing',
    description: 'Herackle Stitching Shift Records, Target Comparison & Summary Reports',
    tables: ['herackle_records', 'herackle_rows', 'herackle_masters'],
  },
  {
    key: 'lapping',
    docIndex: 5,
    name: 'Lapping Production',
    shortName: '6. Lapping',
    category: 'Finishing & Packing',
    description: 'Lapping Machine Production Entries, Operator Cuts & Shift Reports',
    tables: ['lapping_production'],
  },
  {
    key: 'narrow_beaming',
    docIndex: 6,
    name: 'Narrow Beaming',
    shortName: '7. Narrow Beaming',
    category: 'Beaming',
    description: 'Narrow Beam Round Tracking, Cut Verification, Shift Log & Analytics',
    tables: ['narrow_beaming_rounds', 'narrow_beaming_logs', 'narrow_beaming_production'],
  },
  {
    key: 'narrow_loom',
    docIndex: 7,
    name: 'Narrow Loom Department',
    shortName: '8. Narrow Loom',
    category: 'Weaving & Looms',
    description: 'Narrow Loom Shift Logbook, Loom-wise Meter/Cut Production & Efficiency',
    tables: ['narrow_loom_logbook', 'narrow_loom_production'],
  },
  {
    key: 'pre_beaming',
    docIndex: 8,
    name: 'Pre Beaming Department',
    shortName: '9. Pre Beaming',
    category: 'Beaming',
    description: 'Pre-Beam Round Management, Beam Status, Verification & Production Logs',
    tables: ['pre_beaming_rounds', 'pre_beaming_logs', 'pre_beaming_production'],
  },
  {
    key: 'press',
    docIndex: 9,
    name: 'Press Department (Bale Packing)',
    shortName: '10. Press (Baling)',
    category: 'Finishing & Packing',
    description: 'Bale Serial Generation, Press Packing Weight Entry & Dispatch Summary',
    tables: ['press_bales', 'press_options'],
  },
  {
    key: 's4_beaming',
    docIndex: 10,
    name: 'S4 Beaming Department',
    shortName: '11. S4 Beaming',
    category: 'Beaming',
    description: 'S4 Beam Machine Logbook, Purchase Order Color Tracking & Round Verification',
    tables: ['s4_beaming_logbook', 's4_beaming_production', 's4_beaming_verification', 's4_beaming_purchase_orders'],
  },
  {
    key: 's4_loom',
    docIndex: 11,
    name: 'S4 Loom Department',
    shortName: '12. S4 Loom',
    category: 'Weaving & Looms',
    description: '336-Loom Shift Logbook, Meter Production, Cut Verification & Loom Reports',
    tables: ['s4_loom_logbook', 's4_loom_production', 's4_loom_verification'],
  },
  {
    key: 'spinning',
    docIndex: 12,
    name: 'Spinning Department',
    shortName: '13. Spinning',
    category: 'Spinning & Prep',
    description: 'Spinning Frame Log Book, Machine Breakdowns & Frame Production Reports',
    tables: ['spinning_logbook', 'spinning_breakdown', 'spinning_production'],
  },
  {
    key: 'spreader',
    docIndex: 13,
    name: 'Spreader & Softener Department',
    shortName: '14. Spreader',
    category: 'Spinning & Prep',
    description: 'Spreader Logbook, Meter Readings, Roll Production & Breakdown Register',
    tables: ['spreader_logbook', 'spreader_breakdown', 'spreader_meter_reading', 'spreader_roll_production'],
  },
  {
    key: 'vl_beaming',
    docIndex: 14,
    name: 'VL Beaming Department',
    shortName: '15. VL Beaming',
    category: 'Beaming',
    description: 'VL Beam Round State, Operator Shift Logs, Verification & Summary Reports',
    tables: ['vl_beaming_logbook', 'vl_beaming_rounds', 'vl_beaming_production'],
  },
  {
    key: 'vl_loom',
    docIndex: 15,
    name: 'VL Loom Department',
    shortName: '16. VL Loom',
    category: 'Weaving & Looms',
    description: 'VL Loom Group Logbooks, Loom Production Entries & Shift Analytics',
    tables: ['vl_loom_logbook', 'vl_loom_production'],
  },
];

export default function App() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [permissions, setPermissions] = useState<EffectivePermission[]>([]);

  // Login Form State
  const [loginUsername, setLoginUsername] = useState('admin');
  const [loginPassword, setLoginPassword] = useState('admin123');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Main Workspace View Mode: 'form' | 'report' | 'admin'
  const [viewMode, setViewMode] = useState<'form' | 'report' | 'admin'>('form');
  const [activeModuleKey, setActiveModuleKey] = useState<string>('carding');
  const [reportDeptFilter, setReportDeptFilter] = useState<string>('all');
  const [adminTab, setAdminTab] = useState<'users' | 'roles' | 'database' | 'ubuntu'>('users');
  const [adminTableFilter, setAdminTableFilter] = useState<string>('');
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [fullScreenModule, setFullScreenModule] = useState(false);
  const [iframeRefreshKey, setIframeRefreshKey] = useState(0);

  const performLogin = async (usernameVal: string, passwordVal: string) => {
    setLoggingIn(true);
    setLoginError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameVal, password: passwordVal }),
      });
      const data = await res.json();
      if (!data.ok) {
        setLoginError(data.error || 'Invalid username or password');
        return;
      }
      setUser(data.user);
      setPermissions(data.permissions || []);

      const firstAllowed = (data.permissions || []).find((p: EffectivePermission) => p.canView);
      if (firstAllowed) {
        setActiveModuleKey(firstAllowed.moduleKey);
      }
      setViewMode('form');
    } catch (err: any) {
      setLoginError(err.message || 'Server connection error');
    } finally {
      setLoggingIn(false);
    }
  };

  const refreshSessionPermissions = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/auth/session/${user.id}`);
      const data = await res.json();
      if (data.ok) {
        setUser(data.user);
        setPermissions(data.permissions || []);
      }
    } catch {
      // ignore
    }
  }, [user]);

  const handleLogout = () => {
    setUser(null);
    setPermissions([]);
  };

  // ==========================================================================
  // STEP 1: SIMPLE, CLEAN CENTERED LOGIN PAGE (WITH UPLOADED LOGO & THEME)
  // ==========================================================================
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#2E054E] via-[#581C87] to-[#9D174D] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#FCFBF9] rounded-2xl shadow-2xl border-2 border-amber-400/50 overflow-hidden">
          {/* Top Accent Strip in Lotus Orange -> Magenta -> Purple */}
          <div className="h-2.5 w-full bg-gradient-to-r from-amber-400 via-orange-500 to-[#581C87]" />

          <div className="p-8 text-center">
            <h1 className="text-2xl font-extrabold text-[#3B0764] tracking-tight">
              BALLY JUTE MILL ERP
            </h1>

            {loginError && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-bold text-red-700 text-left">
                {loginError}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                performLogin(loginUsername, loginPassword);
              }}
              className="mt-6 space-y-4 text-left"
            >
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#3B0764] mb-1.5">
                  <UserIcon className="w-3.5 h-3.5 inline mr-1 text-orange-600" />
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="Enter Username"
                  className="w-full px-4 py-2.5 text-sm border border-purple-200 rounded-xl bg-white text-slate-900 focus:outline-none focus:border-[#581C87] font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#3B0764] mb-1.5">
                  <Lock className="w-3.5 h-3.5 inline mr-1 text-orange-600" />
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter Password"
                  className="w-full px-4 py-2.5 text-sm border border-purple-200 rounded-xl bg-white text-slate-900 focus:outline-none focus:border-[#581C87] font-semibold"
                />
              </div>

              <button
                type="submit"
                disabled={loggingIn}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#EA580C] via-[#9D174D] to-[#4C1D95] hover:opacity-95 text-white font-extrabold text-sm shadow-md transition-all cursor-pointer"
              >
                {loggingIn ? 'Signing In...' : 'LOGIN TO SYSTEM'}
              </button>
            </form>

            {/* Quick Role Login Buttons */}
            <div className="mt-6 pt-4 border-t border-purple-100">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Quick Login Accounts
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => performLogin('admin', 'admin123')}
                  className="py-1.5 px-2 rounded-lg bg-purple-100 hover:bg-purple-200 text-[#3B0764] text-xs font-bold cursor-pointer"
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => performLogin('manager', '1234')}
                  className="py-1.5 px-2 rounded-lg bg-orange-100 hover:bg-orange-200 text-orange-900 text-xs font-bold cursor-pointer"
                >
                  Manager
                </button>
                <button
                  type="button"
                  onClick={() => performLogin('spinning_sup', '1234')}
                  className="py-1.5 px-2 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold cursor-pointer"
                >
                  Supervisor
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // STEP 2: MAIN APP — LEFT SIDEBAR (ALL 16 FORMS + REPORT SECTION + ADMIN PANEL)
  // ==========================================================================
  const accessibleModules = ALL_MODULES.filter((m) => {
    const p = permissions.find((perm) => perm.moduleKey === m.key);
    const matchesSearch =
      m.name.toLowerCase().includes(sidebarSearch.toLowerCase()) ||
      m.shortName.toLowerCase().includes(sidebarSearch.toLowerCase());
    return Boolean(p?.canView) && matchesSearch;
  });

  const activeModuleMeta = ALL_MODULES.find((m) => m.key === activeModuleKey) || ALL_MODULES[0];

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-[#FCFBF9] text-slate-900">
      {/* LEFT SIDEBAR: All Forms + Report Section + Admin Panel */}
      {!fullScreenModule && (
        <aside
          className={`${
            sidebarCollapsed ? 'w-16' : 'w-72'
          } bg-gradient-to-b from-[#2E054E] via-[#3B0764] to-[#4C1D95] text-white flex flex-col border-r border-purple-900 transition-all duration-150 shrink-0 shadow-xl`}
        >
          {/* Top Logo & Brand Header */}
          <div className="p-3.5 border-b border-white/10 flex items-center justify-between bg-black/15">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="truncate">
                  <div className="font-extrabold text-sm text-white tracking-tight truncate">
                    BALLY JUTE MILL
                  </div>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 rounded-lg text-purple-200 hover:text-white hover:bg-white/10 cursor-pointer"
              title="Collapse / Expand Sidebar"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>

          {/* 3 Primary Mode Switchers at Top of Sidebar */}
          {!sidebarCollapsed && (
            <div className="p-3 border-b border-white/10 space-y-1.5 bg-black/10">
              <button
                onClick={() => {
                  setReportDeptFilter('all');
                  setViewMode('report');
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  viewMode === 'report'
                    ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-sm'
                    : 'bg-white/10 hover:bg-white/20 text-amber-300'
                }`}
              >
                <span className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  REPORT SECTION (ALL)
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/20 text-white">
                  16 Depts
                </span>
              </button>

              <button
                onClick={() => {
                  setAdminTab('users');
                  setViewMode('admin');
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  viewMode === 'admin'
                    ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-sm'
                    : 'bg-white/10 hover:bg-white/20 text-purple-100'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  ADMIN PANEL & USERS
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/20 text-amber-300">
                  DB
                </span>
              </button>
            </div>
          )}

          {/* Search Input for the 16 Forms */}
          {!sidebarCollapsed && (
            <div className="px-3 pt-3 pb-1.5">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-amber-300 mb-1.5 flex items-center justify-between">
                <span>ALL DEPARTMENT FORMS ({accessibleModules.length})</span>
              </div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-purple-300 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={sidebarSearch}
                  onChange={(e) => setSidebarSearch(e.target.value)}
                  placeholder="Filter forms 1 to 16..."
                  className="w-full pl-8 pr-2.5 py-1.5 bg-white/10 border border-white/15 rounded-lg text-xs text-white placeholder-purple-300 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          )}

          {/* Flat Numbered List of All 16 Department Forms */}
          <div className="flex-1 overflow-y-auto px-2.5 py-2 space-y-1">
            {accessibleModules.map((mod) => {
              const isCurrentForm = viewMode === 'form' && activeModuleKey === mod.key;
              const isCurrentReport = viewMode === 'report' && reportDeptFilter === mod.key;
              const perm = permissions.find((p) => p.moduleKey === mod.key);

              return (
                <div
                  key={mod.key}
                  className={`group flex items-center justify-between rounded-xl transition-all ${
                    isCurrentForm
                      ? 'bg-gradient-to-r from-[#EA580C] to-[#9D174D] text-white font-bold shadow-sm'
                      : isCurrentReport
                      ? 'bg-amber-500/30 border border-amber-400/50 text-white'
                      : 'hover:bg-white/10 text-purple-100'
                  }`}
                >
                  <button
                    onClick={() => {
                      setActiveModuleKey(mod.key);
                      setViewMode('form');
                    }}
                    className="flex-1 flex items-center gap-2 px-3 py-2 text-left text-xs truncate cursor-pointer"
                    title={`Open ${mod.name} Entry Form`}
                  >
                    <FileText className="w-3.5 h-3.5 shrink-0 text-amber-300" />
                    {!sidebarCollapsed && <span className="truncate">{mod.shortName}</span>}
                  </button>

                  {!sidebarCollapsed && perm?.canReport && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setReportDeptFilter(mod.key);
                        setViewMode('report');
                      }}
                      title={`View ${mod.name} Report`}
                      className={`mr-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors ${
                        isCurrentReport
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-black/25 hover:bg-amber-400 hover:text-slate-950 text-amber-200'
                      }`}
                    >
                      Report
                    </button>
                  )}
                </div>
              );
            })}

            {/* Quick Admin Sub-links at Bottom of Scroll */}
            {!sidebarCollapsed && (
              <div className="pt-3 mt-3 border-t border-white/15 space-y-1">
                <div className="px-2 text-[10px] font-extrabold uppercase tracking-wider text-amber-300">
                  Admin Panel Shortcuts
                </div>
                <button
                  onClick={() => {
                    setAdminTab('users');
                    setViewMode('admin');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-purple-100 hover:bg-white/10 cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5 text-amber-300" />
                  <span>Users & Permissions</span>
                </button>
                <button
                  onClick={() => {
                    setAdminTableFilter('');
                    setAdminTab('database');
                    setViewMode('admin');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-purple-100 hover:bg-white/10 cursor-pointer"
                >
                  <Database className="w-3.5 h-3.5 text-amber-300" />
                  <span>&ldquo;production&rdquo; DB Tables</span>
                </button>
                <button
                  onClick={() => {
                    setAdminTab('ubuntu');
                    setViewMode('admin');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-purple-100 hover:bg-white/10 cursor-pointer"
                >
                  <Server className="w-3.5 h-3.5 text-amber-300" />
                  <span>Server 192.168.1.6:3002</span>
                </button>
              </div>
            )}
          </div>

          {/* Logged-In User Footer */}
          <div className="p-3 border-t border-white/15 bg-black/25 flex items-center justify-between gap-2">
            {!sidebarCollapsed && (
              <div className="truncate">
                <div className="text-xs font-bold text-white truncate">{user.fullName}</div>
                <div className="text-[11px] text-amber-300 font-mono truncate">
                  @{user.username} · {user.roleName}
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              title="Logout"
              className="px-2.5 py-1.5 rounded-lg bg-red-600/90 hover:bg-red-600 text-white text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              {!sidebarCollapsed && <span>Logout</span>}
            </button>
          </div>
        </aside>
      )}

      {/* RIGHT MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar with Instant Switch between Form, Report Section, and Admin Panel */}
        <header className="h-14 bg-white border-b border-purple-200 px-4 flex items-center justify-between gap-3 shrink-0 shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            <span className="px-2.5 py-1 rounded-md bg-purple-100 text-[#3B0764] font-extrabold text-xs">
              {viewMode === 'form'
                ? activeModuleMeta.shortName
                : viewMode === 'report'
                ? 'REPORT SECTION'
                : 'ADMIN PANEL'}
            </span>
            <h2 className="text-sm font-extrabold text-[#3B0764] truncate">
              {viewMode === 'form'
                ? activeModuleMeta.name
                : viewMode === 'report'
                ? 'Production & Shift Reports (Database: production)'
                : 'User Permissions, Roles & Database Control'}
            </h2>
          </div>

          {/* Top Bar Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('form')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                viewMode === 'form'
                  ? 'bg-[#3B0764] text-white'
                  : 'border border-purple-200 text-[#3B0764] hover:bg-purple-50'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Entry Form
            </button>

            <button
              onClick={() => {
                setReportDeptFilter(viewMode === 'form' ? activeModuleMeta.key : 'all');
                setViewMode('report');
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                viewMode === 'report'
                  ? 'bg-gradient-to-r from-[#EA580C] to-[#9D174D] text-white'
                  : 'border border-orange-300 bg-orange-50 text-orange-800 hover:bg-orange-100'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Report Section
            </button>

            <button
              onClick={() => {
                setAdminTab('users');
                setViewMode('admin');
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                viewMode === 'admin'
                  ? 'bg-[#3B0764] text-white'
                  : 'border border-purple-200 text-[#3B0764] hover:bg-purple-50'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Admin Panel
            </button>

            {viewMode === 'form' && (
              <>
                <button
                  onClick={() => setIframeRefreshKey((k) => k + 1)}
                  className="p-1.5 rounded-lg border border-purple-200 hover:bg-purple-50 text-[#3B0764] cursor-pointer"
                  title="Reload Form"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setFullScreenModule(!fullScreenModule)}
                  className="p-1.5 rounded-lg border border-purple-200 hover:bg-purple-50 text-[#3B0764] cursor-pointer"
                  title="Full Screen Toggle"
                >
                  {fullScreenModule ? (
                    <Minimize2 className="w-3.5 h-3.5" />
                  ) : (
                    <Maximize2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </>
            )}
          </div>
        </header>

        {/* Main Viewport Content */}
        {viewMode === 'report' ? (
          <ReportSection
            userId={user.id}
            initialDepartment={reportDeptFilter}
            onOpenDepartmentForm={(modKey) => {
              setActiveModuleKey(modKey);
              setViewMode('form');
            }}
          />
        ) : viewMode === 'admin' ? (
          <AdminConsole
            initialTab={adminTab}
            initialTableFilter={adminTableFilter}
            currentUserId={user.id}
            onPermissionsUpdated={refreshSessionPermissions}
            onOpenModule={(modKey) => {
              setActiveModuleKey(modKey);
              setViewMode('form');
            }}
          />
        ) : (
          <div className="flex-1 w-full h-full bg-white relative">
            <iframe
              key={`${activeModuleMeta.key}-${user.id}-${iframeRefreshKey}`}
              src={`/api/modules/${activeModuleMeta.key}/render?userId=${user.id}`}
              title={activeModuleMeta.name}
              className="w-full h-full border-0"
            />
          </div>
        )}
      </div>
    </div>
  );
}
