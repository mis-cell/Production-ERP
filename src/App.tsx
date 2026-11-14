import React, { useState, useCallback, useEffect } from 'react';
import {
  FileText,
  BarChart3,
  Shield,
  LogOut,
  Users,
  Database,
  Search,
  RefreshCw,
  Maximize2,
  Minimize2,
  Menu,
  Lock,
  User as UserIcon,
  AlertTriangle,
  Power,
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
  const [adminTab, setAdminTab] = useState<'users' | 'roles' | 'database'>('users');
  const [adminTableFilter, setAdminTableFilter] = useState<string>('');
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [fullScreenModule, setFullScreenModule] = useState(false);
  const [iframeRefreshKey, setIframeRefreshKey] = useState(0);

  // Maintenance Mode State & Popup Modal
  const [maintenanceActive, setMaintenanceActive] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState(
    'Server is under maintenance. We will be back shortly.'
  );
  const [maintenancePopup, setMaintenancePopup] = useState<string | null>(null);

  const checkMaintenanceStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/system/maintenance');
      if (!res.ok) return;
      const data = await res.json();
      if (data.ok && data.maintenance) {
        const active = Boolean(data.maintenance.active);
        const msg =
          data.maintenance.message || 'Server is under maintenance. We will be back shortly.';
        setMaintenanceActive(active);
        setMaintenanceMessage(msg);

        if (active && user) {
          const isAdminUser = Boolean(
            user.isAdmin ||
              user.username.toLowerCase() === 'admin' ||
              user.roleName.toLowerCase() === 'super admin'
          );
          if (!isAdminUser) {
            setUser(null);
            setPermissions([]);
            setMaintenancePopup(msg);
          }
        }
      }
    } catch {
      // ignore network error
    }
  }, [user]);

  useEffect(() => {
    checkMaintenanceStatus();
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        checkMaintenanceStatus();
      }
    }, 15000);
    const onFocusOrVisible = () => {
      if (document.visibilityState === 'visible') {
        checkMaintenanceStatus();
      }
    };
    window.addEventListener('focus', onFocusOrVisible);
    document.addEventListener('visibilitychange', onFocusOrVisible);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', onFocusOrVisible);
      document.removeEventListener('visibilitychange', onFocusOrVisible);
    };
  }, [checkMaintenanceStatus]);

  useEffect(() => {
    const onMessage = (ev: MessageEvent) => {
      if (ev.data && ev.data.type === 'BJM_MAINTENANCE_ACTIVE') {
        const msg =
          ev.data.message || 'Server is under maintenance. We will be back shortly.';
        setMaintenanceActive(true);
        setMaintenanceMessage(msg);
        setUser(null);
        setPermissions([]);
        setMaintenancePopup(msg);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const handleToggleMaintenance = async (nextActive: boolean, customMsg?: string) => {
    if (!user) return;
    try {
      const res = await fetch('/api/admin/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          active: nextActive,
          message: customMsg || maintenanceMessage,
        }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.ok && data.maintenance) {
        setMaintenanceActive(Boolean(data.maintenance.active));
        setMaintenanceMessage(
          data.maintenance.message || 'Server is under maintenance. We will be back shortly.'
        );
      }
    } catch {
      // ignore network error
    }
  };

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
        if (data.maintenance) {
          const msg =
            data.error || 'Server is under maintenance. We will be back shortly.';
          setMaintenanceActive(true);
          setMaintenanceMessage(msg);
          setMaintenancePopup(msg);
        }
        setLoginError(data.error || 'Invalid username or password');
        return;
      }
      if (data.maintenance) {
        setMaintenanceActive(Boolean(data.maintenance.active));
        setMaintenanceMessage(
          data.maintenance.message || 'Server is under maintenance. We will be back shortly.'
        );
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
      if (!data.ok && data.maintenance) {
        const msg =
          data.error || 'Server is under maintenance. We will be back shortly.';
        setMaintenanceActive(true);
        setMaintenanceMessage(msg);
        setUser(null);
        setPermissions([]);
        setMaintenancePopup(msg);
        return;
      }
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

  const maintenanceModalNode = maintenancePopup ? (
    <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border-2 border-[#EA580C] overflow-hidden">
        <div
          className="px-6 py-4 flex items-center gap-3 text-white"
          style={{
            background: 'linear-gradient(90deg, #9D174D 0%, #DC2626 50%, #EA580C 100%)',
          }}
        >
          <div className="p-2 rounded-xl bg-white/20">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold tracking-wide">Server Under Maintenance</h3>
            <p className="text-[11px] text-amber-100 font-medium">
              System Access Temporarily Paused
            </p>
          </div>
        </div>
        <div className="p-6 text-center space-y-4">
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-[#1E0538] text-sm font-bold leading-relaxed">
            {maintenancePopup}
          </div>
          <p className="text-xs text-slate-600 font-medium">
            Your active session has been safely logged out while system maintenance is in progress. Please try signing in again shortly.
          </p>
          <button
            onClick={() => setMaintenancePopup(null)}
            style={{
              background: 'linear-gradient(90deg, #3B0764 0%, #9D174D 52%, #EA580C 100%)',
            }}
            className="w-full py-2.5 rounded-xl text-white text-xs font-bold tracking-wide cursor-pointer shadow-md hover:opacity-95"
          >
            OK, Got It
          </button>
        </div>
      </div>
    </div>
  ) : null;

  // ==========================================================================
  // STEP 1: YAJUR THEME LOGIN PAGE
  // ==========================================================================
  if (!user) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-4"
        style={{
          background: 'linear-gradient(135deg, #1E0538 0%, #3B0764 52%, #831843 100%)',
        }}
      >
        {maintenanceModalNode}
        <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl border border-[#E9D5FF]">
          {/* Top YAJUR Lotus Gradient Accent Bar */}
          <div
            className="h-2 w-full"
            style={{
              background: 'linear-gradient(90deg, #3B0764 0%, #9D174D 52%, #EA580C 100%)',
            }}
          />

          <div className="p-8 text-center">
            <div className="flex flex-col items-center justify-center mb-3">
              <h1 className="text-xl font-bold text-[#240046] tracking-tight">
                BALLY JUTE MILL ERP
              </h1>
              <p className="text-xs font-medium text-[#6B21A8]">
                Production &amp; Operations Management System
              </p>
            </div>

            {maintenanceActive && (
              <div className="mt-4 p-3.5 rounded-xl bg-amber-50 border-2 border-amber-400 text-left flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-amber-900">
                    Server Under Maintenance
                  </div>
                  <div className="text-[11px] font-semibold text-amber-800 mt-0.5">
                    {maintenanceMessage}
                  </div>
                </div>
              </div>
            )}

            {loginError && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-red-700 text-left">
                {loginError}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                performLogin(loginUsername, loginPassword);
              }}
              className="mt-5 space-y-4 text-left"
            >
              <div>
                <label className="block text-xs font-semibold text-[#3B0764] mb-1.5">
                  <UserIcon className="w-3.5 h-3.5 inline mr-1.5 text-[#9D174D]" />
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="Enter Username"
                  className="w-full px-3.5 py-2.5 text-sm border border-[#D8B4FE] rounded-lg bg-white text-[#1E0538] focus:outline-none focus:border-[#9D174D] focus:ring-2 focus:ring-[#9D174D]/15 font-medium transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3B0764] mb-1.5">
                  <Lock className="w-3.5 h-3.5 inline mr-1.5 text-[#9D174D]" />
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter Password"
                  className="w-full px-3.5 py-2.5 text-sm border border-[#D8B4FE] rounded-lg bg-white text-[#1E0538] focus:outline-none focus:border-[#9D174D] focus:ring-2 focus:ring-[#9D174D]/15 font-medium transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loggingIn}
                style={{
                  background: 'linear-gradient(90deg, #3B0764 0%, #9D174D 52%, #EA580C 100%)',
                }}
                className="w-full py-2.5 rounded-lg text-white font-semibold text-sm tracking-wide transition-all cursor-pointer shadow-md hover:opacity-95"
              >
                {loggingIn ? 'Signing in...' : 'Sign In to Workspace'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // STEP 2: MAIN APP — YAJUR DEEP ROYAL PURPLE SIDEBAR (MATCHING SCREENSHOT 1)
  // ==========================================================================
  const accessibleModules = ALL_MODULES.filter((m) => {
    const p = permissions.find((perm) => perm.moduleKey === m.key);
    const matchesSearch =
      m.name.toLowerCase().includes(sidebarSearch.toLowerCase()) ||
      m.shortName.toLowerCase().includes(sidebarSearch.toLowerCase());
    return Boolean(p?.canView) && matchesSearch;
  });

  const activeModuleMeta = ALL_MODULES.find((m) => m.key === activeModuleKey) || ALL_MODULES[0];
  const isCurrentUserAdmin = Boolean(
    user.isAdmin ||
      user.username.toLowerCase() === 'admin' ||
      user.roleName.toLowerCase() === 'super admin'
  );

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-[#FAF7FD] text-[#1E0538]">
      {/* LEFT SIDEBAR: Deep Royal Purple + YAJUR Crimson/Orange Active Pill */}
      {!fullScreenModule && (
        <aside
          className={`${
            sidebarCollapsed ? 'w-16' : 'w-68'
          } yajur-sidebar flex flex-col transition-all duration-150 shrink-0`}
        >
          {/* Top Brand Header */}
          <div className="h-14 px-3.5 border-b border-[#3B0764] flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="truncate">
                  <div className="font-bold text-sm text-white tracking-wide truncate">
                    BALLY JUTE MILL
                  </div>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 rounded-lg text-purple-200 hover:text-white hover:bg-[#3B0764] cursor-pointer"
              title="Collapse / Expand Sidebar"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>

          {/* Primary Mode Switchers at Top of Sidebar */}
          {!sidebarCollapsed && (
            <div className="p-3 border-b border-[#3B0764] space-y-2">
              <button
                onClick={() => {
                  setReportDeptFilter('all');
                  setViewMode('report');
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer ${
                  viewMode === 'report'
                    ? 'yajur-active-pill text-white'
                    : 'bg-[#3B0764]/75 hover:bg-[#4C1D95] text-[#FBBF24] border border-[#581C87]'
                }`}
              >
                <span className="flex items-center gap-2">
                  <BarChart3 className="w-3.5 h-3.5 text-[#FBBF24]" />
                  REPORT SECTION (ALL)
                </span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#1A0033] text-[#FDE68A]">
                  16 Depts
                </span>
              </button>

              <button
                onClick={() => {
                  setAdminTab('users');
                  setViewMode('admin');
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer ${
                  viewMode === 'admin'
                    ? 'yajur-active-pill text-white'
                    : 'bg-[#3B0764]/75 hover:bg-[#4C1D95] text-purple-100 border border-[#581C87]'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-purple-200" />
                  ADMIN PANEL &amp; USERS
                </span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#1A0033] text-[#FBBF24]">
                  DB
                </span>
              </button>
            </div>
          )}

          {/* Search Input for the 16 Forms */}
          {!sidebarCollapsed && (
            <div className="px-3 pt-3 pb-1.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-purple-200 mb-1.5 flex items-center justify-between">
                <span>ALL DEPARTMENT FORMS ({accessibleModules.length})</span>
              </div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-purple-300 absolute left-2.5 top-2" />
                <input
                  type="text"
                  value={sidebarSearch}
                  onChange={(e) => setSidebarSearch(e.target.value)}
                  placeholder="Filter forms 1 to 16..."
                  className="w-full pl-8 pr-2.5 py-1.5 bg-[#1A0033]/80 border border-[#581C87] rounded-lg text-xs font-medium text-white placeholder-purple-300/70 focus:outline-none focus:border-[#EA580C]"
                />
              </div>
            </div>
          )}

          {/* Flat Numbered List of All 16 Department Forms */}
          <div className="flex-1 overflow-y-auto px-2.5 py-1.5 space-y-1">
            {accessibleModules.map((mod) => {
              const isCurrentForm = viewMode === 'form' && activeModuleKey === mod.key;

              return (
                <div
                  key={mod.key}
                  className={`group flex items-center justify-between rounded-xl transition-all ${
                    isCurrentForm
                      ? 'yajur-active-pill font-semibold'
                      : 'hover:bg-[#3B0764]/70 text-purple-100 hover:text-white font-medium'
                  }`}
                >
                  <button
                    onClick={() => {
                      setActiveModuleKey(mod.key);
                      setViewMode('form');
                    }}
                    className="flex-1 flex items-center gap-2.5 px-3 py-2 text-left text-xs truncate cursor-pointer"
                    title={`Open ${mod.name} Entry Form`}
                  >
                    <FileText
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isCurrentForm ? 'text-[#FDE68A]' : 'text-purple-300 group-hover:text-white'
                      }`}
                    />
                    {!sidebarCollapsed && <span className="truncate">{mod.shortName}</span>}
                  </button>
                </div>
              );
            })}

            {/* Quick Admin Sub-links at Bottom of Scroll */}
            {!sidebarCollapsed && (
              <div className="pt-3 mt-3 border-t border-[#3B0764] space-y-1">
                <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-purple-300/80">
                  Admin Shortcuts
                </div>
                <button
                  onClick={() => {
                    setAdminTab('users');
                    setViewMode('admin');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-purple-200 hover:text-white hover:bg-[#3B0764]/70 cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5 text-purple-300" />
                  <span>Users &amp; Permissions</span>
                </button>
                <button
                  onClick={() => {
                    setAdminTableFilter('');
                    setAdminTab('database');
                    setViewMode('admin');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-purple-200 hover:text-white hover:bg-[#3B0764]/70 cursor-pointer"
                >
                  <Database className="w-3.5 h-3.5 text-purple-300" />
                  <span>&ldquo;production&rdquo; DB Tables</span>
                </button>
              </div>
            )}
          </div>

          {/* Logged-In User Footer (Matching Screenshot 1) */}
          <div className="p-3 border-t border-[#3B0764] bg-[#1A0033] flex items-center justify-between gap-2">
            {!sidebarCollapsed && (
              <div className="truncate">
                <div className="text-xs font-bold text-white truncate">{user.fullName}</div>
                <div className="text-[11px] text-[#FBBF24] font-mono truncate">
                  @{user.username} · {user.roleName}
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              title="Logout"
              className="px-3 py-1.5 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors shadow-xs"
            >
              <LogOut className="w-3.5 h-3.5 text-white" />
              {!sidebarCollapsed && <span>Logout</span>}
            </button>
          </div>
        </aside>
      )}

      {/* RIGHT MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar Matching Screenshot 1 & Screenshot 2 */}
        <header className="h-14 bg-white border-b border-[#E9D5FF] px-4 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="px-2.5 py-1 rounded-md bg-[#F3E8FF] border border-[#E9D5FF] text-[#4C1D95] font-bold text-xs">
              {viewMode === 'form'
                ? activeModuleMeta.shortName
                : viewMode === 'report'
                ? 'REPORT SECTION'
                : 'ADMIN PANEL'}
            </span>
            <h2 className="text-sm font-bold text-[#240046] truncate">
              {viewMode === 'form'
                ? activeModuleMeta.name
                : viewMode === 'report'
                ? 'Master Production, Table & Field Reports (Database: production)'
                : 'User Permissions, Roles & Database Control'}
            </h2>
          </div>

          {/* Top Bar Action Buttons Matching Screenshot 1 & Screenshot 2 */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('form')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                viewMode === 'form'
                  ? 'bg-[#3B0764] text-white shadow-xs'
                  : 'bg-white border border-[#E9D5FF] text-[#3B0764] hover:bg-[#FAF5FF]'
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
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                viewMode === 'report'
                  ? 'bg-[#3B0764] text-white shadow-xs'
                  : 'bg-[#FFFBEB] border border-[#FCD34D] text-[#B45309] hover:bg-[#FEF3C7]'
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
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                viewMode === 'admin'
                  ? 'bg-[#3B0764] text-white shadow-xs'
                  : 'bg-white border border-[#E9D5FF] text-[#3B0764] hover:bg-[#FAF5FF]'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Admin Panel
            </button>

            {isCurrentUserAdmin && (
              <button
                onClick={() => handleToggleMaintenance(!maintenanceActive)}
                title={
                  maintenanceActive
                    ? 'Click to Turn OFF Maintenance Mode'
                    : 'Click to Turn ON Maintenance Mode (logs out all non-admin users)'
                }
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  maintenanceActive
                    ? 'bg-[#DC2626] hover:bg-[#B91C1C] text-white shadow-xs animate-pulse'
                    : 'bg-amber-50 border border-amber-300 text-amber-900 hover:bg-amber-100'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                {maintenanceActive ? 'Maintenance: ON' : 'Maintenance: OFF'}
              </button>
            )}

            {viewMode === 'form' && (
              <>
                <button
                  onClick={() => setIframeRefreshKey((k) => k + 1)}
                  className="p-1.5 rounded-lg bg-white border border-[#E9D5FF] hover:bg-[#FAF5FF] text-[#4C1D95] cursor-pointer"
                  title="Reload Form"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setFullScreenModule(!fullScreenModule)}
                  className="p-1.5 rounded-lg bg-white border border-[#E9D5FF] hover:bg-[#FAF5FF] text-[#4C1D95] cursor-pointer"
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

        {/* Active Maintenance Banner for Admin */}
        {maintenanceActive && isCurrentUserAdmin && (
          <div className="bg-[#DC2626] text-white px-4 py-1.5 text-xs font-bold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-200" />
              MAINTENANCE MODE IS ACTIVE: All non-admin users are logged out and blocked ({maintenanceMessage})
            </span>
            <button
              onClick={() => handleToggleMaintenance(false)}
              className="px-2.5 py-0.5 rounded bg-white text-[#DC2626] text-[11px] font-bold hover:bg-red-50 cursor-pointer"
            >
              Turn OFF Now
            </button>
          </div>
        )}

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
            isCurrentUserAdmin={isCurrentUserAdmin}
            maintenanceActive={maintenanceActive}
            maintenanceMessage={maintenanceMessage}
            onToggleMaintenance={handleToggleMaintenance}
            onPermissionsUpdated={refreshSessionPermissions}
            onOpenModule={(modKey) => {
              setActiveModuleKey(modKey);
              setViewMode('form');
            }}
          />
        ) : (
          <div className="flex-1 w-full h-full bg-[#FAF7FD] relative">
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
