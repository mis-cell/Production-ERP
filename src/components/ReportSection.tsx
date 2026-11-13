import React, { useState, useEffect, useCallback } from 'react';
import {
  FileSpreadsheet,
  Printer,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  ArrowUpRight,
  Table as TableIcon,
  Layers,
} from 'lucide-react';

interface ReportSectionProps {
  userId: number;
  initialDepartment?: string;
  onOpenDepartmentForm: (moduleKey: string) => void;
}

export const ReportSection: React.FC<ReportSectionProps> = ({
  userId,
  initialDepartment = 'all',
  onOpenDepartmentForm,
}) => {
  const [selectedDept, setSelectedDept] = useState<string>(initialDepartment);
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [shiftFilter, setShiftFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'unified' | 'raw_tables'>('unified');

  const [loading, setLoading] = useState<boolean>(true);
  const [reportData, setReportData] = useState<{
    reportableModules: { key: string; name: string; shortName: string; category: string }[];
    departmentSummaries: {
      moduleKey: string;
      name: string;
      shortName: string;
      category: string;
      recordCount: number;
      totalPrimary: number;
      primaryUnit: string;
      tables: string[];
    }[];
    records: any[];
    rawTablesByModule: Record<string, { tableName: string; rows: any[] }[]>;
  }>({
    reportableModules: [],
    departmentSummaries: [],
    records: [],
    rawTablesByModule: {},
  });

  useEffect(() => {
    setSelectedDept(initialDepartment || 'all');
  }, [initialDepartment]);

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        userId: String(userId),
        moduleKey: selectedDept,
        fromDate,
        toDate,
        shift: shiftFilter,
      });
      const res = await fetch(`/api/reports?${params.toString()}`);
      const data = await res.json();
      if (data.ok) {
        setReportData({
          reportableModules: data.reportableModules || [],
          departmentSummaries: data.departmentSummaries || [],
          records: data.records || [],
          rawTablesByModule: data.rawTablesByModule || {},
        });
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [userId, selectedDept, fromDate, toDate, shiftFilter]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const filteredRecords = reportData.records.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      String(r.department || '').toLowerCase().includes(q) ||
      String(r.machine || '').toLowerCase().includes(q) ||
      String(r.quality || '').toLowerCase().includes(q) ||
      String(r.operator || '').toLowerCase().includes(q) ||
      String(r.tableName || '').toLowerCase().includes(q) ||
      String(r.date || '').toLowerCase().includes(q)
    );
  });

  const handleExportCsv = () => {
    const headers = [
      'Date',
      'Shift',
      'Department',
      'Table',
      'Machine/Loom',
      'Quality/Order',
      'Operator/Supervisor',
      'Primary Output',
      'Unit',
      'Secondary Output',
      'Secondary Unit',
      'Remarks',
    ];
    const csvRows = [
      headers.join(','),
      ...filteredRecords.map((r) =>
        [
          `"${r.date}"`,
          `"${r.shift}"`,
          `"${r.department}"`,
          `"${r.tableName}"`,
          `"${r.machine}"`,
          `"${r.quality}"`,
          `"${r.operator}"`,
          r.primaryVal,
          `"${r.primaryLabel}"`,
          r.secondaryVal,
          `"${r.secondaryLabel}"`,
          `"${String(r.remarks || '').replace(/"/g, '""')}"`,
        ].join(',')
      ),
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bally_jute_report_${selectedDept}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#FCFBF9] p-6">
      <div className="max-w-[1440px] mx-auto space-y-6">
        {/* Top Banner in Lotus Screenshot Palette */}
        <div className="rounded-2xl bg-gradient-to-r from-[#3B0764] via-[#701A75] to-[#EA580C] text-white p-6 shadow-md flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-amber-300">
                Centralized Production Report Center
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight mt-0.5">
                All 16 Department Production & Shift Reports
              </h1>
              <p className="text-xs text-purple-100 mt-1">
                Filter by Department, Date Range, or Shift and export to Excel/CSV.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={loadReports}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-semibold backdrop-blur-xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh Report
            </button>
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export Excel / CSV
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white text-[#4C1D95] hover:bg-purple-50 text-xs font-bold shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white border border-purple-200/80 rounded-xl p-4 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
          <div className="lg:col-span-2">
            <label className="block text-xs font-bold text-[#4C1D95] mb-1">
              <Filter className="w-3.5 h-3.5 inline mr-1 text-orange-600" />
              Select Department Form (1–16)
            </label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold border border-purple-200 rounded-lg bg-purple-50/40 text-slate-900 focus:outline-none focus:border-purple-700"
            >
              <option value="all">All 16 Departments (Combined Master Report)</option>
              {reportData.reportableModules.map((m, idx) => (
                <option key={m.key} value={m.key}>
                  {idx + 1}. {m.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4C1D95] mb-1">
              <Calendar className="w-3.5 h-3.5 inline mr-1 text-orange-600" />
              From Date
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-purple-200 rounded-lg bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4C1D95] mb-1">
              <Calendar className="w-3.5 h-3.5 inline mr-1 text-orange-600" />
              To Date
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-purple-200 rounded-lg bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4C1D95] mb-1">Shift</label>
            <select
              value={shiftFilter}
              onChange={(e) => setShiftFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold border border-purple-200 rounded-lg bg-white"
            >
              <option value="all">All Shifts (A / B / C)</option>
              <option value="a">Shift A</option>
              <option value="b">Shift B</option>
              <option value="c">Shift C</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4C1D95] mb-1">Search Keyword</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Machine, Quality, Name..."
                className="w-full pl-8 pr-2.5 py-2 text-xs border border-purple-200 rounded-lg bg-white"
              />
            </div>
          </div>
        </div>

        {/* Department Summary Cards Grid */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#3B0764] uppercase tracking-wider">
              Department-Wise Summary (Click any card to filter report or open entry form)
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('unified')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  viewMode === 'unified'
                    ? 'bg-[#4C1D95] text-white'
                    : 'bg-white border border-purple-200 text-slate-700'
                }`}
              >
                <Layers className="w-3.5 h-3.5 inline mr-1" />
                Unified Report Table ({filteredRecords.length})
              </button>
              <button
                onClick={() => setViewMode('raw_tables')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  viewMode === 'raw_tables'
                    ? 'bg-[#4C1D95] text-white'
                    : 'bg-white border border-purple-200 text-slate-700'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5 inline mr-1" />
                Department SQL Tables View
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
            {reportData.departmentSummaries.map((dept) => {
              const isSelected = selectedDept === dept.moduleKey;
              return (
                <div
                  key={dept.moduleKey}
                  onClick={() =>
                    setSelectedDept(isSelected ? 'all' : dept.moduleKey)
                  }
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-gradient-to-br from-[#4C1D95] to-[#9D174D] text-white border-purple-900 shadow-sm'
                      : 'bg-white hover:bg-orange-50/50 border-purple-100 text-slate-900'
                  }`}
                >
                  <div>
                    <div
                      className={`text-[10px] font-bold uppercase tracking-wider truncate ${
                        isSelected ? 'text-amber-300' : 'text-orange-600'
                      }`}
                    >
                      {dept.category.split(' ')[0]}
                    </div>
                    <div className="font-bold text-xs mt-0.5 truncate">{dept.shortName}</div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-current/10 flex items-end justify-between">
                    <div>
                      <div className="text-sm font-extrabold font-mono tabular-nums">
                        {dept.totalPrimary}
                      </div>
                      <div
                        className={`text-[10px] ${
                          isSelected ? 'text-purple-200' : 'text-slate-500'
                        }`}
                      >
                        {dept.primaryUnit} · {dept.recordCount} rec
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenDepartmentForm(dept.moduleKey);
                      }}
                      title={`Open ${dept.shortName} Entry Form`}
                      className={`p-1 rounded-md ${
                        isSelected
                          ? 'bg-white/20 text-white hover:bg-white/30'
                          : 'bg-purple-50 text-[#4C1D95] hover:bg-purple-100'
                      }`}
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Report Table View */}
        {viewMode === 'unified' ? (
          <div className="bg-white border border-purple-200/80 rounded-xl overflow-hidden shadow-xs">
            <div className="px-5 py-3.5 bg-gradient-to-r from-purple-50 via-orange-50/40 to-amber-50/40 border-b border-purple-200/70 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#3B0764]">
                  {selectedDept === 'all'
                    ? 'Master Production Report (All 16 Departments)'
                    : `Department Report: ${
                        reportData.departmentSummaries.find((d) => d.moduleKey === selectedDept)?.name ||
                        selectedDept
                      }`}
                </h3>
                <p className="text-xs text-slate-600">
                  Showing <strong className="font-mono">{filteredRecords.length}</strong> records from the <code className="font-mono text-[#9D174D]">production</code> database
                </p>
              </div>
              {selectedDept !== 'all' && (
                <button
                  onClick={() => onOpenDepartmentForm(selectedDept)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#EA580C] to-[#9D174D] text-white text-xs font-bold cursor-pointer"
                >
                  Open {selectedDept.toUpperCase()} Entry Form
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#3B0764] text-white text-[11px] font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-3">Shift</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-3">Machine / Loom</th>
                    <th className="py-3 px-4">Quality / Mix / Color</th>
                    <th className="py-3 px-4">Operator / Supervisor</th>
                    <th className="py-3 px-4 text-right">Primary Output</th>
                    <th className="py-3 px-4 text-right">Secondary Output</th>
                    <th className="py-3 px-4">Source Table / Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-100 text-xs">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-slate-500">
                        No report records match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((r) => (
                      <tr key={r.id} className="hover:bg-orange-50/40 transition-colors">
                        <td className="py-2.5 px-4 font-mono font-semibold text-slate-900 whitespace-nowrap">
                          {r.date}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-[#9D174D]">{r.shift}</td>
                        <td className="py-2.5 px-4 font-bold text-[#3B0764]">{r.department}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-800">{r.machine}</td>
                        <td className="py-2.5 px-4 font-medium text-slate-800">{r.quality}</td>
                        <td className="py-2.5 px-4 text-slate-700">{r.operator}</td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                          {r.primaryVal} <span className="text-[11px] font-normal text-slate-500">{r.primaryLabel}</span>
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-slate-700 tabular-nums">
                          {r.secondaryVal ? (
                            <>
                              {r.secondaryVal}{' '}
                              <span className="text-[11px] text-slate-500">{r.secondaryLabel}</span>
                            </>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-[11px] font-mono text-slate-500">
                          {r.tableName} {r.remarks ? `· ${r.remarks}` : ''}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Raw Department Tables View */
          <div className="space-y-6">
            {Object.entries(reportData.rawTablesByModule).map(([modKey, tablesList]) => (
              <div key={modKey} className="space-y-4">
                {tablesList.map((tbl) => {
                  const cols = tbl.rows.length > 0 ? Object.keys(tbl.rows[0]).filter((k) => k !== 'raw_json' && k !== 'payload_json') : [];
                  return (
                    <div
                      key={tbl.tableName}
                      className="bg-white border border-purple-200 rounded-xl overflow-hidden shadow-xs"
                    >
                      <div className="px-4 py-3 bg-[#3B0764] text-white flex items-center justify-between">
                        <div className="font-mono text-xs font-bold">
                          Table: <span className="text-amber-300">production.{tbl.tableName}</span>
                        </div>
                        <span className="text-xs font-mono text-purple-200">
                          {tbl.rows.length} record(s)
                        </span>
                      </div>
                      {tbl.rows.length === 0 ? (
                        <div className="p-4 text-xs text-slate-500">No rows in {tbl.tableName}</div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs font-mono">
                            <thead>
                              <tr className="bg-purple-50 border-b border-purple-200 text-[#3B0764]">
                                {cols.map((c) => (
                                  <th key={c} className="py-2 px-3 whitespace-nowrap">
                                    {c}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-purple-100">
                              {tbl.rows.map((row, idx) => (
                                <tr key={idx} className="hover:bg-orange-50/40">
                                  {cols.map((c) => (
                                    <td key={c} className="py-2 px-3 text-slate-800 whitespace-nowrap">
                                      {String(row[c] ?? '')}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
