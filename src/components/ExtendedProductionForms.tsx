import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Save,
  RotateCcw,
  Trash2,
  Download,
  Printer,
  Plus,
  Copy,
  X,
  FileText,
  BarChart3,
  Users,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Edit3,
} from 'lucide-react';
import { EffectivePermission } from '../types';

export const EXTENDED_FORM_KEYS = new Set([
  'sacking_finish_departments',
  'herackle_daily_register',
  'bag_power_utilities',
  'hands_power',
  'yarn_stock_dust',
  'winding_production',
]);

interface ExtendedFormsProps {
  moduleKey: string;
  userId: number;
  permission?: EffectivePermission;
  onSessionExpired?: (msg?: string) => void;
  onMaintenanceActive?: (msg?: string) => void;
}

/* ============================================================================
   SHARED UTILITIES & RPC BRIDGE (Connected directly to "production" DB)
   ============================================================================ */
function todayISO(): string {
  const t = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())}`;
}

function fmtDMY(iso: string): string {
  if (!iso || iso.length < 10) return iso || '–';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}-${m}-${y}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function fmtShort(iso: string): string {
  if (!iso || iso.length < 10) return iso || '–';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d} ${MONTHS[Math.max(0, Number(m) - 1)] || m} ${y}`;
}

function inRange(d: string, from: string, to: string): boolean {
  if (from && d < from) return false;
  if (to && d > to) return false;
  return true;
}

function hasVal(v: any): boolean {
  return v !== '' && v !== null && v !== undefined && !Number.isNaN(Number(v));
}

function numVal(v: any): number {
  const n = parseFloat(String(v ?? ''));
  return Number.isFinite(n) ? n : 0;
}

function fnum(v: number | null | undefined, decimals = 0): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return '–';
  return Number(v.toFixed(decimals)).toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function downloadCSV(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function useModuleRpc(
  moduleKey: string,
  userId: number,
  onSessionExpired?: (msg?: string) => void,
  onMaintenanceActive?: (msg?: string) => void
) {
  return useCallback(
    async (fnName: string, payload?: any) => {
      const res = await fetch(`/api/rpc/${moduleKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fnName,
          args: payload !== undefined ? [payload] : [],
          userId,
        }),
      });
      const data = await res.json();
      if (!data || data.ok === false) {
        if (data?.sessionExpired && onSessionExpired) {
          onSessionExpired(data.error);
        }
        if (data?.maintenance && onMaintenanceActive) {
          onMaintenanceActive(data.error);
        }
        throw new Error(data?.error || 'Request failed');
      }
      return data.result;
    },
    [moduleKey, userId, onSessionExpired, onMaintenanceActive]
  );
}

/* ============================================================================
   UNIFIED ROSE PINK & METALLIC GOLDEN RIBBON FORM PRIMITIVES
   ============================================================================ */
interface ToastState {
  msg: string;
  isError?: boolean;
}

const ToastBanner: React.FC<{ toast: ToastState | null }> = ({ toast }) => {
  if (!toast) return null;
  return (
    <div
      className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-bold transition-all ${
        toast.isError
          ? 'bg-[#FDF0F3] border-[#E9B0BF] text-[#931D3A]'
          : 'bg-[#FDF6E7] border-[#E2B760] text-[#6B213B]'
      }`}
    >
      {toast.isError ? (
        <AlertCircle className="w-4 h-4 text-[#B8294B] shrink-0" />
      ) : (
        <CheckCircle2 className="w-4 h-4 text-[#CC9D42] shrink-0" />
      )}
      <span>{toast.msg}</span>
    </div>
  );
};

const FormHeaderBanner: React.FC<{
  title: string;
  subtitle?: string;
  tabs: { id: string; label: string; icon?: React.ReactNode }[];
  activeTab: string;
  onSelectTab: (id: string) => void;
}> = ({ title, subtitle, tabs, activeTab, onSelectTab }) => (
  <div className="rose-banner px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b-[3px] border-[#E2B760] shadow-xs">
    <div>
      <h1 className="text-lg font-bold text-white tracking-tight leading-snug">{title}</h1>
      {subtitle && <p className="text-xs text-[#FBDDE2] mt-0.5">{subtitle}</p>}
    </div>
    <nav className="flex flex-wrap items-center gap-2">
      {tabs.map((t) => {
        const active = activeTab === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelectTab(t.id)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              active
                ? 'bg-gradient-to-r from-[#CC9D42] via-[#E2B760] to-[#F6D281] text-[#4A1426] shadow-sm'
                : 'bg-white/12 text-[#FBDDE2] hover:bg-white/20 hover:text-white border border-white/15'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        );
      })}
    </nav>
  </div>
);

const RegisterEntryBar: React.FC<{
  date: string;
  onDate: (d: string) => void;
  exists: boolean;
  saving?: boolean;
  canCreate: boolean;
  canDelete: boolean;
  onSave: () => void;
  onClear: () => void;
  onDelete: () => void;
}> = ({ date, onDate, exists, saving, canCreate, canDelete, onSave, onClear, onDelete }) => {
  const [confirmDel, setConfirmDel] = useState(false);

  useEffect(() => {
    setConfirmDel(false);
  }, [date, exists]);

  return (
    <div className="bg-white rounded-xl border border-[#F1D3DC] shadow-[0_4px_18px_-6px_rgba(143,43,75,0.08)] p-4 mb-5 flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-bold text-[#542134] mb-1.5">Entry Date</label>
          <div className="relative">
            <Calendar className="w-3.5 h-3.5 text-[#CB798D] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="date"
              value={date}
              onChange={(e) => onDate(e.target.value)}
              className="pl-9 pr-3 py-2 text-sm border border-[#ECC5D0] rounded-lg bg-[#FFFDF9] text-[#3B1A26] font-medium focus:outline-none focus:bg-white focus:border-[#C14468] focus:ring-2 focus:ring-[#E2B760]/30"
            />
          </div>
        </div>
        <span
          className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold border ${
            exists
              ? 'bg-[#FDF6E7] border-[#E2B760] text-[#8C6418]'
              : 'bg-[#FDF2F5] border-[#F1D3DC] text-[#8F2B4B]'
          }`}
        >
          {exists ? 'Saved Record (Editing)' : 'New Date Entry'}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {exists && canDelete && (
          confirmDel ? (
            <div className="inline-flex items-center gap-1.5 bg-[#FDF0F3] border border-[#E9B0BF] px-2.5 py-1 rounded-lg">
              <span className="text-xs font-bold text-[#931D3A]">Confirm delete?</span>
              <button
                type="button"
                onClick={() => {
                  setConfirmDel(false);
                  onDelete();
                }}
                className="px-2.5 py-1 rounded-md bg-[#B8294B] hover:bg-[#931D3A] text-white text-xs font-bold cursor-pointer"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setConfirmDel(false)}
                className="px-2 py-1 rounded-md bg-white border border-[#ECC5D0] text-[#8F2B4B] text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDel(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#FDF0F3] hover:bg-[#FBDDE2] border border-[#E9B0BF] text-[#B8294B] text-xs font-bold cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          )
        )}

        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#FDF2F5] hover:bg-[#FBDDE2] border border-[#ECC5D0] text-[#8F2B4B] text-xs font-bold cursor-pointer transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Clear
        </button>

        <button
          type="button"
          onClick={onSave}
          disabled={saving || !canCreate}
          className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg gold-ribbon-btn text-white text-xs font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          <Save className="w-3.5 h-3.5" />
          {saving ? 'Saving...' : exists ? 'Update Entry' : 'Save Entry'}
        </button>
      </div>
    </div>
  );
};

const RegisterRangeBar: React.FC<{
  from: string;
  to: string;
  setFrom: (v: string) => void;
  setTo: (v: string) => void;
  children?: React.ReactNode;
}> = ({ from, to, setFrom, setTo, children }) => (
  <div className="bg-white rounded-xl border border-[#F1D3DC] shadow-[0_4px_18px_-6px_rgba(143,43,75,0.08)] p-4 mb-5 flex flex-wrap items-end justify-between gap-4">
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-xs font-bold text-[#542134] mb-1">From Date</label>
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="px-3 py-2 text-xs border border-[#ECC5D0] rounded-lg bg-[#FFFDF9] text-[#3B1A26] focus:outline-none focus:border-[#C14468]"
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-[#542134] mb-1">To Date</label>
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="px-3 py-2 text-xs border border-[#ECC5D0] rounded-lg bg-[#FFFDF9] text-[#3B1A26] focus:outline-none focus:border-[#C14468]"
        />
      </div>
      {(from || to) && (
        <button
          type="button"
          onClick={() => {
            setFrom('');
            setTo('');
          }}
          className="px-3 py-2 rounded-lg bg-[#FDF2F5] hover:bg-[#FBDDE2] border border-[#ECC5D0] text-[#8F2B4B] text-xs font-bold cursor-pointer"
        >
          Show All
        </button>
      )}
    </div>
    <div className="flex flex-wrap items-center gap-2">{children}</div>
  </div>
);

const RoseCard: React.FC<{
  title: string;
  unit?: string;
  children: React.ReactNode;
}> = ({ title, unit, children }) => (
  <div className="bg-white rounded-xl border border-[#F1D3DC] shadow-[0_4px_18px_-6px_rgba(143,43,75,0.08)] overflow-hidden flex flex-col">
    <div className="px-4 py-2.5 bg-[#FDF2F5] border-b border-[#F1D3DC] flex items-center justify-between gap-2">
      <h3 className="text-sm font-bold text-[#8F2B4B] leading-tight">{title}</h3>
      {unit && (
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#FDF6E7] border border-[#E2B760] text-[#8C6418] shrink-0">
          {unit}
        </span>
      )}
    </div>
    <div className="p-4 flex-1">{children}</div>
  </div>
);

const NumericField: React.FC<{
  label: string;
  value: string;
  onChange?: (v: string) => void;
  readOnly?: boolean;
  step?: string;
}> = ({ label, value, onChange, readOnly, step = 'any' }) => (
  <div>
    <label className="block text-[11px] font-bold text-[#542134] mb-1 truncate" title={label}>
      {label}
    </label>
    <input
      type={readOnly ? 'text' : 'number'}
      step={readOnly ? undefined : step}
      readOnly={readOnly}
      value={value}
      placeholder={readOnly ? 'Auto' : '0'}
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      className={`w-full px-3 py-2 text-sm rounded-lg border transition-all ${
        readOnly
          ? 'bg-[#FDF6E7] border-[#EBD49E] text-[#7A4B18] font-bold cursor-default focus:outline-none'
          : 'bg-[#FFFDF9] border-[#ECC5D0] text-[#3B1A26] font-medium focus:outline-none focus:bg-white focus:border-[#C14468] focus:ring-2 focus:ring-[#E2B760]/30'
      }`}
    />
  </div>
);

const SummaryTiles: React.FC<{ items: [string, string | number][] }> = ({ items }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
    {items.map(([label, val]) => (
      <div
        key={label}
        className="bg-white rounded-xl border border-[#F1D3DC] border-t-[3px] border-t-[#E2B760] p-3.5 shadow-xs"
      >
        <div className="text-[11px] font-semibold text-[#7A4B5B]">{label}</div>
        <div className="text-xl font-bold text-[#8F2B4B] mt-1">{val}</div>
      </div>
    ))}
  </div>
);

/* ============================================================================
   FORM 17 (Form 1 · Finish Departments / Sacking) -> finish_departments_daily
   ============================================================================ */
const FINISH_GROUPS = [
  { name: 'Spinning Working Hours', prefix: 'spinning_hrs', hrs: true },
  { name: 'Weaving Working Hours', prefix: 'weaving_hrs', hrs: true },
  { name: 'Lapping (Mics)', prefix: 'lapping_mics', hrs: false },
  { name: 'Calender (Mics)', prefix: 'calender_mics', hrs: false },
  { name: 'Cutting (Mics)', prefix: 'cutting_mics', hrs: false },
  { name: 'Hemming (Mics)', prefix: 'hemming_mics', hrs: false },
  { name: 'Herackle (Mics)', prefix: 'herackle_mics', hrs: false },
  { name: 'Union (Mics)', prefix: 'union_mics', hrs: false },
  { name: 'Hand Sewn (Mics)', prefix: 'hand_sewn_mics', hrs: false },
  { name: 'Press (Mics)', prefix: 'press_mics', hrs: false },
  { name: 'Damping (Mics)', prefix: 'damping_mics', hrs: false },
] as const;

const FINISH_KEYS = FINISH_GROUPS.flatMap((g) => [`${g.prefix}_a`, `${g.prefix}_b`, `${g.prefix}_c`]);
const FINISH_EMPTY: Record<string, string> = Object.fromEntries(FINISH_KEYS.map((k) => [k, '']));

const FinishDepartmentsForm: React.FC<{
  callRpc: (fn: string, p?: any) => Promise<any>;
  canCreate: boolean;
  canDelete: boolean;
  canReport: boolean;
}> = ({ callRpc, canCreate, canDelete, canReport }) => {
  const [tab, setTab] = useState<'entry' | 'report'>('entry');
  const [date, setDate] = useState(todayISO);
  const [dbMap, setDbMap] = useState<Record<string, Record<string, any>>>({});
  const [form, setForm] = useState<Record<string, string>>(FINISH_EMPTY);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const notify = (msg: string, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 3200);
  };

  const loadAll = useCallback(async () => {
    try {
      const res = await callRpc('getAll');
      const map: Record<string, Record<string, any>> = {};
      (res?.rows || []).forEach((row: any) => {
        map[row.entry_date] = row;
      });
      setDbMap(map);
    } catch (e: any) {
      notify(e.message || 'Failed to load records', true);
    }
  }, [callRpc]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    const rec = dbMap[date];
    if (rec) {
      const next: Record<string, string> = {};
      FINISH_KEYS.forEach((k) => {
        next[k] = rec[k] === null || rec[k] === undefined ? '' : String(rec[k]);
      });
      setForm(next);
    } else {
      setForm({ ...FINISH_EMPTY });
    }
  }, [date, dbMap]);

  const exists = Boolean(dbMap[date]);
  const r2 = (x: number) => +x.toFixed(2);

  const handleSave = async () => {
    if (!date) return notify('Please select a date', true);
    setSaving(true);
    try {
      await callRpc('saveEntry', { entry_date: date, ...form });
      await loadAll();
      notify(`Saved Finish Departments entry for ${fmtShort(date)}`);
    } catch (e: any) {
      notify(e.message || 'Save failed', true);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await callRpc('deleteEntry', { entry_date: date });
      await loadAll();
      setForm({ ...FINISH_EMPTY });
      notify(`Deleted entry for ${fmtShort(date)}`);
    } catch (e: any) {
      notify(e.message || 'Delete failed', true);
    }
  };

  const days = useMemo(() => Object.keys(dbMap).sort().filter((d) => inRange(d, from, to)), [dbMap, from, to]);

  const colTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    FINISH_KEYS.forEach((k) => {
      totals[k] = r2(days.reduce((acc, d) => acc + numVal(dbMap[d]?.[k]), 0));
    });
    return totals;
  }, [days, dbMap]);

  const groupSum = (prefix: string) =>
    r2((colTotals[`${prefix}_a`] || 0) + (colTotals[`${prefix}_b`] || 0) + (colTotals[`${prefix}_c`] || 0));

  const exportCSV = () => {
    const head = ['Date'];
    FINISH_GROUPS.forEach((g) => {
      ['A', 'B', 'C'].forEach((s) => head.push(`${g.name} ${s}`));
      if (g.hrs) head.push(`${g.name} Actual`);
    });
    const lines = [head.join(',')];
    days.forEach((d) => {
      const rec = dbMap[d] || {};
      const row: (string | number)[] = [fmtShort(d)];
      FINISH_GROUPS.forEach((g) => {
        let s = 0;
        ['a', 'b', 'c'].forEach((k) => {
          const val = rec[`${g.prefix}_${k}`];
          row.push(val ?? '');
          s += numVal(val);
        });
        if (g.hrs) row.push(r2(s));
      });
      lines.push(row.join(','));
    });
    downloadCSV('finish_departments_report.csv', lines.join('\n'));
  };

  const tabs = [
    { id: 'entry', label: 'Data Entry', icon: <FileText className="w-3.5 h-3.5" /> },
    ...(canReport ? [{ id: 'report', label: 'Register Table', icon: <BarChart3 className="w-3.5 h-3.5" /> }] : []),
  ];

  return (
    <div className="min-h-full bg-[#FBF7ED]">
      <FormHeaderBanner
        title="Form 1 · Finish Departments (Sacking)"
        subtitle="Spinning & Weaving Working Hours and Finish Department Mics Register"
        tabs={tabs}
        activeTab={tab}
        onSelectTab={(id) => setTab(id as 'entry' | 'report')}
      />
      <div className="p-5 max-w-[1520px] mx-auto">
        {tab === 'entry' ? (
          <>
            <RegisterEntryBar
              date={date}
              onDate={setDate}
              exists={exists}
              saving={saving}
              canCreate={canCreate}
              canDelete={canDelete}
              onSave={handleSave}
              onClear={() => setForm({ ...FINISH_EMPTY })}
              onDelete={handleDelete}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {FINISH_GROUPS.map((g) => {
                const actual = r2(
                  numVal(form[`${g.prefix}_a`]) +
                    numVal(form[`${g.prefix}_b`]) +
                    numVal(form[`${g.prefix}_c`])
                );
                return (
                  <RoseCard
                    key={g.prefix}
                    title={g.name.replace(/ \(.*\)/, '')}
                    unit={g.hrs ? 'Hours' : 'Mics'}
                  >
                    <div className="grid grid-cols-3 gap-2.5">
                      {(['a', 'b', 'c'] as const).map((s) => (
                        <NumericField
                          key={s}
                          label={`Shift ${s.toUpperCase()}`}
                          value={form[`${g.prefix}_${s}`] || ''}
                          onChange={(v) => setForm((prev) => ({ ...prev, [`${g.prefix}_${s}`]: v }))}
                        />
                      ))}
                    </div>
                    {g.hrs && (
                      <div className="mt-3 pt-2.5 border-t border-[#F1D3DC] flex items-center justify-between text-xs">
                        <span className="font-bold text-[#7A4B5B]">Actual Total Hours</span>
                        <span className="px-2.5 py-1 rounded-md bg-[#FDF6E7] border border-[#E2B760] text-[#8C6418] font-bold">
                          {actual}
                        </span>
                      </div>
                    )}
                  </RoseCard>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <RegisterRangeBar from={from} to={to} setFrom={setFrom} setTo={setTo}>
              <button
                type="button"
                onClick={exportCSV}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#FDF2F5] hover:bg-[#FBDDE2] border border-[#ECC5D0] text-[#8F2B4B] text-xs font-bold cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#C14468] hover:bg-[#9E3053] text-white text-xs font-bold cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Print
              </button>
            </RegisterRangeBar>

            <SummaryTiles
              items={[
                ['Days Recorded', days.length],
                ['Spinning Hours', +groupSum('spinning_hrs').toFixed(1)],
                ['Weaving Hours', +groupSum('weaving_hrs').toFixed(1)],
                ['Cutting (Mics)', +groupSum('cutting_mics').toFixed(1)],
                ['Press (Mics)', +groupSum('press_mics').toFixed(1)],
              ]}
            />

            <div className="bg-white rounded-xl border border-[#F1D3DC] shadow-xs overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FDF2F5] text-[#8F2B4B] border-b border-[#F1D3DC]">
                    <th rowSpan={2} className="px-3 py-2.5 text-left font-bold border-r border-[#F1D3DC] whitespace-nowrap">
                      DATE
                    </th>
                    {FINISH_GROUPS.map((g) => (
                      <th
                        key={g.prefix}
                        colSpan={g.hrs ? 4 : 3}
                        className="px-2 py-2 text-center font-bold border-r border-[#F1D3DC] whitespace-nowrap"
                      >
                        {g.name}
                      </th>
                    ))}
                    <th rowSpan={2} className="px-3 py-2 text-center font-bold">
                      Edit
                    </th>
                  </tr>
                  <tr className="bg-[#FDF2F5] text-[#8F2B4B] border-b-2 border-[#E2B760]">
                    {FINISH_GROUPS.map((g) =>
                      ['A', 'B', 'C', ...(g.hrs ? ['Actual'] : [])].map((lbl) => (
                        <th key={`${g.prefix}_${lbl}`} className="px-2 py-1.5 text-center font-bold border-r border-[#F1D3DC]">
                          {lbl}
                        </th>
                      ))
                    )}
                  </tr>
                </thead>
                <tbody>
                  {days.length ? (
                    days.map((d) => {
                      const rec = dbMap[d] || {};
                      return (
                        <tr key={d} className="border-b border-[#F5E1E7] hover:bg-[#FFF8FA]">
                          <td className="px-3 py-2 font-semibold text-[#3B1A26] border-r border-[#F5E1E7] whitespace-nowrap">
                            {fmtShort(d)}
                          </td>
                          {FINISH_GROUPS.map((g) => {
                            const sA = rec[`${g.prefix}_a`];
                            const sB = rec[`${g.prefix}_b`];
                            const sC = rec[`${g.prefix}_c`];
                            const act = r2(numVal(sA) + numVal(sB) + numVal(sC));
                            return (
                              <React.Fragment key={g.prefix}>
                                {[sA, sB, sC].map((val, idx) => (
                                  <td key={idx} className="px-2 py-2 text-center border-r border-[#F5E1E7]">
                                    {val === null || val === undefined || val === '' ? '–' : val}
                                  </td>
                                ))}
                                {g.hrs && (
                                  <td className="px-2 py-2 text-center font-bold bg-[#FDF6E7] text-[#8C6418] border-r border-[#F5E1E7]">
                                    {act}
                                  </td>
                                )}
                              </React.Fragment>
                            );
                          })}
                          <td className="px-3 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setDate(d);
                                setTab('entry');
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#FDF2F5] hover:bg-[#FBDDE2] text-[#8F2B4B] font-bold cursor-pointer"
                            >
                              <Edit3 className="w-3 h-3" />
                              Edit
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={40} className="px-4 py-10 text-center text-[#7A4B5B] font-medium">
                        No entries recorded yet. Save one from the Data Entry tab.
                      </td>
                    </tr>
                  )}
                </tbody>
                {days.length > 0 && (
                  <tfoot>
                    <tr className="bg-[#FDF6E7] text-[#6B213B] font-bold border-t-2 border-[#E2B760]">
                      <td className="px-3 py-2.5 border-r border-[#EBD49E]">TOTAL</td>
                      {FINISH_GROUPS.map((g) => (
                        <React.Fragment key={g.prefix}>
                          {(['a', 'b', 'c'] as const).map((k) => {
                            const v = colTotals[`${g.prefix}_${k}`];
                            return (
                              <td key={k} className="px-2 py-2.5 text-center border-r border-[#EBD49E]">
                                {v ? r2(v) : '–'}
                              </td>
                            );
                          })}
                          {g.hrs && (
                            <td className="px-2 py-2.5 text-center border-r border-[#EBD49E]">
                              {groupSum(g.prefix) ? r2(groupSum(g.prefix)) : '–'}
                            </td>
                          )}
                        </React.Fragment>
                      ))}
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </>
        )}
      </div>
      <ToastBanner toast={toast} />
    </div>
  );
};

/* ============================================================================
   FORM 18 (Form 2 · Herackle Daily Register) -> herackle_daily_production
   ============================================================================ */
const HERACKLE_SECTIONS = [
  { id: 'lapping', name: 'Lapping Production', unit: 'Qty', single: true, colSingle: 'lapping_qty' },
  { id: 'calender', name: 'Calender Production', unit: 'Qty', single: true, colSingle: 'calender_qty' },
  { id: 'cutting', name: 'Cutting (X25)', unit: 'Pcs', autoFrom: 'hemming', factor: 25 },
  { id: 'hemming', name: 'Hemming', unit: 'Bundles' },
  { id: 'herackle', name: 'Herackle', unit: 'Bundles' },
  { id: 'safety', name: 'Safety', unit: 'Bundles' },
  { id: 'hand_sewing', name: 'Hand Sewing', unit: 'Bundles' },
  { id: 'press', name: 'Press', unit: 'B/S' },
] as const;

const HERACKLE_INPUT_KEYS = [
  'lapping_qty',
  'calender_qty',
  'hemming_a', 'hemming_b', 'hemming_c',
  'herackle_a', 'herackle_b', 'herackle_c',
  'safety_a', 'safety_b', 'safety_c',
  'hand_sewing_a', 'hand_sewing_b', 'hand_sewing_c',
  'press_a', 'press_b', 'press_c',
];
const HERACKLE_EMPTY: Record<string, string> = Object.fromEntries(HERACKLE_INPUT_KEYS.map((k) => [k, '']));

const HerackleDailyForm: React.FC<{
  callRpc: (fn: string, p?: any) => Promise<any>;
  canCreate: boolean;
  canDelete: boolean;
  canReport: boolean;
}> = ({ callRpc, canCreate, canDelete, canReport }) => {
  const [tab, setTab] = useState<'entry' | 'report'>('entry');
  const [date, setDate] = useState(todayISO);
  const [dbMap, setDbMap] = useState<Record<string, Record<string, any>>>({});
  const [form, setForm] = useState<Record<string, string>>(HERACKLE_EMPTY);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const notify = (msg: string, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 3200);
  };

  const loadAll = useCallback(async () => {
    try {
      const res = await callRpc('getAll');
      const map: Record<string, Record<string, any>> = {};
      (res?.rows || []).forEach((row: any) => {
        map[row.entry_date] = row;
      });
      setDbMap(map);
    } catch (e: any) {
      notify(e.message || 'Failed to load entries', true);
    }
  }, [callRpc]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    const rec = dbMap[date];
    if (rec) {
      const next: Record<string, string> = {};
      HERACKLE_INPUT_KEYS.forEach((k) => {
        next[k] = rec[k] === null || rec[k] === undefined ? '' : String(rec[k]);
      });
      setForm(next);
    } else {
      setForm({ ...HERACKLE_EMPTY });
    }
  }, [date, dbMap]);

  const exists = Boolean(dbMap[date]);
  const days = useMemo(() => Object.keys(dbMap).sort().filter((d) => inRange(d, from, to)), [dbMap, from, to]);

  const autoCut = (shift: 'a' | 'b' | 'c') => {
    const raw = form[`hemming_${shift}`];
    return hasVal(raw) ? String(+(Number(raw) * 25).toFixed(4)) : '';
  };

  const handleSave = async () => {
    if (!date) return notify('Please select a date', true);
    setSaving(true);
    try {
      await callRpc('saveEntry', { entry_date: date, ...form });
      await loadAll();
      notify(`Saved Herackle Daily Production for ${fmtDMY(date)}`);
    } catch (e: any) {
      notify(e.message || 'Save failed', true);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await callRpc('deleteEntry', { entry_date: date });
      await loadAll();
      setForm({ ...HERACKLE_EMPTY });
      notify(`Deleted entry for ${fmtDMY(date)}`);
    } catch (e: any) {
      notify(e.message || 'Delete failed', true);
    }
  };

  const cellVal = (v: any) => (v === null || v === undefined || v === '' ? '–' : (+Number(v).toFixed(2)).toLocaleString());

  const exportCsv = () => {
    const head = [
      'Date',
      ...HERACKLE_SECTIONS.flatMap((s) =>
        'single' in s && s.single ? [s.name] : ['A', 'B', 'C'].map((l) => `${s.name} ${l}`)
      ),
    ];
    const lines = [head.map((h) => `"${h}"`).join(',')];
    days.forEach((d) => {
      const rec = dbMap[d] || {};
      const row = [
        fmtDMY(d),
        ...HERACKLE_SECTIONS.flatMap((s) =>
          'single' in s && s.single
            ? [rec[s.colSingle] ?? '']
            : (['a', 'b', 'c'] as const).map((l) => {
                if ('autoFrom' in s && s.autoFrom) {
                  return rec[`${s.autoFrom}_${l}`] != null ? +(Number(rec[`${s.autoFrom}_${l}`]) * s.factor).toFixed(4) : '';
                }
                return rec[`${s.id}_${l}`] ?? '';
              })
        ),
      ];
      lines.push(row.join(','));
    });
    downloadCSV('herackle_daily_production.csv', lines.join('\n'));
  };

  const tabs = [
    { id: 'entry', label: 'Data Entry', icon: <FileText className="w-3.5 h-3.5" /> },
    ...(canReport ? [{ id: 'report', label: 'Register Table', icon: <BarChart3 className="w-3.5 h-3.5" /> }] : []),
  ];

  return (
    <div className="min-h-full bg-[#FBF7ED]">
      <FormHeaderBanner
        title="Form 2 · Herackle Daily Production"
        subtitle="Lapping, Calender, Auto Cutting (×25 Hemming), Hemming, Herackle, Safety, Hand Sewing & Press"
        tabs={tabs}
        activeTab={tab}
        onSelectTab={(id) => setTab(id as 'entry' | 'report')}
      />
      <div className="p-5 max-w-[1520px] mx-auto">
        {tab === 'entry' ? (
          <>
            <RegisterEntryBar
              date={date}
              onDate={setDate}
              exists={exists}
              saving={saving}
              canCreate={canCreate}
              canDelete={canDelete}
              onSave={handleSave}
              onClear={() => setForm({ ...HERACKLE_EMPTY })}
              onDelete={handleDelete}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {HERACKLE_SECTIONS.map((s) => {
                const isSingle = 'single' in s && s.single;
                const isAuto = 'autoFrom' in s && Boolean(s.autoFrom);
                return (
                  <RoseCard key={s.id} title={s.name} unit={s.unit}>
                    {isSingle ? (
                      <NumericField
                        label="Total"
                        value={form[s.colSingle] || ''}
                        onChange={(v) => setForm((prev) => ({ ...prev, [s.colSingle]: v }))}
                      />
                    ) : (
                      <div className="grid grid-cols-3 gap-2.5">
                        {(['a', 'b', 'c'] as const).map((l) =>
                          isAuto ? (
                            <NumericField key={l} label={`Shift ${l.toUpperCase()}`} readOnly value={autoCut(l)} />
                          ) : (
                            <NumericField
                              key={l}
                              label={`Shift ${l.toUpperCase()}`}
                              value={form[`${s.id}_${l}`] || ''}
                              onChange={(v) => setForm((prev) => ({ ...prev, [`${s.id}_${l}`]: v }))}
                            />
                          )
                        )}
                      </div>
                    )}
                    {isAuto && (
                      <p className="text-[11px] text-[#8C6418] font-semibold mt-2">
                        Auto-calculated = 25 × Hemming
                      </p>
                    )}
                  </RoseCard>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <RegisterRangeBar from={from} to={to} setFrom={setFrom} setTo={setTo}>
              <button
                type="button"
                onClick={exportCsv}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#FDF2F5] hover:bg-[#FBDDE2] border border-[#ECC5D0] text-[#8F2B4B] text-xs font-bold cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>
            </RegisterRangeBar>

            <div className="bg-white rounded-xl border border-[#F1D3DC] shadow-xs overflow-x-auto">
              {!days.length ? (
                <p className="p-10 text-center text-xs font-medium text-[#7A4B5B]">No entries in this date range.</p>
              ) : (
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#FDF2F5] text-[#8F2B4B] border-b border-[#F1D3DC]">
                      <th rowSpan={2} className="px-3 py-2.5 text-left font-bold border-r border-[#F1D3DC]">
                        Date
                      </th>
                      {HERACKLE_SECTIONS.map((s) =>
                        'single' in s && s.single ? (
                          <th key={s.id} rowSpan={2} className="px-3 py-2 text-center font-bold border-r border-[#F1D3DC]">
                            {s.name}
                          </th>
                        ) : (
                          <th key={s.id} colSpan={3} className="px-2 py-2 text-center font-bold border-r border-[#F1D3DC]">
                            {s.name} ({s.unit})
                          </th>
                        )
                      )}
                    </tr>
                    <tr className="bg-[#FDF2F5] text-[#8F2B4B] border-b-2 border-[#E2B760]">
                      {HERACKLE_SECTIONS.filter((s) => !('single' in s && s.single)).flatMap((s) =>
                        ['A', 'B', 'C'].map((l) => (
                          <th key={`${s.id}_${l}`} className="px-2 py-1.5 text-center font-bold border-r border-[#F1D3DC]">
                            {l}
                          </th>
                        ))
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {days.map((d) => {
                      const rec = dbMap[d] || {};
                      return (
                        <tr key={d} className="border-b border-[#F5E1E7] hover:bg-[#FFF8FA]">
                          <td className="px-3 py-2 font-semibold whitespace-nowrap border-r border-[#F5E1E7]">
                            <span>{fmtDMY(d)}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setDate(d);
                                setTab('entry');
                              }}
                              className="ml-2 text-[#C14468] hover:text-[#8F2B4B] cursor-pointer"
                              title="Edit Date"
                            >
                              <Edit3 className="w-3 h-3 inline" />
                            </button>
                          </td>
                          {HERACKLE_SECTIONS.map((s) =>
                            'single' in s && s.single ? (
                              <td key={s.id} className="px-2 py-2 text-center border-r border-[#F5E1E7]">
                                {cellVal(rec[s.colSingle])}
                              </td>
                            ) : (
                              (['a', 'b', 'c'] as const).map((l) => {
                                const val =
                                  'autoFrom' in s && s.autoFrom && rec[`${s.autoFrom}_${l}`] != null
                                    ? Number(rec[`${s.autoFrom}_${l}`]) * s.factor
                                    : rec[`${s.id}_${l}`];
                                return (
                                  <td key={`${s.id}_${l}`} className="px-2 py-2 text-center border-r border-[#F5E1E7]">
                                    {cellVal(val)}
                                  </td>
                                );
                              })
                            )
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[#FDF6E7] text-[#6B213B] font-bold border-t-2 border-[#E2B760]">
                      <td className="px-3 py-2.5 border-r border-[#EBD49E]">Total</td>
                      {HERACKLE_SECTIONS.map((s) =>
                        'single' in s && s.single ? (
                          <td key={s.id} className="px-2 py-2.5 text-center border-r border-[#EBD49E]">
                            {cellVal(days.reduce((a, d) => a + numVal(dbMap[d]?.[s.colSingle]), 0))}
                          </td>
                        ) : (
                          (['a', 'b', 'c'] as const).map((l) => {
                            const total = days.reduce((a, d) => {
                              const rec = dbMap[d] || {};
                              const val =
                                'autoFrom' in s && s.autoFrom && rec[`${s.autoFrom}_${l}`] != null
                                  ? Number(rec[`${s.autoFrom}_${l}`]) * s.factor
                                  : numVal(rec[`${s.id}_${l}`]);
                              return a + val;
                            }, 0);
                            return (
                              <td key={`${s.id}_${l}`} className="px-2 py-2.5 text-center border-r border-[#EBD49E]">
                                {cellVal(total)}
                              </td>
                            );
                          })
                        )
                      )}
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </>
        )}
      </div>
      <ToastBanner toast={toast} />
    </div>
  );
};

/* ============================================================================
   FORM 19 (Form 3 · Bags, Power & Utilities) -> bag_power_utilities_daily
   ============================================================================ */
const BAG_GROUPS: { t: string; u: string; f: [string, string][] }[] = [
  { t: 'J.B. Oil', u: 'Ltr', f: [['jbo_r', 'Receipt'], ['jbo_i', 'Issue']] },
  { t: 'Coal', u: 'Kg', f: [['coal_r', 'Receipt'], ['coal_i', 'Issue']] },
  { t: 'Bag Production', u: 'Nos', f: [['bags', 'Total']] },
  { t: 'Power Consumption', u: 'Units', f: [['cesc', 'C.E.S.C.'], ['dg', 'D.G.']] },
  { t: 'Diesel', u: 'Ltr', f: [['dsl_r', 'Receipt'], ['dsl_i', 'Issue']] },
  { t: 'Power Failure', u: '', f: [['pf_freq', 'Frequency'], ['pf_dur', 'Duration (hrs)']] },
  { t: 'Thread Waste & Gunny Cutting', u: 'M.Ton', f: [['tw_gen', 'Generation'], ['tw_con', 'Consumption']] },
  { t: 'Jute Received', u: '', f: [['j_lorry', 'Lorry'], ['j_mt', 'M.Ton']] },
  { t: 'Sale Yarn', u: 'M.Ton', f: [['sale', 'Total']] },
  { t: 'Worker Line Power Consumption', u: 'Units', f: [['wl', 'Total']] },
  { t: 'Spinning Production', u: 'M.Ton', f: [['spin', 'Total']] },
];
const BAG_KEYS = BAG_GROUPS.flatMap((g) => g.f.map((x) => x[0]));
const BAG_EMPTY: Record<string, string> = Object.fromEntries(BAG_KEYS.map((k) => [k, '']));

const BagPowerUtilitiesForm: React.FC<{
  callRpc: (fn: string, p?: any) => Promise<any>;
  canCreate: boolean;
  canDelete: boolean;
  canReport: boolean;
}> = ({ callRpc, canCreate, canDelete, canReport }) => {
  const [tab, setTab] = useState<'entry' | 'report'>('entry');
  const [date, setDate] = useState(todayISO);
  const [dbMap, setDbMap] = useState<Record<string, Record<string, any>>>({});
  const [form, setForm] = useState<Record<string, string>>(BAG_EMPTY);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const notify = (msg: string, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 3200);
  };

  const loadAll = useCallback(async () => {
    try {
      const res = await callRpc('getAll');
      const map: Record<string, Record<string, any>> = {};
      (res?.rows || []).forEach((row: any) => {
        map[row.entry_date] = row;
      });
      setDbMap(map);
    } catch (e: any) {
      notify(e.message || 'Failed to load records', true);
    }
  }, [callRpc]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    const rec = dbMap[date];
    if (rec) {
      const next: Record<string, string> = {};
      BAG_KEYS.forEach((k) => {
        next[k] = rec[k] === null || rec[k] === undefined ? '' : String(rec[k]);
      });
      setForm(next);
    } else {
      setForm({ ...BAG_EMPTY });
    }
  }, [date, dbMap]);

  const exists = Boolean(dbMap[date]);
  const days = useMemo(() => Object.keys(dbMap).sort().filter((d) => inRange(d, from, to)), [dbMap, from, to]);

  const handleSave = async () => {
    if (!date) return notify('Please select a date', true);
    setSaving(true);
    try {
      await callRpc('saveEntry', { entry_date: date, ...form });
      await loadAll();
      notify(`Saved Bags, Power & Utilities entry for ${fmtDMY(date)}`);
    } catch (e: any) {
      notify(e.message || 'Save failed', true);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await callRpc('deleteEntry', { entry_date: date });
      await loadAll();
      setForm({ ...BAG_EMPTY });
      notify(`Deleted entry for ${fmtDMY(date)}`);
    } catch (e: any) {
      notify(e.message || 'Delete failed', true);
    }
  };

  const tabs = [
    { id: 'entry', label: 'Data Entry', icon: <FileText className="w-3.5 h-3.5" /> },
    ...(canReport ? [{ id: 'report', label: 'Register Table', icon: <BarChart3 className="w-3.5 h-3.5" /> }] : []),
  ];

  return (
    <div className="min-h-full bg-[#FBF7ED]">
      <FormHeaderBanner
        title="Form 3 · Bags, Power & Utilities"
        subtitle="J.B. Oil, Coal, Bag Production, Power, Diesel, Power Failure, Waste, Jute Received, Sale Yarn & Spinning"
        tabs={tabs}
        activeTab={tab}
        onSelectTab={(id) => setTab(id as 'entry' | 'report')}
      />
      <div className="p-5 max-w-[1520px] mx-auto">
        {tab === 'entry' ? (
          <>
            <RegisterEntryBar
              date={date}
              onDate={setDate}
              exists={exists}
              saving={saving}
              canCreate={canCreate}
              canDelete={canDelete}
              onSave={handleSave}
              onClear={() => setForm({ ...BAG_EMPTY })}
              onDelete={handleDelete}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {BAG_GROUPS.map((g) => (
                <RoseCard key={g.t} title={g.t} unit={g.u || undefined}>
                  <div className={`grid gap-3 ${g.f.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {g.f.map(([k, label]) => (
                      <NumericField
                        key={k}
                        label={label}
                        value={form[k] || ''}
                        onChange={(v) => setForm((prev) => ({ ...prev, [k]: v }))}
                      />
                    ))}
                  </div>
                </RoseCard>
              ))}
            </div>
          </>
        ) : (
          <>
            <RegisterRangeBar from={from} to={to} setFrom={setFrom} setTo={setTo} />
            <div className="bg-white rounded-xl border border-[#F1D3DC] shadow-xs overflow-x-auto">
              {days.length ? (
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#FDF2F5] text-[#8F2B4B] border-b-2 border-[#E2B760]">
                      <th className="px-3 py-2.5 text-left font-bold whitespace-nowrap border-r border-[#F1D3DC]">
                        Date
                      </th>
                      {BAG_GROUPS.map((g) =>
                        g.f.map(([k, l]) => (
                          <th key={k} className="px-2.5 py-2.5 text-center font-bold whitespace-nowrap border-r border-[#F1D3DC]">
                            {g.t} – {l}
                          </th>
                        ))
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {days.map((d) => (
                      <tr
                        key={d}
                        onClick={() => {
                          setDate(d);
                          setTab('entry');
                        }}
                        className="border-b border-[#F5E1E7] hover:bg-[#FFF8FA] cursor-pointer"
                      >
                        <td className="px-3 py-2 font-semibold whitespace-nowrap border-r border-[#F5E1E7]">
                          {fmtDMY(d)}
                        </td>
                        {BAG_KEYS.map((k) => (
                          <td key={k} className="px-2.5 py-2 text-center border-r border-[#F5E1E7]">
                            {dbMap[d]?.[k] ?? '–'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[#FDF6E7] text-[#6B213B] font-bold border-t-2 border-[#E2B760]">
                      <td className="px-3 py-2.5 border-r border-[#EBD49E]">Total</td>
                      {BAG_KEYS.map((k) => (
                        <td key={k} className="px-2.5 py-2.5 text-center border-r border-[#EBD49E]">
                          {+days.reduce((a, d) => a + numVal(dbMap[d]?.[k]), 0).toFixed(3)}
                        </td>
                      ))}
                    </tr>
                  </tfoot>
                </table>
              ) : (
                <p className="p-10 text-center text-xs font-medium text-[#7A4B5B]">
                  No entries yet. Save one from Data Entry.
                </p>
              )}
            </div>
          </>
        )}
      </div>
      <ToastBanner toast={toast} />
    </div>
  );
};

/* ============================================================================
   FORM 20 (Form 4 · Hands & Power) -> hands_power_daily
   ============================================================================ */
const HAND_X = 18;
const POWER_X = 225;
const HP_INPUTS = ['yarn', 'mill', 'cesc', 'wv', 'sw'] as const;
const HP_EMPTY: Record<string, string> = { yarn: '', mill: '', cesc: '', wv: '', sw: '' };

const HP_CARDS: [string, string, [string, string, 'i' | 'a', string | number][]][] = [
  [
    'Yarn from Ambica & Others',
    'M.Ton',
    [
      ['yarn', 'M.Ton', 'i', '0.001'],
      ['ag', 'No. of Hands (×18)', 'a', 0],
      ['my', 'Total M.T.D. (M.Ton)', 'a', 3],
      ['ma', 'Total M.T.D. (Hands)', 'a', 0],
    ],
  ],
  [
    'Hands',
    'Nos',
    [
      ['mill', 'Mill Hands', 'i', '1'],
      ['th', 'Total Hands', 'a', 0],
      ['hpm', 'Hands / M.T', 'a', 2],
      ['mh', 'M.T.D. Hands', 'a', 0],
      ['mhpm', 'M.T.D. Hands / M.T', 'a', 2],
      ['dg', 'Yarn Power (×225)', 'a', 0],
      ['mdg', 'Yarn MTD Power', 'a', 0],
    ],
  ],
  [
    'Power',
    'Units',
    [
      ['cesc', 'C.E.S.C', 'i', '1'],
      ['tp', 'Total', 'a', 0],
      ['upm', 'Units / M.T', 'a', 0],
      ['mp', 'M.T.D. Power', 'a', 0],
      ['mupm', 'M.T.D. Units / M.T', 'a', 0],
    ],
  ],
  [
    'Weaving Production',
    'M.Ton',
    [
      ['wv', 'To-day', 'i', '0.001'],
      ['sw', 'Sewing Production', 'i', '0.001'],
      ['mw', 'Total M.T.D.', 'a', 3],
    ],
  ],
];

const HP_GROUPS: [string, number][] = [
  ['Yarn from Ambica & Others (M.Ton)', 4],
  ['Hands', 7],
  ['Power', 5],
  ['Weaving Production', 3],
];
const HP_HEADS = [
  'M.Ton', 'No. of Hands', 'Total M.T.D. M.Ton', 'Total M.T.D. Hands',
  'Mill Hands', 'Total Hands', 'Hands / M.T', 'M.T.D. Hands', 'M.T.D. Hands / M.T', 'Yarn Power', 'Yarn MTD Power',
  'C.E.S.C', 'Total', 'Units / M.T', 'M.T.D. Power', 'M.T.D. Units / M.T',
  'To-day', 'Sewing', 'Total M.T.D.',
];

function calcHandsPowerMonth(
  db: Record<string, Record<string, number>>,
  month: string,
  override?: { d: string; e: Record<string, number> }
) {
  const m: Record<string, Record<string, number>> = { ...db };
  if (override) m[override.d] = override.e;
  const c = { y: 0, a: 0, h: 0, dg: 0, p: 0, w: 0 };
  return Object.keys(m)
    .filter((d) => d.startsWith(month))
    .sort()
    .map((d) => {
      const e = m[d];
      const ag = Math.round((e.yarn || 0) * HAND_X);
      const dg = Math.round((e.yarn || 0) * POWER_X);
      const th = (e.mill || 0) + ag;
      const tp = (e.cesc || 0) + dg;
      c.y += e.yarn || 0;
      c.a += ag;
      c.h += th;
      c.dg += dg;
      c.p += tp;
      c.w += e.wv || 0;
      return {
        d,
        e,
        ag,
        dg,
        th,
        tp,
        my: c.y,
        ma: c.a,
        mh: c.h,
        mdg: c.dg,
        mp: c.p,
        mw: c.w,
        hpm: e.wv > 0 ? th / e.wv : null,
        mhpm: c.w > 0 ? c.h / c.w : null,
        upm: e.wv > 0 ? tp / e.wv : null,
        mupm: c.w > 0 ? c.p / c.w : null,
      };
    });
}

const HandsPowerForm: React.FC<{
  callRpc: (fn: string, p?: any) => Promise<any>;
  canCreate: boolean;
  canDelete: boolean;
  canReport: boolean;
}> = ({ callRpc, canCreate, canDelete, canReport }) => {
  const [tab, setTab] = useState<'entry' | 'report'>('entry');
  const [date, setDate] = useState(todayISO);
  const [month, setMonth] = useState(() => todayISO().slice(0, 7));
  const [dbMap, setDbMap] = useState<Record<string, Record<string, number>>>({});
  const [form, setForm] = useState<Record<string, string>>(HP_EMPTY);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const notify = (msg: string, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 3200);
  };

  const loadAll = useCallback(async () => {
    try {
      const res = await callRpc('getAll');
      const map: Record<string, Record<string, number>> = {};
      (res?.rows || []).forEach((row: any) => {
        map[row.entry_date] = {
          yarn: numVal(row.yarn),
          mill: numVal(row.mill),
          cesc: numVal(row.cesc),
          wv: numVal(row.wv),
          sw: numVal(row.sw),
        };
      });
      setDbMap(map);
    } catch (e: any) {
      notify(e.message || 'Failed to load records', true);
    }
  }, [callRpc]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    const rec = dbMap[date];
    if (rec) {
      setForm({
        yarn: String(rec.yarn ?? ''),
        mill: String(rec.mill ?? ''),
        cesc: String(rec.cesc ?? ''),
        wv: String(rec.wv ?? ''),
        sw: String(rec.sw ?? ''),
      });
    } else {
      setForm({ ...HP_EMPTY });
    }
  }, [date, dbMap]);

  const draftNums = useMemo(
    () => Object.fromEntries(HP_INPUTS.map((k) => [k, numVal(form[k])])),
    [form]
  );

  const live = useMemo(() => {
    if (!date) return null;
    return calcHandsPowerMonth(dbMap, date.slice(0, 7), { d: date, e: draftNums }).find((x) => x.d === date) || null;
  }, [dbMap, date, draftNums]);

  const recentDates = useMemo(() => Object.keys(dbMap).sort().slice(-7).reverse(), [dbMap]);
  const monthRows = useMemo(() => calcHandsPowerMonth(dbMap, month), [dbMap, month]);

  const exists = Boolean(dbMap[date]);

  const handleSave = async () => {
    if (!date) return notify('Please select a date', true);
    setSaving(true);
    try {
      await callRpc('saveEntry', { entry_date: date, ...draftNums });
      await loadAll();
      notify(`Saved Hands & Power entry for ${fmtShort(date)}`);
    } catch (e: any) {
      notify(e.message || 'Save failed', true);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await callRpc('deleteEntry', { entry_date: date });
      await loadAll();
      setForm({ ...HP_EMPTY });
      notify(`Deleted entry for ${fmtShort(date)}`);
    } catch (e: any) {
      notify(e.message || 'Delete failed', true);
    }
  };

  const tabs = [
    { id: 'entry', label: 'Data Entry', icon: <FileText className="w-3.5 h-3.5" /> },
    ...(canReport ? [{ id: 'report', label: 'Monthly Register', icon: <BarChart3 className="w-3.5 h-3.5" /> }] : []),
  ];

  return (
    <div className="min-h-full bg-[#FBF7ED]">
      <FormHeaderBanner
        title="Form 4 · Hands & Power"
        subtitle="Yarn Hands (×18), Yarn Power (×225), C.E.S.C, Units/M.T & Month-to-Date Register"
        tabs={tabs}
        activeTab={tab}
        onSelectTab={(id) => setTab(id as 'entry' | 'report')}
      />
      <div className="p-5 max-w-[1520px] mx-auto">
        {tab === 'entry' ? (
          <>
            <RegisterEntryBar
              date={date}
              onDate={setDate}
              exists={exists}
              saving={saving}
              canCreate={canCreate}
              canDelete={canDelete}
              onSave={handleSave}
              onClear={() => setForm({ ...HP_EMPTY })}
              onDelete={handleDelete}
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
              {HP_CARDS.map(([title, unit, fields]) => (
                <RoseCard key={title} title={title} unit={unit}>
                  <div className="grid grid-cols-2 gap-3">
                    {fields.map(([id, label, kind, s]) =>
                      kind === 'i' ? (
                        <NumericField
                          key={id}
                          label={label}
                          step={String(s)}
                          value={form[id] || ''}
                          onChange={(v) => setForm((prev) => ({ ...prev, [id]: v }))}
                        />
                      ) : (
                        <NumericField
                          key={id}
                          label={label}
                          readOnly
                          value={live ? fnum((live as any)[id], Number(s)) : ''}
                        />
                      )
                    )}
                  </div>
                </RoseCard>
              ))}
            </div>

            <div className="bg-white rounded-xl border border-[#F1D3DC] shadow-xs p-4">
              <h2 className="text-sm font-bold text-[#8F2B4B] mb-3">Recent Entries (Last 7 Days)</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#FDF2F5] text-[#8F2B4B] border-b-2 border-[#E2B760]">
                      <th className="px-3 py-2 text-left font-bold">Date</th>
                      <th className="px-3 py-2 text-right font-bold">Yarn (M.Ton)</th>
                      <th className="px-3 py-2 text-right font-bold">Total Hands</th>
                      <th className="px-3 py-2 text-right font-bold">Total Power</th>
                      <th className="px-3 py-2 text-right font-bold">Weaving (M.Ton)</th>
                      <th className="px-3 py-2 text-right font-bold">Units / M.Ton</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentDates.length ? (
                      recentDates.map((d) => {
                        const x = calcHandsPowerMonth(dbMap, d.slice(0, 7)).find((row) => row.d === d);
                        if (!x) return null;
                        return (
                          <tr
                            key={d}
                            onClick={() => setDate(d)}
                            className="border-b border-[#F5E1E7] hover:bg-[#FFF8FA] cursor-pointer"
                          >
                            <td className="px-3 py-2 font-semibold">{fmtShort(d)}</td>
                            <td className="px-3 py-2 text-right">{fnum(x.e.yarn, 3)}</td>
                            <td className="px-3 py-2 text-right font-semibold">{fnum(x.th)}</td>
                            <td className="px-3 py-2 text-right font-semibold">{fnum(x.tp)}</td>
                            <td className="px-3 py-2 text-right">{fnum(x.e.wv, 3)}</td>
                            <td className="px-3 py-2 text-right text-[#8C6418] font-bold">{fnum(x.upm)}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-[#7A4B5B]">
                          No entries yet. Fill the form and click Save Entry.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-xl border border-[#F1D3DC] shadow-xs p-4">
            <div className="mb-4 flex items-end gap-3">
              <div>
                <label className="block text-xs font-bold text-[#542134] mb-1">Month</label>
                <input
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="px-3 py-2 text-xs border border-[#ECC5D0] rounded-lg bg-[#FFFDF9] text-[#3B1A26] focus:outline-none focus:border-[#C14468]"
                />
              </div>
              <span className="text-xs text-[#7A4B5B] font-medium pb-2">
                MTD columns restart on the 1st of each month. Click any row to edit.
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FDF2F5] text-[#8F2B4B] border-b border-[#F1D3DC]">
                    <th rowSpan={2} className="px-3 py-2 text-left font-bold border-r border-[#F1D3DC]">
                      Date
                    </th>
                    {HP_GROUPS.map(([t, n]) => (
                      <th key={t} colSpan={n} className="px-2 py-2 text-center font-bold border-r border-[#F1D3DC]">
                        {t}
                      </th>
                    ))}
                  </tr>
                  <tr className="bg-[#FDF2F5] text-[#8F2B4B] border-b-2 border-[#E2B760]">
                    {HP_HEADS.map((h) => (
                      <th key={h} className="px-2 py-1.5 text-center font-bold whitespace-nowrap border-r border-[#F1D3DC]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {monthRows.length ? (
                    monthRows.map((x) => (
                      <tr
                        key={x.d}
                        onClick={() => {
                          setDate(x.d);
                          setTab('entry');
                        }}
                        className="border-b border-[#F5E1E7] hover:bg-[#FFF8FA] cursor-pointer"
                      >
                        {[
                          fmtShort(x.d), fnum(x.e.yarn, 3), fnum(x.ag), fnum(x.my, 3), fnum(x.ma),
                          fnum(x.e.mill), fnum(x.th), fnum(x.hpm, 2), fnum(x.mh), fnum(x.mhpm, 2), fnum(x.dg), fnum(x.mdg),
                          fnum(x.e.cesc), fnum(x.tp), fnum(x.upm), fnum(x.mp), fnum(x.mupm),
                          fnum(x.e.wv, 3), fnum(x.e.sw, 3), fnum(x.mw, 3),
                        ].map((v, idx) => (
                          <td key={idx} className="px-2 py-2 text-center whitespace-nowrap border-r border-[#F5E1E7]">
                            {v}
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={20} className="px-4 py-8 text-center text-[#7A4B5B]">
                        No entries for {month}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      <ToastBanner toast={toast} />
    </div>
  );
};

/* ============================================================================
   FORM 21 (Form 5 · Yarn Stock & Dust) -> yarn_stock_dust_daily
   ============================================================================ */
function currentMonthRange(): [string, string] {
  const ym = todayISO().slice(0, 7);
  const last = new Date(+ym.slice(0, 4), +ym.slice(5), 0).getDate();
  return [`${ym}-01`, `${ym}-${String(last).padStart(2, '0')}`];
}

const YarnStockDustForm: React.FC<{
  callRpc: (fn: string, p?: any) => Promise<any>;
  canCreate: boolean;
  canDelete: boolean;
  canReport: boolean;
}> = ({ callRpc, canCreate, canDelete, canReport }) => {
  const [tab, setTab] = useState<'entry' | 'report'>('entry');
  const [date, setDate] = useState(todayISO);
  const [[from, to], setRange] = useState<[string, string]>(currentMonthRange);
  const [dbMap, setDbMap] = useState<Record<string, Record<string, any>>>({});
  const [form, setForm] = useState<{ yarn: string; dust: string; agency: string }>({
    yarn: '',
    dust: '',
    agency: '',
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const notify = (msg: string, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 3200);
  };

  const loadAll = useCallback(async () => {
    try {
      const res = await callRpc('getAll');
      const map: Record<string, Record<string, any>> = {};
      (res?.rows || []).forEach((row: any) => {
        map[row.entry_date] = row;
      });
      setDbMap(map);
    } catch (e: any) {
      notify(e.message || 'Failed to load records', true);
    }
  }, [callRpc]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    const rec = dbMap[date];
    if (rec) {
      setForm({
        yarn: rec.yarn === null || rec.yarn === undefined ? '' : String(rec.yarn),
        dust: rec.dust === null || rec.dust === undefined ? '' : String(rec.dust),
        agency: rec.agency === null || rec.agency === undefined ? '' : String(rec.agency),
      });
    } else {
      setForm({ yarn: '', dust: '', agency: '' });
    }
  }, [date, dbMap]);

  const exists = Boolean(dbMap[date]);
  const f3 = (v: any) => (!hasVal(v) ? '–' : Number(v).toFixed(3));

  const cumulativeFor = useCallback(
    (iso: string) =>
      Object.keys(dbMap)
        .filter((d) => d.slice(0, 7) === iso.slice(0, 7) && d <= iso)
        .reduce((s, d) => s + numVal(dbMap[d]?.dust), 0),
    [dbMap]
  );

  const liveCum = useMemo(() => {
    if (!date || form.dust === '') return '';
    const prior = Object.keys(dbMap)
      .filter((d) => d.slice(0, 7) === date.slice(0, 7) && d < date)
      .reduce((s, d) => s + numVal(dbMap[d]?.dust), 0);
    return (prior + Number(form.dust)).toFixed(3);
  }, [date, form.dust, dbMap]);

  const keys = useMemo(() => Object.keys(dbMap).sort().filter((d) => inRange(d, from, to)), [dbMap, from, to]);
  const dusts = keys.map((k) => dbMap[k]?.dust).filter(hasVal).map(Number);
  const agencies = keys.map((k) => dbMap[k]?.agency).filter(hasVal).map(Number);
  const yarns = keys.map((k) => dbMap[k]?.yarn).filter(hasVal).map(Number);
  const totalDust = dusts.reduce((a, b) => a + b, 0);
  const avgAgency = agencies.length ? agencies.reduce((a, b) => a + b, 0) / agencies.length : null;
  const latestYarn = yarns.length ? yarns[yarns.length - 1] : null;

  const handleSave = async () => {
    if (!date) return notify('Please select a date', true);
    setSaving(true);
    try {
      await callRpc('saveEntry', { entry_date: date, ...form });
      await loadAll();
      notify(`Saved Yarn Stock & Dust entry for ${fmtShort(date)}`);
    } catch (e: any) {
      notify(e.message || 'Save failed', true);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await callRpc('deleteEntry', { entry_date: date });
      await loadAll();
      setForm({ yarn: '', dust: '', agency: '' });
      notify(`Deleted entry for ${fmtShort(date)}`);
    } catch (e: any) {
      notify(e.message || 'Delete failed', true);
    }
  };

  const exportCsv = () => {
    const lines = [
      'Date,WDG Yarn Stock,Dust to Boiler,Cumulative,Agency Hands',
      ...keys.map((k) =>
        [fmtShort(k), dbMap[k]?.yarn ?? '', dbMap[k]?.dust ?? '', cumulativeFor(k).toFixed(3), dbMap[k]?.agency ?? ''].join(',')
      ),
    ];
    downloadCSV('yarn_stock_dust_entries.csv', lines.join('\n'));
  };

  const tabs = [
    { id: 'entry', label: 'Data Entry', icon: <FileText className="w-3.5 h-3.5" /> },
    ...(canReport ? [{ id: 'report', label: 'Register Table', icon: <BarChart3 className="w-3.5 h-3.5" /> }] : []),
  ];

  return (
    <div className="min-h-full bg-[#FBF7ED]">
      <FormHeaderBanner
        title="Form 5 · Yarn Stock & Dust"
        subtitle="WDG Yarn Stock, Dust to Boiler (Monthly Cumulative) & Agency Hands"
        tabs={tabs}
        activeTab={tab}
        onSelectTab={(id) => setTab(id as 'entry' | 'report')}
      />
      <div className="p-5 max-w-[1520px] mx-auto">
        {tab === 'entry' ? (
          <>
            <RegisterEntryBar
              date={date}
              onDate={setDate}
              exists={exists}
              saving={saving}
              canCreate={canCreate}
              canDelete={canDelete}
              onSave={handleSave}
              onClear={() => setForm({ yarn: '', dust: '', agency: '' })}
              onDelete={handleDelete}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
              <RoseCard title="WDG Yarn Stock" unit="M.Ton">
                <NumericField
                  label="Stock"
                  step="0.001"
                  value={form.yarn}
                  onChange={(v) => setForm((p) => ({ ...p, yarn: v }))}
                />
              </RoseCard>
              <RoseCard title="Dust to Boiler" unit="M.Ton">
                <NumericField
                  label="Quantity"
                  step="0.001"
                  value={form.dust}
                  onChange={(v) => setForm((p) => ({ ...p, dust: v }))}
                />
              </RoseCard>
              <RoseCard title="Cumulative Dust" unit="M.Ton">
                <NumericField label="Auto-calculated (Month)" readOnly value={liveCum} />
              </RoseCard>
              <RoseCard title="Agency Hands" unit="Nos">
                <NumericField
                  label="Total"
                  step="1"
                  value={form.agency}
                  onChange={(v) => setForm((p) => ({ ...p, agency: v }))}
                />
              </RoseCard>
            </div>

            <div className="bg-white rounded-xl border border-[#F1D3DC] shadow-xs p-4">
              <h2 className="text-sm font-bold text-[#8F2B4B] mb-3">Recent Entries (Last 7 Days)</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#FDF2F5] text-[#8F2B4B] border-b-2 border-[#E2B760]">
                      <th className="px-3 py-2 text-left font-bold">Date</th>
                      <th className="px-3 py-2 text-right font-bold">WDG Yarn Stock</th>
                      <th className="px-3 py-2 text-right font-bold">Dust to Boiler</th>
                      <th className="px-3 py-2 text-right font-bold">Cumulative</th>
                      <th className="px-3 py-2 text-right font-bold">Agency Hands</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(dbMap).length ? (
                      Object.keys(dbMap)
                        .sort()
                        .reverse()
                        .slice(0, 7)
                        .map((k) => (
                          <tr
                            key={k}
                            onClick={() => setDate(k)}
                            className="border-b border-[#F5E1E7] hover:bg-[#FFF8FA] cursor-pointer"
                          >
                            <td className="px-3 py-2 font-semibold">{fmtShort(k)}</td>
                            <td className="px-3 py-2 text-right">{f3(dbMap[k]?.yarn)}</td>
                            <td className="px-3 py-2 text-right">{f3(dbMap[k]?.dust)}</td>
                            <td className="px-3 py-2 text-right font-bold text-[#8C6418]">
                              {f3(cumulativeFor(k))}
                            </td>
                            <td className="px-3 py-2 text-right">
                              {dbMap[k]?.agency === null || dbMap[k]?.agency === undefined || dbMap[k]?.agency === ''
                                ? '–'
                                : dbMap[k].agency}
                            </td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-[#7A4B5B]">
                          No entries yet. Fill the form and click Save Entry.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <>
            <RegisterRangeBar
              from={from}
              to={to}
              setFrom={(v) => setRange([v, to])}
              setTo={(v) => setRange([from, v])}
            >
              <button
                type="button"
                onClick={() => setRange(currentMonthRange())}
                className="px-3.5 py-2 rounded-lg bg-[#FDF2F5] hover:bg-[#FBDDE2] border border-[#ECC5D0] text-[#8F2B4B] text-xs font-bold cursor-pointer"
              >
                This Month
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#C14468] hover:bg-[#9E3053] text-white text-xs font-bold cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Print
              </button>
              <button
                type="button"
                onClick={exportCsv}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg gold-ribbon-btn text-white text-xs font-bold cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>
            </RegisterRangeBar>

            <SummaryTiles
              items={[
                ['Days Entered', keys.length],
                ['Latest Yarn Stock (M.Ton)', latestYarn == null ? '–' : latestYarn.toFixed(3)],
                ['Total Dust to Boiler (M.Ton)', dusts.length ? totalDust.toFixed(3) : '–'],
                ['Avg Dust / Day (M.Ton)', dusts.length ? (totalDust / dusts.length).toFixed(3) : '–'],
                ['Avg Agency Hands', avgAgency == null ? '–' : Math.round(avgAgency)],
              ]}
            />

            <div className="bg-white rounded-xl border border-[#F1D3DC] shadow-xs p-4">
              <h2 className="text-sm font-bold text-[#8F2B4B] mb-3">Date-wise Data</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#FDF2F5] text-[#8F2B4B] border-b-2 border-[#E2B760]">
                      <th className="px-3 py-2 text-left font-bold">Date</th>
                      <th className="px-3 py-2 text-right font-bold">WDG Yarn Stock</th>
                      <th className="px-3 py-2 text-right font-bold">Dust to Boiler</th>
                      <th className="px-3 py-2 text-right font-bold">Cumulative</th>
                      <th className="px-3 py-2 text-right font-bold">Agency Hands</th>
                    </tr>
                  </thead>
                  <tbody>
                    {keys.length ? (
                      keys.map((k) => (
                        <tr
                          key={k}
                          onClick={() => {
                            setDate(k);
                            setTab('entry');
                          }}
                          className="border-b border-[#F5E1E7] hover:bg-[#FFF8FA] cursor-pointer"
                        >
                          <td className="px-3 py-2 font-semibold">{fmtShort(k)}</td>
                          <td className="px-3 py-2 text-right">{f3(dbMap[k]?.yarn)}</td>
                          <td className="px-3 py-2 text-right">{f3(dbMap[k]?.dust)}</td>
                          <td className="px-3 py-2 text-right font-bold text-[#8C6418]">
                            {f3(cumulativeFor(k))}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {dbMap[k]?.agency === null || dbMap[k]?.agency === undefined || dbMap[k]?.agency === ''
                              ? '–'
                              : dbMap[k].agency}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-[#7A4B5B]">
                          No entries in this date range.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {keys.length > 0 && (
                    <tfoot>
                      <tr className="bg-[#FDF6E7] text-[#6B213B] font-bold border-t-2 border-[#E2B760]">
                        <td className="px-3 py-2.5">Total / Avg</td>
                        <td className="px-3 py-2.5 text-right">
                          {latestYarn == null ? '–' : `${latestYarn.toFixed(3)} (latest)`}
                        </td>
                        <td className="px-3 py-2.5 text-right">{dusts.length ? totalDust.toFixed(3) : '–'}</td>
                        <td />
                        <td className="px-3 py-2.5 text-right">
                          {avgAgency == null ? '–' : `${Math.round(avgAgency)} (avg)`}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </>
        )}
      </div>
      <ToastBanner toast={toast} />
    </div>
  );
};

/* ============================================================================
   FORM 22 (Winding Department – Shift Production Book)
   Tables: winding_shifts, winding_production_rows, winding_winders
   ============================================================================ */
const WINDING_QUALITIES = [
  { k: 'WRAP', t: 'WRAP Winding' },
  { k: 'PRECISION', t: 'PRECISION Winding' },
  { k: 'OTHER', t: 'OTHER Winding' },
] as const;
const WINDING_SHIFTS = ['A', 'B', 'C'] as const;

interface WindingRow {
  no: string;
  name: string;
  readings: string[];
}

const blankWinderRow = (): WindingRow => ({ no: '', name: '', readings: ['', '', '', ''] });
const emptyWindingData = (): Record<string, WindingRow[]> => ({
  WRAP: [blankWinderRow(), blankWinderRow(), blankWinderRow(), blankWinderRow()],
  PRECISION: [blankWinderRow(), blankWinderRow(), blankWinderRow(), blankWinderRow()],
  OTHER: [blankWinderRow(), blankWinderRow(), blankWinderRow(), blankWinderRow()],
});
const sumArr = (a: (string | number)[]) => a.reduce<number>((acc, x) => acc + (Number(x) || 0), 0);
const fmtW = (n: number) => (Math.round(n * 100) / 100).toLocaleString('en-IN');

const WindingProductionForm: React.FC<{
  callRpc: (fn: string, p?: any) => Promise<any>;
  canCreate: boolean;
  canDelete: boolean;
  canReport: boolean;
}> = ({ callRpc, canCreate, canDelete, canReport }) => {
  const [tab, setTab] = useState<'entry' | 'report' | 'winders'>('entry');
  const [date, setDate] = useState(todayISO);
  const [shift, setShift] = useState<string>('A');
  const [meta, setMeta] = useState({ clerk: '', warp: '', weft: '' });
  const [data, setData] = useState<Record<string, WindingRow[]>>(emptyWindingData);
  const [cur, setCur] = useState<string>('WRAP');
  const [winders, setWinders] = useState<{ no: string; name: string }[]>([]);
  const [status, setStatus] = useState<{ type: 'loaded' | 'new'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const [rf, setRf] = useState({ from: todayISO(), to: todayISO(), shift: '' });
  const [report, setReport] = useState<{ rows: any[]; meta: any[] } | null>(null);

  const notify = (msg: string, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 3200);
  };

  useEffect(() => {
    callRpc('getWinders')
      .then((res) => setWinders(res?.winders || []))
      .catch(() => {});
  }, [callRpc]);

  useEffect(() => {
    if (!date) return;
    setConfirmDelete(false);
    callRpc('loadEntry', { date, shift })
      .then((d) => {
        const next: Record<string, WindingRow[]> = { WRAP: [], PRECISION: [], OTHER: [] };
        (d?.rows || []).forEach((r: any) => {
          if (next[r.quality]) {
            next[r.quality].push({
              no: r.no || '',
              name: r.name || '',
              readings:
                Array.isArray(r.readings) && r.readings.length
                  ? r.readings.map((x: any) => String(x))
                  : [String(r.total ?? '')],
            });
          }
        });
        WINDING_QUALITIES.forEach((q) => {
          if (!next[q.k].length) {
            next[q.k] = [blankWinderRow(), blankWinderRow(), blankWinderRow(), blankWinderRow()];
          }
        });
        setData(next);
        setMeta(
          d?.meta
            ? { clerk: d.meta.clerk || '', warp: d.meta.warp || '', weft: d.meta.weft || '' }
            : { clerk: '', warp: '', weft: '' }
        );
        setStatus(
          d?.rows?.length
            ? { type: 'loaded', text: `${d.rows.length} saved entries for ${date}, Shift ${shift} — edit and save to update.` }
            : { type: 'new', text: `No entry yet for ${date}, Shift ${shift}.` }
        );
      })
      .catch((e: any) => notify(e.message || 'Failed to load shift entry', true));
  }, [date, shift, callRpc]);

  const updateRows = (fn: (rows: WindingRow[]) => WindingRow[]) =>
    setData((prev) => ({ ...prev, [cur]: fn(prev[cur]) }));

  const setField = (i: number, f: 'no' | 'name', v: string) =>
    updateRows((rows) => rows.map((r, x) => (x === i ? { ...r, [f]: v } : r)));

  const autoFill = (i: number, f: 'no' | 'name') =>
    updateRows((rows) =>
      rows.map((r, x) => {
        if (x !== i) return r;
        if (f === 'no') {
          const w = winders.find((w) => w.no && w.no === r.no);
          return w && !r.name ? { ...r, name: w.name } : r;
        }
        const w = winders.find((w) => w.name && w.name.toLowerCase() === r.name.toLowerCase());
        return w && !r.no ? { ...r, no: w.no } : r;
      })
    );

  const setReading = (i: number, j: number, v: string) =>
    updateRows((rows) =>
      rows.map((r, x) => (x === i ? { ...r, readings: r.readings.map((o, y) => (y === j ? v : o)) } : r))
    );

  const addReading = (i: number) =>
    updateRows((rows) => rows.map((r, x) => (x === i ? { ...r, readings: [...r.readings, ''] } : r)));

  const addRow = (ditto = false) =>
    updateRows((rows) => {
      const nr = blankWinderRow();
      if (ditto && rows.length) nr.readings = [...rows[rows.length - 1].readings];
      return [...rows, nr];
    });

  const dittoRow = (i: number) => {
    if (i === 0) return notify('No row above to copy from', true);
    updateRows((rows) =>
      rows.map((r, x) => (x === i ? { ...r, readings: [...rows[i - 1].readings] } : r))
    );
  };

  const delRow = (i: number) => updateRows((rows) => rows.filter((_, x) => x !== i));

  const tabTotal = sumArr(data[cur].map((r) => sumArr(r.readings)));
  const grandTotal = sumArr(WINDING_QUALITIES.map((q) => sumArr(data[q.k].map((r) => sumArr(r.readings)))));

  const saveAll = async () => {
    if (!date) return notify('Please select a date', true);
    const rows = WINDING_QUALITIES.flatMap((q) =>
      data[q.k]
        .map((r) => ({ r, total: sumArr(r.readings) }))
        .filter(({ total }) => total > 0)
        .map(({ r, total }) => ({
          quality: q.k,
          no: r.no.trim(),
          name: r.name.trim(),
          readings: r.readings.filter((x) => x !== '' && !Number.isNaN(Number(x))).map(Number),
          total,
        }))
    );
    if (!rows.length) return notify('No production entered', true);
    setSaving(true);
    try {
      const res = await callRpc('saveEntry', {
        date,
        shift,
        ...meta,
        grand: sumArr(rows.map((x) => x.total)),
        rows,
      });
      if (res?.winders) setWinders(res.winders);
      setStatus({ type: 'loaded', text: `Saved ${res?.count || rows.length} winder entries for ${date}, Shift ${shift}.` });
      notify(`Saved ${res?.count || rows.length} winder entries`);
    } catch (e: any) {
      notify(e.message || 'Save failed', true);
    } finally {
      setSaving(false);
    }
  };

  const clearAll = () => {
    setData(emptyWindingData());
    setMeta({ clerk: '', warp: '', weft: '' });
    setCur('WRAP');
  };

  const removeEntry = async () => {
    try {
      await callRpc('deleteEntry', { date, shift });
      clearAll();
      setConfirmDelete(false);
      setStatus({ type: 'new', text: `No entry yet for ${date}, Shift ${shift}.` });
      notify('Shift entry deleted');
    } catch (e: any) {
      notify(e.message || 'Delete failed', true);
    }
  };

  const runReport = async () => {
    if (!rf.from || !rf.to) return notify('Select From and To dates', true);
    try {
      const res = await callRpc('getReport', rf);
      setReport(res || { rows: [], meta: [] });
    } catch (e: any) {
      notify(e.message || 'Report failed', true);
    }
  };

  const exportCsv = () => {
    if (!report || !report.rows.length) return notify('Run a report first', true);
    const lines = [
      ['Date', 'Shift', 'Quality', 'Winder No', 'Winder Name', 'Readings', 'Total Kg'],
      ...report.rows.map((r) => [
        r.date,
        r.shift,
        r.quality,
        r.no,
        r.name,
        String(r.readings || '').replace(/,/g, ' '),
        r.total,
      ]),
    ];
    const csv = lines.map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    downloadCSV('winding_production.csv', csv);
  };

  const rep = useMemo(() => {
    if (!report) return null;
    const rows = report.rows || [];
    const total = sumArr(rows.map((r) => r.total));
    const shifts = new Set(rows.map((r) => `${r.date}|${r.shift}`)).size;
    const groupSum = (keyFn: (r: any) => string) => {
      const m: Record<string, { n: number; t: number; r: any }> = {};
      rows.forEach((r) => {
        const k = keyFn(r);
        if (!m[k]) m[k] = { n: 0, t: 0, r };
        m[k].n++;
        m[k].t += Number(r.total) || 0;
      });
      return m;
    };
    const q = groupSum((r) => r.quality);
    return {
      total,
      shifts,
      winCount: new Set(rows.map((r) => `${r.no}|${r.name}`)).size,
      q: Object.entries(q).sort((a, b) => b[1].t - a[1].t),
      qMax: Math.max(1, ...Object.values(q).map((x) => x.t)),
      s: Object.entries(groupSum((r) => `${r.date}|${r.shift}`)).sort(),
      w: Object.values(groupSum((r) => `${r.no}|${r.name}`)).sort((a, b) => b.t - a.t),
    };
  }, [report]);

  const currentQualityTitle = WINDING_QUALITIES.find((q) => q.k === cur)?.t || 'WRAP Winding';

  const tabs = [
    { id: 'entry', label: 'Production Book', icon: <FileText className="w-3.5 h-3.5" /> },
    ...(canReport ? [{ id: 'report', label: 'Shift Reports', icon: <BarChart3 className="w-3.5 h-3.5" /> }] : []),
    { id: 'winders', label: 'Winders Master', icon: <Users className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="min-h-full bg-[#FBF7ED]">
      <FormHeaderBanner
        title="Winding Department · Production Book"
        subtitle="Shift Operations ERP · Warp / Precision / Other Winding Production Book"
        tabs={tabs}
        activeTab={tab}
        onSelectTab={(id) => setTab(id as 'entry' | 'report' | 'winders')}
      />

      <div className="p-5 max-w-[1520px] mx-auto">
        {tab === 'entry' && (
          <div className="space-y-4">
            {/* Shift Metadata Card */}
            <div className="bg-white rounded-xl border border-[#F1D3DC] shadow-xs p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#542134] mb-1">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#ECC5D0] rounded-lg bg-[#FFFDF9] text-[#3B1A26] focus:outline-none focus:border-[#C14468]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#542134] mb-1">Shift</label>
                  <select
                    value={shift}
                    onChange={(e) => setShift(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#ECC5D0] rounded-lg bg-[#FFFDF9] text-[#3B1A26] focus:outline-none focus:border-[#C14468]"
                  >
                    {WINDING_SHIFTS.map((s) => (
                      <option key={s} value={s}>
                        Shift {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#542134] mb-1">Tally Clerk</label>
                  <input
                    type="text"
                    value={meta.clerk}
                    placeholder="Signature of the Tally Clerk"
                    onChange={(e) => setMeta({ ...meta, clerk: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-[#ECC5D0] rounded-lg bg-[#FFFDF9] text-[#3B1A26] focus:outline-none focus:border-[#C14468]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#542134] mb-1">Warp</label>
                  <input
                    type="text"
                    value={meta.warp}
                    placeholder="Warp"
                    onChange={(e) => setMeta({ ...meta, warp: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-[#ECC5D0] rounded-lg bg-[#FFFDF9] text-[#3B1A26] focus:outline-none focus:border-[#C14468]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#542134] mb-1">Weft</label>
                  <input
                    type="text"
                    value={meta.weft}
                    placeholder="Weft"
                    onChange={(e) => setMeta({ ...meta, weft: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-[#ECC5D0] rounded-lg bg-[#FFFDF9] text-[#3B1A26] focus:outline-none focus:border-[#C14468]"
                  />
                </div>
              </div>
              {status && (
                <div className="mt-3.5 flex items-center gap-2 text-xs text-[#7A4B5B]">
                  <span
                    className={`px-2.5 py-0.5 rounded-md font-bold border ${
                      status.type === 'loaded'
                        ? 'bg-[#FDF6E7] border-[#E2B760] text-[#8C6418]'
                        : 'bg-[#FDF2F5] border-[#F1D3DC] text-[#8F2B4B]'
                    }`}
                  >
                    {status.type === 'loaded' ? 'Saved' : 'New'}
                  </span>
                  <span>{status.text}</span>
                </div>
              )}
            </div>

            {/* Quality Subtabs + Entry Table */}
            <div className="bg-white rounded-xl border border-[#F1D3DC] shadow-xs overflow-hidden">
              <div className="flex bg-[#FDF2F5] border-b border-[#F1D3DC]">
                {WINDING_QUALITIES.map((q) => {
                  const count = data[q.k].filter((r) => sumArr(r.readings) > 0).length;
                  const active = q.k === cur;
                  return (
                    <button
                      key={q.k}
                      type="button"
                      onClick={() => setCur(q.k)}
                      className={`flex-1 py-3 px-4 text-xs font-bold transition-all cursor-pointer border-b-[3px] ${
                        active
                          ? 'bg-white text-[#C14468] border-[#C14468]'
                          : 'text-[#8F2B4B] border-transparent hover:bg-[#FBDDE2]/60'
                      }`}
                    >
                      {q.k}
                      {count > 0 && (
                        <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] bg-[#FDF6E7] border border-[#E2B760] text-[#8C6418]">
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="p-5">
                <h2 className="text-base font-bold text-[#8F2B4B] mb-3">{currentQualityTitle}</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#FDF2F5] text-[#8F2B4B] border-b-2 border-[#E2B760]">
                        <th className="px-3 py-2.5 text-left font-bold w-28">Winder No.</th>
                        <th className="px-3 py-2.5 text-left font-bold min-w-[180px]">Winder Name</th>
                        <th className="px-3 py-2.5 text-left font-bold">Production Readings (Kg)</th>
                        <th className="px-3 py-2.5 text-left font-bold w-32">Total (Kg)</th>
                        <th className="px-3 py-2.5 text-center font-bold w-24">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data[cur].map((r, i) => (
                        <tr key={i} className="border-b border-[#F5E1E7]">
                          <td className="px-2 py-2">
                            <input
                              list="bjm-winder-no"
                              value={r.no}
                              placeholder="No."
                              onChange={(e) => setField(i, 'no', e.target.value)}
                              onBlur={() => autoFill(i, 'no')}
                              className="w-full px-2.5 py-2 border border-[#ECC5D0] rounded-lg bg-[#FFFDF9] text-[#3B1A26] focus:outline-none focus:border-[#C14468]"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              list="bjm-winder-name"
                              value={r.name}
                              placeholder="Winder name"
                              onChange={(e) => setField(i, 'name', e.target.value)}
                              onBlur={() => autoFill(i, 'name')}
                              className="w-full px-2.5 py-2 border border-[#ECC5D0] rounded-lg bg-[#FFFDF9] text-[#3B1A26] focus:outline-none focus:border-[#C14468]"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {r.readings.map((v, j) => (
                                <input
                                  key={j}
                                  type="number"
                                  step="any"
                                  min="0"
                                  value={v}
                                  onChange={(e) => setReading(i, j, e.target.value)}
                                  className="w-[72px] px-2 py-2 text-center border border-[#ECC5D0] rounded-lg bg-[#FFFDF9] text-[#3B1A26] focus:outline-none focus:border-[#C14468]"
                                />
                              ))}
                              <button
                                type="button"
                                onClick={() => addReading(i)}
                                title="Add reading box"
                                className="px-2.5 py-2 rounded-lg border border-dashed border-[#CB798D] bg-[#FDF2F5] hover:bg-[#FBDDE2] text-[#8F2B4B] font-bold cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                          <td className="px-2 py-2">
                            <input
                              readOnly
                              value={fmtW(sumArr(r.readings))}
                              className="w-full px-2.5 py-2 rounded-lg bg-[#FDF6E7] border border-[#EBD49E] text-[#7A4B18] font-bold text-right"
                            />
                          </td>
                          <td className="px-2 py-2 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => dittoRow(i)}
                              title="Same as above row"
                              className="p-1.5 rounded-lg text-[#8F2B4B] hover:bg-[#FDF2F5] cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => delRow(i)}
                              title="Delete row"
                              className="p-1.5 rounded-lg text-[#B8294B] hover:bg-[#FDF0F3] cursor-pointer ml-1"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#F1D3DC]">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => addRow(false)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#FDF2F5] hover:bg-[#FBDDE2] border border-[#ECC5D0] text-[#8F2B4B] text-xs font-bold cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Winder
                    </button>
                    <button
                      type="button"
                      onClick={() => addRow(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#FDF2F5] hover:bg-[#FBDDE2] border border-[#ECC5D0] text-[#8F2B4B] text-xs font-bold cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Add Same-as-above Row
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-[#542134]">Total Production (this tab)</span>
                    <input
                      readOnly
                      value={`${fmtW(tabTotal)} Kg`}
                      className="w-36 px-3 py-1.5 rounded-lg bg-[#FDF6E7] border border-[#E2B760] text-[#7A4B18] font-bold text-right text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Grand Total & Action Footer */}
            <div className="bg-white rounded-xl border border-[#F1D3DC] shadow-xs p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-[#8F2B4B]">Grand Total (All Qualities)</span>
                <input
                  readOnly
                  value={`${fmtW(grandTotal)} Kg`}
                  className="w-44 px-3.5 py-2 rounded-lg bg-[#FDF6E7] border-2 border-[#E2B760] text-[#6B213B] font-bold text-right text-base"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {canDelete && (
                  confirmDelete ? (
                    <div className="inline-flex items-center gap-1.5 bg-[#FDF0F3] border border-[#E9B0BF] px-2.5 py-1.5 rounded-lg">
                      <span className="text-xs font-bold text-[#931D3A]">Delete this shift?</span>
                      <button
                        type="button"
                        onClick={removeEntry}
                        className="px-2.5 py-1 rounded bg-[#B8294B] text-white text-xs font-bold cursor-pointer"
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(false)}
                        className="px-2 py-1 rounded bg-white border border-[#ECC5D0] text-[#8F2B4B] text-xs font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#FDF0F3] hover:bg-[#FBDDE2] border border-[#E9B0BF] text-[#B8294B] text-xs font-bold cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete Shift Entry
                    </button>
                  )
                )}
                <button
                  type="button"
                  onClick={clearAll}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#FDF2F5] hover:bg-[#FBDDE2] border border-[#ECC5D0] text-[#8F2B4B] text-xs font-bold cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Clear Form
                </button>
                <button
                  type="button"
                  onClick={saveAll}
                  disabled={saving || !canCreate}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg gold-ribbon-btn text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving ? 'Saving...' : 'Save Shift Production'}
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === 'report' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-[#F1D3DC] shadow-xs p-4 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-xs font-bold text-[#542134] mb-1">From</label>
                <input
                  type="date"
                  value={rf.from}
                  onChange={(e) => setRf({ ...rf, from: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-[#ECC5D0] rounded-lg bg-[#FFFDF9]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#542134] mb-1">To</label>
                <input
                  type="date"
                  value={rf.to}
                  onChange={(e) => setRf({ ...rf, to: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-[#ECC5D0] rounded-lg bg-[#FFFDF9]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#542134] mb-1">Shift</label>
                <select
                  value={rf.shift}
                  onChange={(e) => setRf({ ...rf, shift: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-[#ECC5D0] rounded-lg bg-[#FFFDF9]"
                >
                  <option value="">All Shifts</option>
                  {WINDING_SHIFTS.map((s) => (
                    <option key={s} value={s}>
                      Shift {s}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={runReport}
                className="w-full py-2 px-4 rounded-lg bg-[#C14468] hover:bg-[#9E3053] text-white text-xs font-bold cursor-pointer"
              >
                Show Report
              </button>
            </div>

            {rep && (
              <>
                <SummaryTiles
                  items={[
                    ['Total Production (Kg)', fmtW(rep.total)],
                    ['Shifts Recorded', rep.shifts],
                    ['Avg Kg / Shift', rep.shifts ? fmtW(rep.total / rep.shifts) : 0],
                    ['Active Winders', rep.winCount],
                  ]}
                />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl border border-[#F1D3DC] shadow-xs p-4">
                    <h3 className="text-sm font-bold text-[#8F2B4B] mb-3">By Quality</h3>
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#FDF2F5] text-[#8F2B4B] border-b-2 border-[#E2B760]">
                          <th className="px-3 py-2 text-left">Quality</th>
                          <th className="px-3 py-2 text-right">Winders</th>
                          <th className="px-3 py-2 text-right">Total Kg</th>
                          <th className="px-3 py-2 w-28">Share</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rep.q.length ? (
                          rep.q.map(([k, v]) => (
                            <tr key={k} className="border-b border-[#F5E1E7]">
                              <td className="px-3 py-2 font-bold">{k}</td>
                              <td className="px-3 py-2 text-right">{v.n}</td>
                              <td className="px-3 py-2 text-right font-semibold">{fmtW(v.t)}</td>
                              <td className="px-3 py-2">
                                <div className="h-2.5 bg-[#FDF2F5] rounded-full overflow-hidden">
                                  <div
                                    className="h-full gold-ribbon-bar rounded-full"
                                    style={{ width: `${(v.t / rep.qMax) * 100}%` }}
                                  />
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="px-3 py-4 text-center text-[#7A4B5B]">
                              No data
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-white rounded-xl border border-[#F1D3DC] shadow-xs p-4">
                    <h3 className="text-sm font-bold text-[#8F2B4B] mb-3">By Date &amp; Shift</h3>
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#FDF2F5] text-[#8F2B4B] border-b-2 border-[#E2B760]">
                          <th className="px-3 py-2 text-left">Date</th>
                          <th className="px-3 py-2 text-center">Shift</th>
                          <th className="px-3 py-2 text-right">Total Kg</th>
                          <th className="px-3 py-2 text-left">Clerk</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rep.s.length ? (
                          rep.s.map(([k, v]) => {
                            const [dt, sf] = k.split('|');
                            const m = report?.meta?.find((x) => x.date === dt && x.shift === sf);
                            return (
                              <tr key={k} className="border-b border-[#F5E1E7]">
                                <td className="px-3 py-2 font-semibold">{fmtDMY(dt)}</td>
                                <td className="px-3 py-2 text-center">{sf}</td>
                                <td className="px-3 py-2 text-right font-semibold">{fmtW(v.t)}</td>
                                <td className="px-3 py-2">{m?.clerk || '–'}</td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={4} className="px-3 py-4 text-center text-[#7A4B5B]">
                              No data
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-[#F1D3DC] shadow-xs p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-[#8F2B4B]">Detailed Entries</h3>
                    <button
                      type="button"
                      onClick={exportCsv}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FDF2F5] hover:bg-[#FBDDE2] border border-[#ECC5D0] text-[#8F2B4B] text-xs font-bold cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download CSV
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#FDF2F5] text-[#8F2B4B] border-b-2 border-[#E2B760]">
                          <th className="px-3 py-2 text-left">Date</th>
                          <th className="px-3 py-2 text-center">Shift</th>
                          <th className="px-3 py-2 text-left">Quality</th>
                          <th className="px-3 py-2 text-left">Winder No.</th>
                          <th className="px-3 py-2 text-left">Name</th>
                          <th className="px-3 py-2 text-left">Readings</th>
                          <th className="px-3 py-2 text-right">Total Kg</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report?.rows?.length ? (
                          report.rows.map((r, idx) => (
                            <tr key={idx} className="border-b border-[#F5E1E7]">
                              <td className="px-3 py-2">{fmtDMY(r.date)}</td>
                              <td className="px-3 py-2 text-center">{r.shift}</td>
                              <td className="px-3 py-2 font-semibold">{r.quality}</td>
                              <td className="px-3 py-2">{r.no || '–'}</td>
                              <td className="px-3 py-2">{r.name || '–'}</td>
                              <td className="px-3 py-2 font-mono text-[11px]">{r.readings}</td>
                              <td className="px-3 py-2 text-right font-bold">{fmtW(r.total)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} className="px-3 py-6 text-center text-[#7A4B5B]">
                              No entries found for the selected filter.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {tab === 'winders' && (
          <div className="bg-white rounded-xl border border-[#F1D3DC] shadow-xs p-5">
            <h2 className="text-sm font-bold text-[#8F2B4B] mb-1">Winder Master</h2>
            <p className="text-xs text-[#7A4B5B] mb-4">
              Winders are saved automatically to the &ldquo;production&rdquo; database whenever you record a shift and appear as suggestions while typing.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FDF2F5] text-[#8F2B4B] border-b-2 border-[#E2B760]">
                    <th className="px-3 py-2.5 text-left font-bold w-40">Winder No.</th>
                    <th className="px-3 py-2.5 text-left font-bold">Winder Name</th>
                  </tr>
                </thead>
                <tbody>
                  {winders.length ? (
                    winders.map((w, idx) => (
                      <tr key={idx} className="border-b border-[#F5E1E7]">
                        <td className="px-3 py-2 font-semibold">{w.no || '–'}</td>
                        <td className="px-3 py-2">{w.name || '–'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} className="px-4 py-6 text-center text-[#7A4B5B]">
                        No winders recorded yet. Save a shift in Production Book to populate Winder Master.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <datalist id="bjm-winder-no">
        {winders
          .filter((w) => w.no)
          .map((w, i) => (
            <option key={i} value={w.no}>
              {w.name}
            </option>
          ))}
      </datalist>
      <datalist id="bjm-winder-name">
        {winders
          .filter((w) => w.name)
          .map((w, i) => (
            <option key={i} value={w.name}>
              {w.no}
            </option>
          ))}
      </datalist>

      <ToastBanner toast={toast} />
    </div>
  );
};

/* ============================================================================
   MAIN DISPATCHER COMPONENT
   ============================================================================ */
export const ExtendedProductionForms: React.FC<ExtendedFormsProps> = ({
  moduleKey,
  userId,
  permission,
  onSessionExpired,
  onMaintenanceActive,
}) => {
  const callRpc = useModuleRpc(moduleKey, userId, onSessionExpired, onMaintenanceActive);
  const canCreate = permission ? Boolean(permission.canCreate) : true;
  const canDelete = permission ? Boolean(permission.canDelete) : true;
  const canReport = permission ? Boolean(permission.canReport) : true;

  return (
    <div className="flex-1 w-full h-full overflow-y-auto bg-[#FBF7ED]">
      {moduleKey === 'sacking_finish_departments' && (
        <FinishDepartmentsForm
          callRpc={callRpc}
          canCreate={canCreate}
          canDelete={canDelete}
          canReport={canReport}
        />
      )}
      {moduleKey === 'herackle_daily_register' && (
        <HerackleDailyForm
          callRpc={callRpc}
          canCreate={canCreate}
          canDelete={canDelete}
          canReport={canReport}
        />
      )}
      {moduleKey === 'bag_power_utilities' && (
        <BagPowerUtilitiesForm
          callRpc={callRpc}
          canCreate={canCreate}
          canDelete={canDelete}
          canReport={canReport}
        />
      )}
      {moduleKey === 'hands_power' && (
        <HandsPowerForm
          callRpc={callRpc}
          canCreate={canCreate}
          canDelete={canDelete}
          canReport={canReport}
        />
      )}
      {moduleKey === 'yarn_stock_dust' && (
        <YarnStockDustForm
          callRpc={callRpc}
          canCreate={canCreate}
          canDelete={canDelete}
          canReport={canReport}
        />
      )}
      {moduleKey === 'winding_production' && (
        <WindingProductionForm
          callRpc={callRpc}
          canCreate={canCreate}
          canDelete={canDelete}
          canReport={canReport}
        />
      )}
    </div>
  );
};
