import React, { useState, useCallback, useEffect, useRef } from 'react';
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
  Eye,
  EyeOff,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { UserSession, EffectivePermission, ModuleMeta } from './types';
import { AdminConsole } from './components/AdminConsole';
import { ReportSection } from './components/ReportSection';
import { ExtendedProductionForms, EXTENDED_FORM_KEYS } from './components/ExtendedProductionForms';

const SESSION_TIMEOUT_MINUTES = 15;
const SESSION_TIMEOUT_MS = SESSION_TIMEOUT_MINUTES * 60 * 1000;

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
  {
    key: 'sacking_finish_departments',
    docIndex: 16,
    name: 'Finish Departments (Sacking)',
    shortName: '17. Finish Depts (Sacking)',
    category: 'Finishing & Packing',
    description: 'Daily Spinning & Weaving Working Hours and Finish Department Mics Register',
    tables: ['finish_departments_daily'],
  },
  {
    key: 'herackle_daily_register',
    docIndex: 17,
    name: 'Herackle Daily Production Register',
    shortName: '18. Herackle Daily',
    category: 'Finishing & Packing',
    description: 'Daily Lapping, Calender, Auto Cutting (x25), Hemming, Herackle, Safety, Hand Sewing & Press Register',
    tables: ['herackle_daily_production'],
  },
  {
    key: 'bag_power_utilities',
    docIndex: 18,
    name: 'Bags, Power & Utilities Register',
    shortName: '19. Bags & Power',
    category: 'Finishing & Packing',
    description: 'Daily J.B. Oil, Coal, Bag Production, Power, Diesel, Power Failure, Waste, Jute, Sale Yarn & Spinning Register',
    tables: ['bag_power_utilities_daily'],
  },
  {
    key: 'hands_power',
    docIndex: 19,
    name: 'Hands & Power Register',
    shortName: '20. Hands & Power',
    category: 'Weaving & Looms',
    description: 'Daily & Month-to-Date Yarn Hands, Mill Hands, C.E.S.C Power, Units/M.T & Weaving/Sewing Production',
    tables: ['hands_power_daily'],
  },
  {
    key: 'yarn_stock_dust',
    docIndex: 20,
    name: 'Yarn Stock & Dust Register',
    shortName: '21. Yarn Stock & Dust',
    category: 'Spinning & Prep',
    description: 'Daily WDG Yarn Stock, Dust to Boiler (with Monthly Cumulative) & Agency Hands Register',
    tables: ['yarn_stock_dust_daily'],
  },
  {
    key: 'winding_production',
    docIndex: 21,
    name: 'Winding Department (Production Book)',
    shortName: '22. Winding Dept',
    category: 'Spinning & Prep',
    description: 'Shift Operations Winding Production Book (WRAP, PRECISION, OTHER) & Winder Master',
    tables: ['winding_shifts', 'winding_production_rows', 'winding_winders'],
  },
];

// Clean Botanical Jute Emblem in Rose Pink & Metallic Gold Ribbon Palette
const JuteEmblem: React.FC<{ className?: string; variant?: 'light' | 'dark' }> = ({
  className = 'w-16 h-16',
  variant = 'light',
}) => {
  const strokeMain = variant === 'dark' ? '#F6D281' : '#C14468';
  const leafDark = variant === 'dark' ? '#FBDDE2' : '#A83256';
  const leafSage = variant === 'dark' ? '#F8C6D0' : '#CB798D';
  const weaveGold = variant === 'dark' ? '#E9C16B' : '#CD9E43';

  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="40" cy="40" r="35" stroke={strokeMain} strokeWidth="2.4" />
      {/* Central jute stem */}
      <path d="M40 54V24" stroke={leafDark} strokeWidth="2.4" strokeLinecap="round" />
      {/* Top center leaf */}
      <path
        d="M40 16C45.5 21.5 46.5 29.5 40 35C33.5 29.5 34.5 21.5 40 16Z"
        fill={leafDark}
      />
      {/* Left leaf */}
      <path
        d="M39 44C30.5 43.5 24 38.5 22 31C29.5 30.5 36.5 35.5 39 44Z"
        fill={leafDark}
      />
      {/* Right leaf */}
      <path
        d="M41 44C49.5 43.5 56 38.5 58 31C50.5 30.5 43.5 35.5 41 44Z"
        fill={leafDark}
      />
      {/* Woven fiber arcs at base */}
      <path
        d="M14 55C23 48.5 35 47 48 51.5C55 54 61 57.5 65 60.5"
        stroke={leafSage}
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M19 63C28.5 56.5 41.5 54.5 54.5 58.5C58.5 59.8 61.5 61.2 64 62.8"
        stroke={weaveGold}
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M28 69C38 60.5 52 54.5 67 52.5"
        stroke={weaveGold}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M17 59.5C27 61 36 65 44 71"
        stroke={leafSage}
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  );
};

const SESSION_STORAGE_KEY = 'bjm_active_session_v1';

interface StoredSessionPayload {
  user: UserSession;
  permissions: EffectivePermission[];
  activeModuleKey: string;
  viewMode: 'form' | 'report' | 'admin';
  lastActivityAt: number;
}

function loadStoredSession(): { session: StoredSessionPayload | null; expired: boolean } {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return { session: null, expired: false };
    const parsed = JSON.parse(raw) as Partial<StoredSessionPayload>;
    if (!parsed || !parsed.user || !parsed.user.id || !parsed.lastActivityAt) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return { session: null, expired: false };
    }
    if (Date.now() - Number(parsed.lastActivityAt) >= SESSION_TIMEOUT_MS) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return { session: null, expired: true };
    }
    return {
      session: {
        user: parsed.user,
        permissions: Array.isArray(parsed.permissions) ? parsed.permissions : [],
        activeModuleKey: parsed.activeModuleKey || 'carding',
        viewMode:
          parsed.viewMode === 'report' || parsed.viewMode === 'admin' ? parsed.viewMode : 'form',
        lastActivityAt: Number(parsed.lastActivityAt),
      },
      expired: false,
    };
  } catch {
    return { session: null, expired: false };
  }
}

function saveStoredSession(payload: StoredSessionPayload) {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore storage quota / privacy mode error
  }
}

function clearStoredSession() {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export default function App() {
  const initialStoredRef = useRef<{ session: StoredSessionPayload | null; expired: boolean } | null>(
    null
  );
  if (initialStoredRef.current === null) {
    initialStoredRef.current = loadStoredSession();
  }
  const initialStored = initialStoredRef.current;

  const [user, setUser] = useState<UserSession | null>(() => initialStored.session?.user || null);
  const [permissions, setPermissions] = useState<EffectivePermission[]>(
    () => initialStored.session?.permissions || []
  );

  // Login Form State
  const [loginUsername, setLoginUsername] = useState(() => {
    try {
      return localStorage.getItem('bjm_remembered_user') || 'admin';
    } catch {
      return 'admin';
    }
  });
  const [loginPassword, setLoginPassword] = useState('admin123');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotHelp, setShowForgotHelp] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  // Main Workspace View Mode: 'form' | 'report' | 'admin'
  const [viewMode, setViewMode] = useState<'form' | 'report' | 'admin'>(
    () => initialStored.session?.viewMode || 'form'
  );
  const [activeModuleKey, setActiveModuleKey] = useState<string>(
    () => initialStored.session?.activeModuleKey || 'carding'
  );
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

  // 15-Minute Session Timeout State & Activity Trackers
  const [sessionExpiredPopup, setSessionExpiredPopup] = useState<string | null>(() =>
    initialStored.expired
      ? `Your session has expired after ${SESSION_TIMEOUT_MINUTES} minutes of inactivity. Please sign in again to continue.`
      : null
  );
  const lastActivityRef = useRef<number>(initialStored.session?.lastActivityAt || Date.now());
  const lastHeartbeatRef = useRef<number>(0);

  // Keep persisted session synced whenever user, permissions, module, or view changes
  useEffect(() => {
    if (!user) return;
    saveStoredSession({
      user,
      permissions,
      activeModuleKey,
      viewMode,
      lastActivityAt: lastActivityRef.current,
    });
  }, [user, permissions, activeModuleKey, viewMode]);

  const expireUserSession = useCallback(
    (customMessage?: string) => {
      const uid = user?.id;
      if (uid) {
        fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: uid }),
        }).catch(() => {});
      }
      clearStoredSession();
      setUser(null);
      setPermissions([]);
      setSessionExpiredPopup(
        customMessage ||
          `Your session has expired after ${SESSION_TIMEOUT_MINUTES} minutes of inactivity. Please sign in again to continue.`
      );
    },
    [user]
  );

  const recordUserActivity = useCallback(() => {
    if (!user) return;
    const now = Date.now();
    lastActivityRef.current = now;
    try {
      const raw = localStorage.getItem(SESSION_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        parsed.lastActivityAt = now;
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(parsed));
      }
    } catch {
      // ignore
    }
    if (now - lastHeartbeatRef.current >= 60000) {
      lastHeartbeatRef.current = now;
      fetch('/api/auth/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data && data.ok === false && data.sessionExpired) {
            expireUserSession(data.error);
          }
        })
        .catch(() => {});
    }
  }, [user, expireUserSession]);

  // Verify restored session against server once on page reload (keeps session alive for 15 min)
  const restoredCheckedRef = useRef(false);
  useEffect(() => {
    if (restoredCheckedRef.current || !initialStored.session?.user?.id) return;
    restoredCheckedRef.current = true;
    const uid = initialStored.session.user.id;
    fetch(`/api/auth/session/${uid}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.ok && data.sessionExpired) {
          expireUserSession(data.error);
          return;
        }
        if (!data.ok && data.maintenance) {
          const msg =
            data.error || 'Server is under maintenance. We will be back shortly.';
          clearStoredSession();
          setMaintenanceActive(true);
          setMaintenanceMessage(msg);
          setUser(null);
          setPermissions([]);
          setMaintenancePopup(msg);
          return;
        }
        if (!data.ok) {
          clearStoredSession();
          setUser(null);
          setPermissions([]);
          return;
        }
        const now = Date.now();
        lastActivityRef.current = now;
        lastHeartbeatRef.current = now;
        setUser(data.user);
        setPermissions(data.permissions || []);
        if (data.maintenance) {
          setMaintenanceActive(Boolean(data.maintenance.active));
          setMaintenanceMessage(
            data.maintenance.message || 'Server is under maintenance. We will be back shortly.'
          );
        }
      })
      .catch(() => {
        // Keep locally restored session if brief network blip during reload
      });
  }, [initialStored, expireUserSession]);

  // Enforce 15-minute inactivity timeout across main portal + all 16 form iframes + browser tabs
  useEffect(() => {
    if (!user) return;
    if (Date.now() - lastActivityRef.current >= SESSION_TIMEOUT_MS) {
      expireUserSession();
      return;
    }

    let throttleTs = 0;
    const onActivity = () => {
      const now = Date.now();
      if (now - throttleTs < 3000) return;
      throttleTs = now;
      recordUserActivity();
    };

    const events: (keyof WindowEventMap)[] = [
      'mousemove',
      'mousedown',
      'keydown',
      'click',
      'scroll',
      'touchstart',
    ];
    events.forEach((ev) => window.addEventListener(ev, onActivity, { passive: true }));

    const checkExpiry = () => {
      try {
        const raw = localStorage.getItem(SESSION_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.lastActivityAt && Number(parsed.lastActivityAt) > lastActivityRef.current) {
            lastActivityRef.current = Number(parsed.lastActivityAt);
          }
        }
      } catch {
        // ignore
      }
      if (Date.now() - lastActivityRef.current >= SESSION_TIMEOUT_MS) {
        expireUserSession();
      }
    };

    const timer = setInterval(checkExpiry, 5000);
    const onResume = () => {
      if (document.visibilityState === 'visible') {
        checkExpiry();
      }
    };
    const onStorage = (ev: StorageEvent) => {
      if (ev.key === SESSION_STORAGE_KEY && !ev.newValue) {
        setUser(null);
        setPermissions([]);
      }
    };
    window.addEventListener('focus', checkExpiry);
    document.addEventListener('visibilitychange', onResume);
    window.addEventListener('storage', onStorage);

    return () => {
      clearInterval(timer);
      events.forEach((ev) => window.removeEventListener(ev, onActivity));
      window.removeEventListener('focus', checkExpiry);
      document.removeEventListener('visibilitychange', onResume);
      window.removeEventListener('storage', onStorage);
    };
  }, [user, recordUserActivity, expireUserSession]);

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
            clearStoredSession();
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
      if (!ev.data) return;
      if (ev.data.type === 'BJM_USER_ACTIVITY') {
        recordUserActivity();
        return;
      }
      if (ev.data.type === 'BJM_SESSION_EXPIRED') {
        expireUserSession(ev.data.message);
        return;
      }
      if (ev.data.type === 'BJM_MAINTENANCE_ACTIVE') {
        const msg =
          ev.data.message || 'Server is under maintenance. We will be back shortly.';
        clearStoredSession();
        setMaintenanceActive(true);
        setMaintenanceMessage(msg);
        setUser(null);
        setPermissions([]);
        setMaintenancePopup(msg);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [recordUserActivity, expireUserSession]);

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
      if (rememberMe) {
        try {
          localStorage.setItem('bjm_remembered_user', usernameVal.trim());
        } catch {
          // ignore storage restriction
        }
      } else {
        try {
          localStorage.removeItem('bjm_remembered_user');
        } catch {
          // ignore
        }
      }

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
      const now = Date.now();
      lastActivityRef.current = now;
      lastHeartbeatRef.current = now;
      setSessionExpiredPopup(null);

      const firstAllowed = (data.permissions || []).find((p: EffectivePermission) => p.canView);
      const nextModuleKey = firstAllowed ? firstAllowed.moduleKey : 'carding';

      saveStoredSession({
        user: data.user,
        permissions: data.permissions || [],
        activeModuleKey: nextModuleKey,
        viewMode: 'form',
        lastActivityAt: now,
      });

      setUser(data.user);
      setPermissions(data.permissions || []);
      setActiveModuleKey(nextModuleKey);
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
      if (!data.ok && data.sessionExpired) {
        expireUserSession(data.error);
        return;
      }
      if (!data.ok && data.maintenance) {
        const msg =
          data.error || 'Server is under maintenance. We will be back shortly.';
        clearStoredSession();
        setMaintenanceActive(true);
        setMaintenanceMessage(msg);
        setUser(null);
        setPermissions([]);
        setMaintenancePopup(msg);
        return;
      }
      if (data.ok) {
        lastActivityRef.current = Date.now();
        setUser(data.user);
        setPermissions(data.permissions || []);
      }
    } catch {
      // ignore
    }
  }, [user, expireUserSession]);

  const handleLogout = () => {
    if (user?.id) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      }).catch(() => {});
    }
    clearStoredSession();
    setUser(null);
    setPermissions([]);
  };

  const sessionExpiredModalNode = sessionExpiredPopup ? (
    <div className="fixed inset-0 z-99999 flex items-center justify-center bg-[#4A1426]/65 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#F1D3DC] overflow-hidden">
        <div className="px-6 py-4 flex items-center gap-3 text-white rose-banner">
          <div className="p-2 rounded-xl bg-white/15">
            <Clock className="w-6 h-6 text-[#F6D281]" />
          </div>
          <div>
            <h3 className="text-base font-bold tracking-wide text-white">
              Session Timed Out
            </h3>
            <p className="text-[11px] text-[#FBDDE2] font-medium">
              {SESSION_TIMEOUT_MINUTES}-Minute Security Timeout
            </p>
          </div>
        </div>
        <div className="p-6 text-center space-y-4">
          <div className="p-4 rounded-xl bg-[#FDF2F5] border border-[#F8C6D0] text-[#3B1A26] text-sm font-bold leading-relaxed">
            {sessionExpiredPopup}
          </div>
          <button
            onClick={() => setSessionExpiredPopup(null)}
            className="w-full py-2.5 rounded-xl gold-ribbon-btn text-xs font-bold tracking-wide cursor-pointer shadow-sm"
          >
            Sign In Again
          </button>
        </div>
      </div>
    </div>
  ) : null;

  const maintenanceModalNode = maintenancePopup ? (
    <div className="fixed inset-0 z-99999 flex items-center justify-center bg-[#4A1426]/65 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#F1D3DC] overflow-hidden">
        <div className="px-6 py-4 flex items-center gap-3 text-white rose-banner">
          <div className="p-2 rounded-xl bg-white/15">
            <AlertTriangle className="w-6 h-6 text-[#F6D281]" />
          </div>
          <div>
            <h3 className="text-base font-bold tracking-wide text-white">
              Server Under Maintenance
            </h3>
            <p className="text-[11px] text-[#FBDDE2] font-medium">
              System Access Temporarily Paused
            </p>
          </div>
        </div>
        <div className="p-6 text-center space-y-4">
          <div className="p-4 rounded-xl bg-[#FDF2F5] border border-[#F8C6D0] text-[#3B1A26] text-sm font-bold leading-relaxed">
            {maintenancePopup}
          </div>
          <p className="text-xs text-[#7A4B5B] font-medium">
            Your active session has been safely logged out while system maintenance is in progress. Please try signing in again shortly.
          </p>
          <button
            onClick={() => setMaintenancePopup(null)}
            className="w-full py-2.5 rounded-xl gold-ribbon-btn text-xs font-bold tracking-wide cursor-pointer shadow-sm"
          >
            OK, Got It
          </button>
        </div>
      </div>
    </div>
  ) : null;

  // ==========================================================================
  // STEP 1: BJCL PRODUCTION PORTAL — ROSE PINK & GOLDEN RIBBON SPLIT LOGIN
  // ==========================================================================
  if (!user) {
    return (
      <div className="h-screen min-h-[580px] w-full flex flex-row items-stretch bg-[#FBF7ED] text-[#3B1A26] overflow-hidden relative">
        {maintenanceModalNode}
        {sessionExpiredModalNode}

        {/* LEFT HERO PANEL: Rose-Tinted Sunlit Jute Mill & Golden Ribbon S-Curve Wave */}
        <div className="hidden min-[540px]:block relative w-[48%] md:w-[52%] h-full overflow-hidden shrink-0 bg-[#F8C6D0]">
          {/* Signature Vertical Metallic Gold Ribbon Trim on Left Edge */}
          <div
            aria-hidden="true"
            className="absolute inset-y-0 left-0 w-1.5 z-20 gold-ribbon-bar pointer-events-none"
          />

          {!heroImgFailed ? (
            <>
              <img
                src="/assets/aistudio/Jute_Production_Login___19_Nov_2026__2.57_pm_45c1c5bc.png"
                alt="BJCL sustainable jute fiber production floor"
                referrerPolicy="no-referrer"
                onError={() => setHeroImgFailed(true)}
                style={{ width: '194%', maxWidth: 'none' }}
                className="h-full object-cover object-left select-none pointer-events-none"
              />
              {/* Harmonious Pink Shades & Golden Sunlight Wash Over Hero Artwork */}
              <div
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(193, 68, 104, 0.28) 0%, rgba(203, 121, 141, 0.22) 38%, rgba(235, 172, 172, 0.16) 70%, rgba(205, 158, 67, 0.22) 100%)',
                  mixBlendMode: 'multiply',
                }}
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(251, 221, 226, 0.26) 0%, rgba(248, 198, 208, 0.08) 50%, rgba(143, 43, 75, 0.20) 100%)',
                }}
              />
            </>
          ) : (
            <div
              className="w-full h-full flex flex-col justify-center px-10 lg:px-14 py-12"
              style={{
                background:
                  'linear-gradient(145deg, #FBDDE2 0%, #F8C6D0 32%, #EBACAC 64%, #CB798D 100%)',
              }}
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-[#6E1D38] leading-tight max-w-md">
                Sustainable fiber.
                <br />
                Stronger tomorrow.
              </h2>
              <div className="w-20 h-1 gold-ribbon-bar rounded-full my-5" />
              <p className="text-sm lg:text-base text-[#5C1F34] font-medium">
                Smart production. Responsible growth.
              </p>
            </div>
          )}

          {/* Seamless Organic S-Curve Wave with Metallic Golden Ribbon Contour */}
          <svg
            viewBox="0 0 120 1000"
            preserveAspectRatio="none"
            aria-hidden="true"
            className="absolute inset-y-0 right-0 h-full w-16 md:w-24 lg:w-28 pointer-events-none select-none z-10"
          >
            <defs>
              <linearGradient id="goldWaveRibbon" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#CC9D42" />
                <stop offset="30%" stopColor="#F6D281" />
                <stop offset="55%" stopColor="#E2B760" />
                <stop offset="80%" stopColor="#F6D281" />
                <stop offset="100%" stopColor="#CD9E43" />
              </linearGradient>
            </defs>
            <path
              d="M18,0 C62,100 68,215 96,325 C120,420 120,530 90,640 C66,735 58,845 30,945 C20,978 8,994 0,1000 L120,1000 L120,0 Z"
              fill="#FBF7ED"
            />
            <path
              d="M18,0 C62,100 68,215 96,325 C120,420 120,530 90,640 C66,735 58,845 30,945 C20,978 8,994 0,1000"
              fill="none"
              stroke="url(#goldWaveRibbon)"
              strokeWidth="4.5"
            />
          </svg>
        </div>

        {/* RIGHT LOGIN PANEL: Warm Cream Canvas with Petal Pink Accents & Golden Ribbon Card */}
        <div className="relative flex-1 h-full flex items-center justify-center px-4 sm:px-6 md:px-10 lg:px-14 py-6 bg-[#FBF7ED] overflow-y-auto">
          {/* Decorative Subtle Rose Dot Matrix & Translucent Petal Leaf Accents */}
          <div
            aria-hidden="true"
            className="hidden sm:block absolute top-8 right-10 w-32 h-24 rose-dot-pattern opacity-80 pointer-events-none"
          />
          <div
            aria-hidden="true"
            className="hidden sm:block absolute bottom-10 left-3 w-28 h-20 rose-dot-pattern opacity-80 pointer-events-none"
          />
          <svg
            aria-hidden="true"
            viewBox="0 0 220 260"
            fill="none"
            className="hidden md:block absolute top-0 right-0 w-48 h-56 text-[#FBDDE2] opacity-90 pointer-events-none select-none"
          >
            <path
              d="M210 10C140 30 95 95 95 170C155 155 205 105 210 10Z"
              fill="currentColor"
            />
            <path
              d="M210 10C170 72 132 122 95 170"
              stroke="#EBACAC"
              strokeWidth="2"
            />
          </svg>
          <svg
            aria-hidden="true"
            viewBox="0 0 220 240"
            fill="none"
            className="hidden md:block absolute bottom-0 right-4 w-52 h-56 text-[#F8C6D0] opacity-75 pointer-events-none select-none"
          >
            <path
              d="M195 20C125 65 92 145 108 235C172 200 212 120 195 20Z"
              fill="currentColor"
            />
            <path
              d="M195 20C158 98 130 165 108 235"
              stroke="#EBACAC"
              strokeWidth="2"
            />
          </svg>

          {/* Crisp Floating White Login Card with Signature Metallic Golden Ribbon */}
          <div className="relative z-10 w-full max-w-[440px] bg-[#FFFFFF] rounded-[22px] border border-[#F1D3DC] shadow-[0_24px_60px_-15px_rgba(193,68,104,0.16)] overflow-hidden">
            {/* Top 5-Shade Rose Ribbon + Metallic Gold Ribbon Accent */}
            <div className="flex h-1.5 w-full" aria-hidden="true">
              <span className="flex-1 bg-[#C14468]" />
              <span className="flex-1 bg-[#CB798D]" />
              <span className="flex-1 bg-[#EBACAC]" />
              <span className="flex-1 bg-[#F8C6D0]" />
              <span className="flex-1 bg-[#FBDDE2]" />
            </div>
            <div className="h-[4px] w-full gold-ribbon-bar" aria-hidden="true" />

            <div className="px-6 sm:px-8 lg:px-10 py-8 sm:py-9 lg:py-10">
              {/* Botanical Jute Emblem & Title */}
              <div className="flex flex-col items-center text-center">
                <JuteEmblem className="w-[68px] h-[68px] mb-4" variant="light" />
                <h1 className="text-[22px] sm:text-[25px] font-bold text-[#8F2B4B] tracking-tight leading-snug">
                  BJCL Production Portal
                </h1>

                {/* Signature Metallic Gold Ribbon Hairline & Center Dot Divider */}
                <div className="flex items-center justify-center gap-3 w-full max-w-[140px] mt-3.5 mb-1">
                  <span className="h-[2px] flex-1 gold-ribbon-bar rounded-full" />
                  <span className="w-2 h-2 rounded-full bg-[#CD9E43] ring-2 ring-[#F6D281]/60" />
                  <span className="h-[2px] flex-1 gold-ribbon-bar rounded-full" />
                </div>
              </div>

              {maintenanceActive && (
                <div className="mt-4 p-3 rounded-xl bg-[#FDF2F5] border border-[#EBACAC] text-left flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-[#C14468] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-[#8F2B4B]">
                      Server Under Maintenance
                    </div>
                    <div className="text-[11px] font-medium text-[#7A4B5B] mt-0.5">
                      {maintenanceMessage}
                    </div>
                  </div>
                </div>
              )}

              {loginError && (
                <div className="mt-4 p-3 rounded-xl bg-[#FDF0F3] border border-[#C14468]/40 text-xs font-semibold text-[#9E2447] text-left">
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
                  <label
                    htmlFor="bjm-login-username"
                    className="block text-[13px] font-bold text-[#542134] mb-1.5"
                  >
                    Email or username
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-[#CB798D] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="bjm-login-username"
                      type="text"
                      required
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      placeholder="Email or username"
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-[#F1D3DC] rounded-xl bg-[#FFFDF9] text-[#3B1A26] placeholder-[#B48A97] focus:outline-none focus:bg-white focus:border-[#C14468] focus:ring-2 focus:ring-[#E2B760]/30 font-medium transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="bjm-login-password"
                    className="block text-[13px] font-bold text-[#542134] mb-1.5"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#CB798D] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="bjm-login-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full pl-10 pr-11 py-2.5 text-sm border border-[#F1D3DC] rounded-xl bg-[#FFFDF9] text-[#3B1A26] placeholder-[#B48A97] focus:outline-none focus:bg-white focus:border-[#C14468] focus:ring-2 focus:ring-[#E2B760]/30 font-medium transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#CB798D] hover:text-[#C14468] cursor-pointer transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="inline-flex items-center gap-2.5 text-[13px] font-medium text-[#5C2B3D] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-[17px] h-[17px] rounded border-[#EBACAC] accent-[#C14468] cursor-pointer"
                    />
                    Remember me
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loggingIn}
                  className="relative w-full py-3 px-4 rounded-xl gold-ribbon-btn text-white font-semibold text-sm tracking-wide cursor-pointer flex items-center justify-center disabled:opacity-60 mt-2"
                >
                  <span>{loggingIn ? 'Signing in...' : 'Sign in'}</span>
                  <ArrowRight className="w-4 h-4 absolute right-4" />
                </button>
              </form>

              {/* Footer Forgot Password Link */}
              <div className="mt-5 pt-1">
                <button
                  type="button"
                  onClick={() => setShowForgotHelp((prev) => !prev)}
                  className="inline-flex items-center gap-2.5 text-xs font-semibold text-[#A84364] hover:text-[#8F2B4B] cursor-pointer transition-colors"
                >
                  <span className="w-7 h-7 rounded-full bg-[#FDF2F5] border border-[#F8C6D0] flex items-center justify-center text-[#C14468]">
                    <Lock className="w-3.5 h-3.5" />
                  </span>
                  Forgot password?
                </button>

                {showForgotHelp && (
                  <div className="mt-3 p-3 rounded-xl bg-[#FDF2F5] border border-[#F8C6D0] text-xs text-[#6B2D42] leading-relaxed">
                    Password resets are managed by the BJCL ERP Administrator in the Admin Panel. Please contact your Shift Supervisor or System Admin.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // STEP 2: MAIN APP — BOTANICAL FOREST GREEN & GOLDEN JUTE THEME
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
    <div className="h-screen w-screen overflow-hidden flex bg-[#FBF7ED] text-[#3B1A26]">
      {/* LEFT SIDEBAR: Deep Rose Pink Shades + Metallic Golden Ribbon Accent */}
      {!fullScreenModule && (
        <aside
          className={`${
            sidebarCollapsed ? 'w-16' : 'w-68'
          } rose-sidebar flex flex-col transition-all duration-150 shrink-0`}
        >
          {/* Top Brand Header */}
          <div className="h-14 px-3.5 border-b border-[#E2B760]/35 flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2.5 overflow-hidden">
                <JuteEmblem className="w-7 h-7 shrink-0" variant="dark" />
                <div className="truncate">
                  <div className="font-bold text-sm text-white tracking-wide truncate">
                    BALLY JUTE MILL
                  </div>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 rounded-lg text-[#FBDDE2] hover:text-white hover:bg-white/15 cursor-pointer"
              title="Collapse / Expand Sidebar"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>

          {/* Primary Mode Switchers at Top of Sidebar */}
          {!sidebarCollapsed && (
            <div className="p-3 border-b border-[#E2B760]/30 space-y-2">
              <button
                onClick={() => {
                  setReportDeptFilter('all');
                  setViewMode('report');
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer ${
                  viewMode === 'report'
                    ? 'rose-active-pill'
                    : 'bg-white/10 hover:bg-white/18 text-[#FDECEF] border border-[#F8C6D0]/25'
                }`}
              >
                <span className="flex items-center gap-2 whitespace-nowrap">
                  <BarChart3
                    className={`w-3.5 h-3.5 ${
                      viewMode === 'report' ? 'text-[#5C1A31]' : 'text-[#F6D281]'
                    }`}
                  />
                  REPORT SECTION (ALL)
                </span>
                <span
                  className={`text-[10px] font-mono font-bold ${
                    viewMode === 'report' ? 'text-[#5C1A31]' : 'text-[#F6D281]'
                  }`}
                >
                  {ALL_MODULES.length} Depts
                </span>
              </button>

              <button
                onClick={() => {
                  setAdminTab('users');
                  setViewMode('admin');
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer ${
                  viewMode === 'admin'
                    ? 'rose-active-pill'
                    : 'bg-white/10 hover:bg-white/18 text-[#FDECEF] border border-[#F8C6D0]/25'
                }`}
              >
                <span className="flex items-center gap-2 whitespace-nowrap">
                  <Shield
                    className={`w-3.5 h-3.5 ${
                      viewMode === 'admin' ? 'text-[#5C1A31]' : 'text-[#F8C6D0]'
                    }`}
                  />
                  ADMIN PANEL &amp; USERS
                </span>
                <span
                  className={`text-[10px] font-mono font-bold ${
                    viewMode === 'admin' ? 'text-[#5C1A31]' : 'text-[#F6D281]'
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
              <div className="text-[11px] font-semibold tracking-wide text-[#FBDDE2] mb-1.5 flex items-center justify-between">
                <span>Department Forms ({accessibleModules.length})</span>
              </div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#F8C6D0] absolute left-2.5 top-2" />
                <input
                  type="text"
                  value={sidebarSearch}
                  onChange={(e) => setSidebarSearch(e.target.value)}
                  placeholder={`Filter forms 1 to ${ALL_MODULES.length}...`}
                  className="w-full pl-8 pr-2.5 py-1.5 bg-[#6E1B37]/80 border border-[#F8C6D0]/30 rounded-lg text-xs font-medium text-white placeholder-[#F8C6D0]/75 focus:outline-none focus:border-[#F6D281]"
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
                      ? 'rose-active-pill font-bold'
                      : 'hover:bg-white/12 text-[#FDECEF] hover:text-white font-medium'
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
                        isCurrentForm ? 'text-[#5C1A31]' : 'text-[#F8C6D0] group-hover:text-[#F6D281]'
                      }`}
                    />
                    {!sidebarCollapsed && <span className="truncate">{mod.shortName}</span>}
                  </button>
                </div>
              );
            })}

            {/* Quick Admin Sub-links at Bottom of Scroll */}
            {!sidebarCollapsed && (
              <div className="pt-3 mt-3 border-t border-[#E2B760]/30 space-y-1">
                <div className="px-2 text-[11px] font-semibold text-[#F6D281]">
                  Admin Shortcuts
                </div>
                <button
                  onClick={() => {
                    setAdminTab('users');
                    setViewMode('admin');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-[#FBDDE2] hover:text-white hover:bg-white/12 cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5 text-[#F6D281]" />
                  <span>Users &amp; Permissions</span>
                </button>
                <button
                  onClick={() => {
                    setAdminTableFilter('');
                    setAdminTab('database');
                    setViewMode('admin');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-[#FBDDE2] hover:text-white hover:bg-white/12 cursor-pointer"
                >
                  <Database className="w-3.5 h-3.5 text-[#F6D281]" />
                  <span>&ldquo;production&rdquo; DB Tables</span>
                </button>
              </div>
            )}
          </div>

          {/* Logged-In User Footer */}
          <div className="p-3 border-t border-[#E2B760]/35 bg-[#6A1B35] flex items-center justify-between gap-2">
            {!sidebarCollapsed && (
              <div className="truncate">
                <div className="text-xs font-bold text-white truncate">{user.fullName}</div>
                <div className="text-[11px] text-[#F6D281] font-mono truncate">
                  @{user.username} · {user.roleName}
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              title="Logout"
              className="px-3 py-1.5 rounded-lg bg-[#C14468] hover:bg-[#A63556] border border-[#F6D281]/50 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors shadow-xs whitespace-nowrap"
            >
              <LogOut className="w-3.5 h-3.5 text-[#F6D281]" />
              {!sidebarCollapsed && <span>Logout</span>}
            </button>
          </div>
        </aside>
      )}

      {/* RIGHT MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Crisp White Header Bar with Signature Metallic Golden Ribbon Underside */}
        <header className="relative h-14 bg-white px-4 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xs font-bold text-[#C14468] whitespace-nowrap shrink-0">
              {viewMode === 'form'
                ? activeModuleMeta.shortName
                : viewMode === 'report'
                ? 'Report Section'
                : 'Admin Panel'}
            </span>
            <span className="text-[#EBACAC]" aria-hidden="true">
              /
            </span>
            <h2 className="text-sm font-bold text-[#3B1A26] truncate">
              {viewMode === 'form'
                ? activeModuleMeta.name
                : viewMode === 'report'
                ? 'Master Production, Table & Field Reports (Database: production)'
                : 'User Permissions, Roles & Database Control'}
            </h2>
          </div>

          {/* Top Bar Action Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setViewMode('form')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all whitespace-nowrap shrink-0 ${
                viewMode === 'form'
                  ? 'bg-[#C14468] text-white shadow-xs'
                  : 'bg-white border border-[#F1D3DC] text-[#8F2B4B] hover:bg-[#FDF2F5]'
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
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all whitespace-nowrap shrink-0 ${
                viewMode === 'report'
                  ? 'bg-[#C14468] text-white shadow-xs'
                  : 'bg-[#FDF6E7] border border-[#E2B760] text-[#9A6F1E] hover:bg-[#FAF0D6]'
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
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all whitespace-nowrap shrink-0 ${
                viewMode === 'admin'
                  ? 'bg-[#C14468] text-white shadow-xs'
                  : 'bg-white border border-[#F1D3DC] text-[#8F2B4B] hover:bg-[#FDF2F5]'
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
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all whitespace-nowrap shrink-0 ${
                  maintenanceActive
                    ? 'bg-[#B8294B] hover:bg-[#991F3C] text-white shadow-xs'
                    : 'bg-[#FDF2F5] border border-[#F8C6D0] text-[#8F2B4B] hover:bg-[#FBDDE2]'
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
                  className="p-1.5 rounded-lg bg-white border border-[#F1D3DC] hover:bg-[#FDF2F5] text-[#C14468] cursor-pointer shrink-0"
                  title="Reload Form"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setFullScreenModule(!fullScreenModule)}
                  className="p-1.5 rounded-lg bg-white border border-[#F1D3DC] hover:bg-[#FDF2F5] text-[#C14468] cursor-pointer shrink-0"
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

          {/* Signature Metallic Golden Ribbon Strip Beneath Top Bar */}
          <div
            aria-hidden="true"
            className="absolute bottom-0 inset-x-0 h-[3px] gold-ribbon-bar pointer-events-none"
          />
        </header>

        {/* Active Maintenance Banner for Admin */}
        {maintenanceActive && isCurrentUserAdmin && (
          <div className="bg-[#9E2447] text-white px-4 py-1.5 text-xs font-bold flex items-center justify-between border-b border-[#E2B760]">
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-[#F6D281]" />
              MAINTENANCE MODE IS ACTIVE: All non-admin users are logged out and blocked ({maintenanceMessage})
            </span>
            <button
              onClick={() => handleToggleMaintenance(false)}
              className="px-2.5 py-0.5 rounded bg-white text-[#9E2447] text-[11px] font-bold hover:bg-[#FDF2F5] cursor-pointer whitespace-nowrap"
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
        ) : EXTENDED_FORM_KEYS.has(activeModuleMeta.key) ? (
          <div className="flex-1 w-full h-full bg-[#FBF7ED] overflow-y-auto">
            <ExtendedProductionForms
              key={`${activeModuleMeta.key}-${user.id}-${iframeRefreshKey}`}
              moduleKey={activeModuleMeta.key}
              userId={user.id}
              permission={permissions.find((p) => p.moduleKey === activeModuleMeta.key)}
              onSessionExpired={(msg) => expireUserSession(msg)}
              onMaintenanceActive={(msg) => {
                const m = msg || 'Server is under maintenance. We will be back shortly.';
                clearStoredSession();
                setMaintenanceActive(true);
                setMaintenanceMessage(m);
                setUser(null);
                setPermissions([]);
                setMaintenancePopup(m);
              }}
            />
          </div>
        ) : (
          <div className="flex-1 w-full h-full bg-[#FBF7ED] relative">
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
