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
  const [reportData, setReportData] =useState<{
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
    <div className="flex-1 overflow-y-auto bg-[#FDE2EF] p-6 text-[#38001E]">
      <div className="max-w-[1440px] mx-auto space-y-6">
        {/* Top Banner in 8-Plate Glossy Magenta-to-Blush */}
        <div className="rounded-2xl hd-gloss-banner text-white p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-2 border-[#F595C3]">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-black tracking-tight drop-shadow-xs">
              All 16 Department Production &amp; Shift Reports
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={loadReports}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#FDE2EF] hover:bg-white text-[#38001E] text-xs font-black shadow-xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#9E0059] ${loading ? 'animate-spin' : ''}`} />
              Refresh Report
            </button>
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#F9BCDA] hover:bg-[#F595C3] border border-white text-[#38001E] text-xs font-black shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#9E0059]" />
              Export Excel / CSV
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white text-[#38001E] hover:bg-[#FDE2EF] text-xs font-black shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#9E0059]" />
              Print
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="hd-gloss-card rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
          <div className="lg:col-span-2">
            <label className="block text-xs font-black text-[#38001E] mb-1">
              <Filter className="w-3.5 h-3.5 inline mr-1 text-[#9E0059]" />
              Select Department Form (1–16)
            </label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 text-xs font-black border-2 border-[#EC69A8] rounded-lg bg-white text-[#38001E] focus:outline-none focus:border-[#9E0059]"
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
            <label className="block text-xs font-black text-[#38001E] mb-1">
              <Calendar className="w-3.5 h-3.5 inline mr-1 text-[#9E0059]" />
              From Date
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-2 text-xs font-black border-2 border-[#EC69A8] rounded-lg bg-white text-[#38001E]"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-[#38001E] mb-1">
              <Calendar className="w-3.5 h-3.5 inline mr-1 text-[#9E0059]" />
              To Date
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3 py-2 text-xs font-black border-2 border-[#EC69A8] rounded-lg bg-white text-[#38001E]"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-[#38001E] mb-1">Shift</label>
            <select
              value={shiftFilter}
              onChange={(e) => setShiftFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs font-black border-2 border-[#EC69A8] rounded-lg bg-white text-[#38001E]"
            >
              <option value="all">All Shifts (A / B / C)</option>
              <option value="a">Shift A</option>
              <option value="b">Shift B</option>
              <option value="c">Shift C</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-black text-[#38001E] mb-1">Search Keyword</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#9E0059] absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Machine, Quality, Name..."
                className="w-full pl-8 pr-2.5 py-2 text-xs font-black border-2 border-[#EC69A8] rounded-lg bg-white text-[#38001E]"
              />
            </div>
          </div>
        </div>

        {/* Department Summary Cards Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-sm font-black text-[#38001E] uppercase tracking-wider">
              Department-Wise Summary
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('unified')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-black cursor-pointer transition-all ${
                  viewMode === 'unified'
                    ? 'hd-gloss-btn text-white'
                    : 'bg-white border-2 border-[#EC69A8] text-[#38001E] hover:bg-[#F9BCDA]'
                }`}
              >
                <Layers className="w-3.5 h-3.5 inline mr-1" />
                Unified Report Table ({filteredRecords.length})
              </button>
              <button
                onClick={() => setViewMode('raw_tables')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-black cursor-pointer transition-all ${
                  viewMode === 'raw_tables'
                    ? 'hd-gloss-btn text-white'
                    : 'bg-white border-2 border-[#EC69A8] text-[#38001E] hover:bg-[#F9BCDA]'
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
                  className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'hd-gloss-banner text-white border-[#9E0059] shadow-md'
                      : 'hd-gloss-card hover:bg-[#F9BCDA]/60 border-[#EC69A8] text-[#38001E]'
                  }`}
                >
                  <div>
                    <div
                      className={`text-[10px] font-black uppercase tracking-wider truncate ${
                        isSelected ? 'text-[#FDE2EF]' : 'text-[#9E0059]'
                      }`}
                    >
                      {dept.category.split(' ')[0]}
                    </div>
                    <div className="font-black text-xs mt-0.5 truncate">{dept.shortName}</div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-current/20 flex items-end justify-between">
                    <div>
                      <div className="text-sm font-black font-mono tabular-nums">
                        {dept.totalPrimary}
                      </div>
                      <div
                        className={`text-[10px] font-extrabold ${
                          isSelected ? 'text-[#FDE2EF]' : 'text-[#38001E]'
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
                          ? 'bg-white/25 text-white hover:bg-white/40'
                          : 'bg-[#F9BCDA] text-[#38001E] hover:bg-[#F595C3]'
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
          <div className="hd-gloss-card rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 bg-gradient-to-r from-[#F9BCDA] via-[#FDE2EF] to-[#FFFFFF] border-b-2 border-[#EC69A8] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-[#38001E]">
                  {selectedDept === 'all'
                    ? 'Master Production Report (All 16 Departments)'
                    : `Department Report: ${
                        reportData.departmentSummaries.find((d) => d.moduleKey === selectedDept)?.name ||
                        selectedDept
                      }`}
                </h3>
                <p className="text-xs font-extrabold text-[#38001E]">
                  Showing <strong className="font-mono font-black text-[#9E0059]">{filteredRecords.length}</strong> records from the <code className="font-mono font-black text-[#9E0059]">production</code> database
                </p>
              </div>
              {selectedDept !== 'all' && (
                <button
                  onClick={() => onOpenDepartmentForm(selectedDept)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg hd-gloss-btn text-white text-xs font-black cursor-pointer"
                >
                  Open {selectedDept.toUpperCase()} Entry Form
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="overflow-x-auto bg-white">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="hd-gloss-banner text-white text-[11px] font-black uppercase tracking-wider">
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
                <tbody className="divide-y divide-[#F595C3] text-xs font-extrabold text-[#38001E]">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-10 text-center font-black text-[#38001E]">
                        No report records match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((r) => (
                      <tr key={r.id} className="hover:bg-[#FDE2EF] transition-colors">
                        <td className="py-2.5 px-4 font-mono font-black text-[#38001E] whitespace-nowrap">
                          {r.date}
                        </td>
                        <td className="py-2.5 px-3 font-black text-[#9E0059]">{r.shift}</td>
                        <td className="py-2.5 px-4 font-black text-[#38001E]">{r.department}</td>
                        <td className="py-2.5 px-3 font-mono font-black text-[#38001E]">{r.machine}</td>
                        <td className="py-2.5 px-4 font-extrabold text-[#38001E]">{r.quality}</td>
                        <td className="py-2.5 px-4 font-extrabold text-[#38001E]">{r.operator}</td>
                        <td className="py-2.5 px-4 text-right font-mono font-black text-[#38001E] tabular-nums">
                          {r.primaryVal} <span className="text-[11px] font-extrabold text-[#9E0059]">{r.primaryLabel}</span>
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-black text-[#38001E] tabular-nums">
                          {r.secondaryVal ? (
                            <>
                              {r.secondaryVal}{' '}
                              <span className="text-[11px] font-extrabold text-[#9E0059]">{r.secondaryLabel}</span>
                            </>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-[11px] font-mono font-bold text-[#38001E]">
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
                      className="hd-gloss-card rounded-xl overflow-hidden"
                    >
                      <div className="px-4 py-3 hd-gloss-banner text-white flex items-center justify-between">
                        <div className="font-mono text-xs font-black">
                          Table: <span className="text-[#FDE2EF]">production.{tbl.tableName}</span>
                        </div>
                        <span className="text-xs font-mono font-black text-[#FDE2EF]">
                          {tbl.rows.length} record(s)
                        </span>
                      </div>
                      {tbl.rows.length === 0 ? (
                        <div className="p-4 text-xs font-black text-[#38001E] bg-white">No rows in {tbl.tableName}</div>
                      ) : (
                        <div className="overflow-x-auto bg-white">
                          <table className="w-full text-left border-collapse text-xs font-mono">
                            <thead>
                              <tr className="bg-[#F9BCDA] border-b-2 border-[#EC69A8] text-[#38001E] font-black">
                                {cols.map((c) => (
                                  <th key={c} className="py-2.5 px-3 whitespace-nowrap">
                                    {c}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F595C3] font-extrabold text-[#38001E]">
                              {tbl.rows.map((row, idx) => (
                                <tr key={idx} className="hover:bg-[#FDE2EF]">
                                  {cols.map((c) => (
                                    <td key={c} className="py-2 px-3 whitespace-nowrap">
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
