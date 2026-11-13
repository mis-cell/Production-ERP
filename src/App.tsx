import React, { useState, useCallback } from 'react';
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
} from 'lucide-react';
import { UserSession, EffectivePermission, ModuleMeta } from './types';
import { AdminConsole } from './components/AdminConsole';
import { ReportSection } from './components/ReportSection';

// Exact 8 Colour Plates from the uploaded Magenta-to-Blush Palette
export const MAGENTA_BLUSH_PLATES = [
  '#9E0059', // Plate 1: Deep Royal Magenta
  '#C90D6B', // Plate 2: Vivid Ruby Magenta
  '#E62A82', // Plate 3: Bright Rose Pink
  '#F35BA0', // Plate 4: Warm Flamingo Pink
  '#EC69A8', // Plate 5: Medium Orchid Blush
  '#F595C3', // Plate 6: Soft Carnation Pink
  '#F9BCDA', // Plate 7: Pastel Petal Blush
  '#FDE2EF', // Plate 8: Light Silk Blush
];

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
  // STEP 1: HD GLOSSY 8-PLATE MAGENTA-TO-BLUSH LOGIN PAGE
  // ==========================================================================
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#9E0059] via-[#C90D6B] to-[#F35BA0] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md hd-gloss-card rounded-2xl overflow-hidden shadow-2xl border-2 border-[#F595C3]">
          {/* 8-Plate Glossy Color Bar at Top */}
          <div className="grid grid-cols-8 h-3 w-full">
            {MAGENTA_BLUSH_PLATES.map((hex) => (
              <div key={hex} style={{ backgroundColor: hex }} />
            ))}
          </div>

          <div className="p-8 text-center">
            <h1 className="text-2xl font-black text-[#38001E] tracking-tight">
              BALLY JUTE MILL ERP
            </h1>

            {loginError && (
              <div className="mt-4 p-3 rounded-lg bg-[#FDE2EF] border-2 border-[#C90D6B] text-xs font-black text-[#9E0059] text-left">
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
                <label className="block text-xs font-black uppercase tracking-wider text-[#38001E] mb-1.5">
                  <UserIcon className="w-3.5 h-3.5 inline mr-1.5 text-[#9E0059]" />
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="Enter Username"
                  className="w-full px-4 py-2.5 text-sm border-2 border-[#EC69A8] rounded-xl bg-white text-[#38001E] focus:outline-none focus:border-[#9E0059] font-extrabold shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#38001E] mb-1.5">
                  <Lock className="w-3.5 h-3.5 inline mr-1.5 text-[#9E0059]" />
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter Password"
                  className="w-full px-4 py-2.5 text-sm border-2 border-[#EC69A8] rounded-xl bg-white text-[#38001E] focus:outline-none focus:border-[#9E0059] font-extrabold shadow-inner"
                />
              </div>

              <button
                type="submit"
                disabled={loggingIn}
                className="w-full py-3 rounded-xl hd-gloss-btn text-white font-black text-sm tracking-wide transition-all cursor-pointer"
              >
                {loggingIn ? 'SIGNING IN...' : 'LOGIN TO SYSTEM'}
              </button>
            </form>
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
    <div className="h-screen w-screen overflow-hidden flex bg-[#FDE2EF] text-[#38001E]">
      {/* LEFT SIDEBAR: All Forms + Report Section + Admin Panel */}
      {!fullScreenModule && (
        <aside
          className={`${
            sidebarCollapsed ? 'w-16' : 'w-72'
          } hd-gloss-sidebar text-white flex flex-col border-r-2 border-[#9E0059] transition-all duration-150 shrink-0`}
        >
          {/* Top Brand Header */}
          <div className="p-3.5 border-b border-white/25 flex items-center justify-between bg-[#7A0045]/70">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="truncate">
                  <div className="font-black text-base text-white tracking-tight truncate drop-shadow-xs">
                    BALLY JUTE MILL
                  </div>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 rounded-lg text-white hover:bg-white/20 cursor-pointer"
              title="Collapse / Expand Sidebar"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>

          {/* Primary Mode Switchers at Top of Sidebar */}
          {!sidebarCollapsed && (
            <div className="p-3 border-b border-white/25 space-y-2 bg-[#9E0059]/60">
              <button
                onClick={() => {
                  setReportDeptFilter('all');
                  setViewMode('report');
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  viewMode === 'report'
                    ? 'bg-[#FDE2EF] text-[#38001E] border-2 border-white shadow-md'
                    : 'bg-white/15 hover:bg-white/25 text-white border border-white/30'
                }`}
              >
                <span className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  REPORT SECTION (ALL)
                </span>
                <span
                  className={`text-[10px] font-mono font-black px-1.5 py-0.5 rounded ${
                    viewMode === 'report'
                      ? 'bg-[#9E0059] text-white'
                      : 'bg-[#7A0045] text-[#FDE2EF]'
                  }`}
                >
                  16 Depts
                </span>
              </button>

              <button
                onClick={() => {
                  setAdminTab('users');
                  setViewMode('admin');
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  viewMode === 'admin'
                    ? 'bg-[#FDE2EF] text-[#38001E] border-2 border-white shadow-md'
                    : 'bg-white/15 hover:bg-white/25 text-white border border-white/30'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  ADMIN PANEL &amp; USERS
                </span>
                <span
                  className={`text-[10px] font-mono font-black px-1.5 py-0.5 rounded ${
                    viewMode === 'admin'
                      ? 'bg-[#9E0059] text-white'
                      : 'bg-[#7A0045] text-[#FDE2EF]'
                  }`}
                >
                  DB
                </span>
              </button>
            </div>
          )}

          {/* Search Input for the 16 Forms */}
          {!sidebarCollapsed && (
            <div className="px-3 pt-3 pb-1.5">
              <div className="text-[11px] font-black uppercase tracking-wider text-[#FDE2EF] mb-1.5 flex items-center justify-between">
                <span>ALL DEPARTMENT FORMS ({accessibleModules.length})</span>
              </div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#38001E] absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={sidebarSearch}
                  onChange={(e) => setSidebarSearch(e.target.value)}
                  placeholder="Filter forms 1 to 16..."
                  className="w-full pl-8 pr-2.5 py-1.5 bg-[#FDE2EF] border-2 border-[#F595C3] rounded-lg text-xs font-extrabold text-[#38001E] placeholder-[#9E0059]/70 focus:outline-none focus:border-white"
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
                      ? 'bg-[#FDE2EF] text-[#38001E] font-black border-2 border-white shadow-md'
                      : isCurrentReport
                      ? 'bg-[#F9BCDA] text-[#38001E] font-black border border-white'
                      : 'hover:bg-white/20 text-white font-extrabold'
                  }`}
                >
                  <button
                    onClick={() => {
                      setActiveModuleKey(mod.key);
                      setViewMode('form');
                    }}
                    className="flex-1 flex items-center gap-2 px-3 py-2 text-left text-xs font-black truncate cursor-pointer"
                    title={`Open ${mod.name} Entry Form`}
                  >
                    <FileText
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isCurrentForm || isCurrentReport ? 'text-[#9E0059]' : 'text-[#FDE2EF]'
                      }`}
                    />
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
                      className={`mr-1.5 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider cursor-pointer transition-colors ${
                        isCurrentReport
                          ? 'bg-[#9E0059] text-white'
                          : isCurrentForm
                          ? 'bg-[#C90D6B] text-white hover:bg-[#9E0059]'
                          : 'bg-[#7A0045]/80 hover:bg-[#FDE2EF] hover:text-[#38001E] text-white'
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
              <div className="pt-3 mt-3 border-t border-white/25 space-y-1">
                <div className="px-2 text-[10px] font-black uppercase tracking-wider text-[#FDE2EF]">
                  Admin Panel Shortcuts
                </div>
                <button
                  onClick={() => {
                    setAdminTab('users');
                    setViewMode('admin');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-extrabold text-white hover:bg-white/20 cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5 text-[#FDE2EF]" />
                  <span>Users &amp; Permissions</span>
                </button>
                <button
                  onClick={() => {
                    setAdminTableFilter('');
                    setAdminTab('database');
                    setViewMode('admin');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-extrabold text-white hover:bg-white/20 cursor-pointer"
                >
                  <Database className="w-3.5 h-3.5 text-[#FDE2EF]" />
                  <span>&ldquo;production&rdquo; DB Tables</span>
                </button>
              </div>
            )}
          </div>

          {/* Logged-In User Footer */}
          <div className="p-3 border-t border-white/25 bg-[#7A0045] flex items-center justify-between gap-2">
            {!sidebarCollapsed && (
              <div className="truncate">
                <div className="text-xs font-black text-white truncate">{user.fullName}</div>
                <div className="text-[11px] text-[#FDE2EF] font-mono font-bold truncate">
                  @{user.username} · {user.roleName}
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              title="Logout"
              className="px-3 py-1.5 rounded-lg bg-[#FDE2EF] hover:bg-white text-[#9E0059] text-xs font-black flex items-center gap-1 cursor-pointer shrink-0 shadow-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              {!sidebarCollapsed && <span>Logout</span>}
            </button>
          </div>
        </aside>
      )}

      {/* RIGHT MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar with 8-Plate Glossy Accent & Deep Bold Text */}
        <header className="h-14 bg-gradient-to-r from-[#FFFFFF] via-[#FDE2EF] to-[#F9BCDA] border-b-2 border-[#EC69A8] px-4 flex items-center justify-between gap-3 shrink-0 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <span className="px-3 py-1 rounded-md hd-gloss-btn text-white font-black text-xs tracking-wide">
              {viewMode === 'form'
                ? activeModuleMeta.shortName
                : viewMode === 'report'
                ? 'REPORT SECTION'
                : 'ADMIN PANEL'}
            </span>
            <h2 className="text-base font-black text-[#38001E] truncate">
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
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black cursor-pointer transition-all ${
                viewMode === 'form'
                  ? 'hd-gloss-btn text-white'
                  : 'bg-white border-2 border-[#EC69A8] text-[#38001E] hover:bg-[#F9BCDA]'
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
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black cursor-pointer transition-all ${
                viewMode === 'report'
                  ? 'hd-gloss-btn text-white'
                  : 'bg-white border-2 border-[#EC69A8] text-[#38001E] hover:bg-[#F9BCDA]'
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
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black cursor-pointer transition-all ${
                viewMode === 'admin'
                  ? 'hd-gloss-btn text-white'
                  : 'bg-white border-2 border-[#EC69A8] text-[#38001E] hover:bg-[#F9BCDA]'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Admin Panel
            </button>

            {viewMode === 'form' && (
              <>
                <button
                  onClick={() => setIframeRefreshKey((k) => k + 1)}
                  className="p-1.5 rounded-lg bg-white border-2 border-[#EC69A8] hover:bg-[#F9BCDA] text-[#38001E] cursor-pointer"
                  title="Reload Form"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setFullScreenModule(!fullScreenModule)}
                  className="p-1.5 rounded-lg bg-white border-2 border-[#EC69A8] hover:bg-[#F9BCDA] text-[#38001E] cursor-pointer"
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
          <div className="flex-1 w-full h-full bg-[#FDE2EF] relative">
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
