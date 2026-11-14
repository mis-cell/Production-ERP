import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Cpu,
  Award,
  UserCheck,
  AlertTriangle,
  GitCompare,
  PackageCheck,
  BarChart3,
  Clock,
} from 'lucide-react';

interface ReportSectionProps {
  userId: number;
  initialDepartment?: string;
  onOpenDepartmentForm: (moduleKey: string) => void;
}

type ReportTypeKey =
  | 'table_field_explorer'
  | 'daily_shift_matrix'
  | 'dept_executive'
  | 'machine_loom_wise'
  | 'quality_color_wise'
  | 'operator_weaver_wise'
  | 'breakdown_detention'
  | 'beaming_rounds_po'
  | 'stock_roll_bales'
  | 'unified_chronological';

const REPORT_TYPE_TABS: {
  key: ReportTypeKey;
  shortLabel: string;
  fullTitle: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  {
    key: 'table_field_explorer',
    shortLabel: '1. Table & Field-Wise Report',
    fullTitle: 'Table & Field-Wise Complete Report (All 47 Tables & Every Field)',
    icon: TableIcon,
  },
  {
    key: 'daily_shift_matrix',
    shortLabel: '2. Date & Shift (A/B/C) Matrix',
    fullTitle: 'Date & Shift-Wise (Shift A / B / C) Production Comparison Register',
    icon: Clock,
  },
  {
    key: 'dept_executive',
    shortLabel: '3. Department Summary (1–16)',
    fullTitle: 'Executive Summary Report Across All 16 Mill Departments',
    icon: BarChart3,
  },
  {
    key: 'machine_loom_wise',
    shortLabel: '4. Machine / Loom / Frame Wise',
    fullTitle: 'Machine, Loom, Spinning Frame & Press Wise Performance Report',
    icon: Cpu,
  },
  {
    key: 'quality_color_wise',
    shortLabel: '5. Quality / Count / Color Wise',
    fullTitle: 'Quality, Count, Grade Mix & Order Color Wise Production Report',
    icon: Award,
  },
  {
    key: 'operator_weaver_wise',
    shortLabel: '6. Operator / Weaver / Supervisor',
    fullTitle: 'Operator, Weaver & Supervisor Wise Output & Attendance Report',
    icon: UserCheck,
  },
  {
    key: 'breakdown_detention',
    shortLabel: '7. Breakdown & Detention',
    fullTitle: 'Machine Breakdown, Stoppage Duration & Detention Analysis Report',
    icon: AlertTriangle,
  },
  {
    key: 'beaming_rounds_po',
    shortLabel: '8. Beaming Rounds, Verify & PO',
    fullTitle: 'Beaming Rounds, Meter Verification Variance & Purchase Order Report',
    icon: GitCompare,
  },
  {
    key: 'stock_roll_bales',
    shortLabel: '9. Pile Stock, Rolls & Press Bales',
    fullTitle: 'Carding Pile Stock, Spreader Rolls & Press Bale Packing Register',
    icon: PackageCheck,
  },
  {
    key: 'unified_chronological',
    shortLabel: '10. Master Chronological Ledger',
    fullTitle: 'Master Unified Chronological Production & Logbook Ledger',
    icon: Layers,
  },
];

export const ReportSection: React.FC<ReportSectionProps> = ({
  userId,
  initialDepartment = 'all',
  onOpenDepartmentForm,
}) => {
  const [reportType, setReportType] = useState<ReportTypeKey>('table_field_explorer');
  const [selectedDept, setSelectedDept] = useState<string>(initialDepartment);
  const [selectedTable, setSelectedTable] = useState<string>('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [shiftFilter, setShiftFilter] = useState<string>('all');
  const [machineFilter, setMachineFilter] = useState<string>('all');
  const [qualityFilter, setQualityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(true);
  const [reportData, setReportData] = useState<{
    reportableModules: {
      key: string;
      name: string;
      shortName: string;
      category: string;
      tables: string[];
    }[];
    departmentSummaries: {
      moduleKey: string;
      name: string;
      shortName: string;
      category: string;
      recordCount: number;
      shiftACount: number;
      shiftBCount: number;
      shiftCCount: number;
      totalPrimary: number;
      primaryUnit: string;
      totalSecondary: number;
      secondaryUnit: string;
      breakdownMins: number;
      tables: string[];
    }[];
    records: any[];
    rawTablesByModule: Record<
      string,
      {
        tableName: string;
        moduleName: string;
        columns: { name: string; type: string; pk: boolean }[];
        rows: any[];
      }[]
    >;
  }>({
    reportableModules: [],
    departmentSummaries: [],
    records: [],
    rawTablesByModule: {},
  });

  useEffect(() => {
    setSelectedDept(initialDepartment || 'all');
    setSelectedTable('all');
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
      if (!res.ok) return;
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

  // Available tables for the currently selected department(s)
  const availableTables = useMemo(() => {
    const list: { tableName: string; moduleName: string; rowCount: number }[] = [];
    for (const [modKey, tables] of Object.entries(reportData.rawTablesByModule)) {
      if (selectedDept !== 'all' && modKey !== selectedDept) continue;
      for (const t of tables) {
        list.push({
          tableName: t.tableName,
          moduleName: t.moduleName,
          rowCount: t.rows.length,
        });
      }
    }
    return list;
  }, [reportData.rawTablesByModule, selectedDept]);

  // Auto-populated distinct Machines and Qualities from current dataset
  const distinctMachines = useMemo(() => {
    const s = new Set<string>();
    for (const r of reportData.records) {
      if (r.machine && r.machine !== '-') s.add(r.machine);
    }
    return Array.from(s).sort();
  }, [reportData.records]);

  const distinctQualities = useMemo(() => {
    const s = new Set<string>();
    for (const r of reportData.records) {
      if (r.quality && r.quality !== '-') s.add(r.quality);
    }
    return Array.from(s).sort();
  }, [reportData.records]);

  // Filtered unified records
  const filteredRecords = useMemo(() => {
    return reportData.records.filter((r) => {
      if (selectedTable !== 'all' && r.tableName !== selectedTable) return false;
      if (machineFilter !== 'all' && r.machine !== machineFilter) return false;
      if (qualityFilter !== 'all' && r.quality !== qualityFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const flatStr = r.flatFields ? JSON.stringify(r.flatFields).toLowerCase() : '';
      return (
        String(r.department || '').toLowerCase().includes(q) ||
        String(r.machine || '').toLowerCase().includes(q) ||
        String(r.quality || '').toLowerCase().includes(q) ||
        String(r.operator || '').toLowerCase().includes(q) ||
        String(r.tableName || '').toLowerCase().includes(q) ||
        String(r.date || '').toLowerCase().includes(q) ||
        String(r.beamOrRound || '').toLowerCase().includes(q) ||
        String(r.remarks || '').toLowerCase().includes(q) ||
        flatStr.includes(q)
      );
    });
  }, [reportData.records, selectedTable, machineFilter, qualityFilter, searchQuery]);

  // Filtered raw tables for Table & Field-Wise Explorer
  const filteredRawTables = useMemo(() => {
    const out: {
      moduleKey: string;
      moduleName: string;
      tableName: string;
      columns: { name: string; type: string; pk: boolean }[];
      rows: any[];
    }[] = [];

    const q = searchQuery.trim().toLowerCase();
    for (const [modKey, tables] of Object.entries(reportData.rawTablesByModule)) {
      if (selectedDept !== 'all' && modKey !== selectedDept) continue;
      for (const tbl of tables) {
        if (selectedTable !== 'all' && tbl.tableName !== selectedTable) continue;
        const rows = tbl.rows.filter((row) => {
          if (machineFilter !== 'all') {
            const m = String(
              row.machine_no || row.loom_no || row.frame_no || row.press_no || row.machine || ''
            );
            if (m !== machineFilter) return false;
          }
          if (qualityFilter !== 'all') {
            const ql = String(
              row.quality || row.quality_count || row.order_color || row.grade_mix || row.pile_type || ''
            );
            if (ql !== qualityFilter) return false;
          }
          if (!q) return true;
          return JSON.stringify(row).toLowerCase().includes(q);
        });

        out.push({
          moduleKey: modKey,
          moduleName: tbl.moduleName,
          tableName: tbl.tableName,
          columns: tbl.columns,
          rows,
        });
      }
    }
    return out;
  }, [reportData.rawTablesByModule, selectedDept, selectedTable, machineFilter, qualityFilter, searchQuery]);

  // 2. Date & Shift-Wise Matrix Aggregation
  const dailyShiftMatrix = useMemo(() => {
    const map = new Map<
      string,
      {
        key: string;
        date: string;
        department: string;
        primaryLabel: string;
        secondaryLabel: string;
        shiftAPrimary: number;
        shiftBPrimary: number;
        shiftCPrimary: number;
        generalPrimary: number;
        totalPrimary: number;
        totalSecondary: number;
        breakdownMins: number;
        recordCount: number;
        machines: Set<string>;
      }
    >();

    for (const r of filteredRecords) {
      const k = `${r.date}__${r.department}`;
      if (!map.has(k)) {
        map.set(k, {
          key: k,
          date: r.date,
          department: r.department,
          primaryLabel: r.primaryLabel || 'Units',
          secondaryLabel: r.secondaryLabel || 'Units',
          shiftAPrimary: 0,
          shiftBPrimary: 0,
          shiftCPrimary: 0,
          generalPrimary: 0,
          totalPrimary: 0,
          totalSecondary: 0,
          breakdownMins: 0,
          recordCount: 0,
          machines: new Set<string>(),
        });
      }
      const item = map.get(k)!;
      const val = r.primaryLabel === 'Down Mins' ? 0 : Number(r.primaryVal || 0);
      if (r.shift === 'A') item.shiftAPrimary += val;
      else if (r.shift === 'B') item.shiftBPrimary += val;
      else if (r.shift === 'C') item.shiftCPrimary += val;
      else item.generalPrimary += val;

      item.totalPrimary += val;
      item.totalSecondary += Number(r.secondaryVal || 0);
      item.breakdownMins += Number(r.breakdownMins || 0);
      item.recordCount += 1;
      if (r.machine && r.machine !== '-') item.machines.add(r.machine);
    }

    return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredRecords]);

  // 4. Machine / Loom / Frame Wise Aggregation
  const machineWiseRows = useMemo(() => {
    const map = new Map<
      string,
      {
        key: string;
        department: string;
        machine: string;
        entries: number;
        totalPrimary: number;
        primaryLabel: string;
        totalSecondary: number;
        secondaryLabel: string;
        effSum: number;
        effCount: number;
        breakdownMins: number;
        qualities: Set<string>;
        lastDate: string;
      }
    >();

    for (const r of filteredRecords) {
      const mName = r.machine && r.machine !== '-' ? r.machine : 'General / Unspecified';
      const k = `${r.department}__${mName}`;
      if (!map.has(k)) {
        map.set(k, {
          key: k,
          department: r.department,
          machine: mName,
          entries: 0,
          totalPrimary: 0,
          primaryLabel: r.primaryLabel || 'Units',
          totalSecondary: 0,
          secondaryLabel: r.secondaryLabel || '',
          effSum: 0,
          effCount: 0,
          breakdownMins: 0,
          qualities: new Set<string>(),
          lastDate: r.date,
        });
      }
      const item = map.get(k)!;
      item.entries += 1;
      if (r.primaryLabel !== 'Down Mins') {
        item.totalPrimary += Number(r.primaryVal || 0);
      }
      item.totalSecondary += Number(r.secondaryVal || 0);
      if (r.efficiencyVal > 0) {
        item.effSum += Number(r.efficiencyVal);
        item.effCount += 1;
      }
      item.breakdownMins += Number(r.breakdownMins || 0);
      if (r.quality && r.quality !== '-') item.qualities.add(r.quality);
      if (r.date > item.lastDate) item.lastDate = r.date;
    }

    return Array.from(map.values()).sort((a, b) => b.totalPrimary - a.totalPrimary);
  }, [filteredRecords]);

  // 5. Quality / Count / Order Color Wise Aggregation
  const qualityWiseRows = useMemo(() => {
    const map = new Map<
      string,
      {
        key: string;
        department: string;
        quality: string;
        entries: number;
        totalPrimary: number;
        primaryLabel: string;
        totalSecondary: number;
        secondaryLabel: string;
        machinesCount: Set<string>;
      }
    >();

    for (const r of filteredRecords) {
      const qName = r.quality && r.quality !== '-' ? r.quality : 'Standard / General';
      const k = `${r.department}__${qName}`;
      if (!map.has(k)) {
        map.set(k, {
          key: k,
          department: r.department,
          quality: qName,
          entries: 0,
          totalPrimary: 0,
          primaryLabel: r.primaryLabel || 'Units',
          totalSecondary: 0,
          secondaryLabel: r.secondaryLabel || '',
          machinesCount: new Set<string>(),
        });
      }
      const item = map.get(k)!;
      item.entries += 1;
      if (r.primaryLabel !== 'Down Mins') {
        item.totalPrimary += Number(r.primaryVal || 0);
      }
      item.totalSecondary += Number(r.secondaryVal || 0);
      if (r.machine && r.machine !== '-') item.machinesCount.add(r.machine);
    }

    return Array.from(map.values()).sort((a, b) => b.totalPrimary - a.totalPrimary);
  }, [filteredRecords]);

  // 6. Operator / Weaver / Supervisor Wise Aggregation
  const operatorWiseRows = useMemo(() => {
    const map = new Map<
      string,
      {
        key: string;
        operator: string;
        department: string;
        entries: number;
        shifts: Set<string>;
        machines: Set<string>;
        totalPrimary: number;
        primaryLabel: string;
        totalSecondary: number;
        secondaryLabel: string;
        effSum: number;
        effCount: number;
      }
    >();

    for (const r of filteredRecords) {
      const opName = r.operator && r.operator !== '-' ? r.operator : 'Shift Staff';
      const k = `${r.department}__${opName}`;
      if (!map.has(k)) {
        map.set(k, {
          key: k,
          operator: opName,
          department: r.department,
          entries: 0,
          shifts: new Set<string>(),
          machines: new Set<string>(),
          totalPrimary: 0,
          primaryLabel: r.primaryLabel || 'Units',
          totalSecondary: 0,
          secondaryLabel: r.secondaryLabel || '',
          effSum: 0,
          effCount: 0,
        });
      }
      const item = map.get(k)!;
      item.entries += 1;
      item.shifts.add(`${r.date}-${r.shift}`);
      if (r.machine && r.machine !== '-') item.machines.add(r.machine);
      if (r.primaryLabel !== 'Down Mins') {
        item.totalPrimary += Number(r.primaryVal || 0);
      }
      item.totalSecondary += Number(r.secondaryVal || 0);
      if (r.efficiencyVal > 0) {
        item.effSum += Number(r.efficiencyVal);
        item.effCount += 1;
      }
    }

    return Array.from(map.values()).sort((a, b) => b.totalPrimary - a.totalPrimary);
  }, [filteredRecords]);

  // 7. Breakdown & Detention Rows
  const breakdownRows = useMemo(() => {
    return filteredRecords.filter(
      (r) =>
        r.tableName.includes('breakdown') ||
        r.breakdownMins > 0 ||
        r.primaryLabel === 'Down Mins' ||
        (r.flatFields && (r.flatFields.stop_time || r.flatFields.down_mins || r.flatFields.duration_mins))
    );
  }, [filteredRecords]);

  // 8. Beaming Rounds, Verification & Purchase Orders Tables
  const beamingAndPoTables = useMemo(() => {
    return filteredRawTables.filter(
      (t) =>
        t.tableName.includes('rounds') ||
        t.tableName.includes('verification') ||
        t.tableName.includes('purchase_orders') ||
        t.tableName.includes('beaming_production')
    );
  }, [filteredRawTables]);

  // 9. Stock, Spreader Rolls & Press Bales Tables
  const stockAndBaleTables = useMemo(() => {
    return filteredRawTables.filter(
      (t) =>
        t.tableName.includes('pile_stock') ||
        t.tableName.includes('meter_reading') ||
        t.tableName.includes('roll_production') ||
        t.tableName.includes('press_bales')
    );
  }, [filteredRawTables]);

  // Export CSV based on currently active report type
  const handleExportCsv = () => {
    let csvLines: string[] = [];

    if (reportType === 'table_field_explorer') {
      for (const tbl of filteredRawTables) {
        csvLines.push(`"=== TABLE: production.${tbl.tableName} (${tbl.moduleName}) ==="`);
        const colNames = tbl.columns.map((c) => c.name);
        csvLines.push(colNames.map((c) => `"${c}"`).join(','));
        for (const row of tbl.rows) {
          csvLines.push(
            colNames
              .map((c) => `"${String(row[c] ?? '').replace(/"/g, '""')}"`)
              .join(',')
          );
        }
        csvLines.push('');
      }
    } else if (reportType === 'daily_shift_matrix') {
      csvLines.push(
        [
          'Date',
          'Department',
          'Shift A Output',
          'Shift B Output',
          'Shift C Output',
          'General Output',
          'Total Primary Output',
          'Unit',
          'Total Secondary Output',
          'Breakdown Mins',
          'Entries',
        ].join(',')
      );
      for (const r of dailyShiftMatrix) {
        csvLines.push(
          [
            `"${r.date}"`,
            `"${r.department}"`,
            r.shiftAPrimary.toFixed(2),
            r.shiftBPrimary.toFixed(2),
            r.shiftCPrimary.toFixed(2),
            r.generalPrimary.toFixed(2),
            r.totalPrimary.toFixed(2),
            `"${r.primaryLabel}"`,
            r.totalSecondary.toFixed(2),
            r.breakdownMins.toFixed(2),
            r.recordCount,
          ].join(',')
        );
      }
    } else if (reportType === 'machine_loom_wise') {
      csvLines.push(
        [
          'Department',
          'Machine / Loom / Frame',
          'Entries',
          'Total Primary Output',
          'Primary Unit',
          'Total Secondary Output',
          'Avg Efficiency %',
          'Breakdown Mins',
          'Last Active Date',
        ].join(',')
      );
      for (const m of machineWiseRows) {
        csvLines.push(
          [
            `"${m.department}"`,
            `"${m.machine}"`,
            m.entries,
            m.totalPrimary.toFixed(2),
            `"${m.primaryLabel}"`,
            m.totalSecondary.toFixed(2),
            m.effCount > 0 ? (m.effSum / m.effCount).toFixed(2) : '0',
            m.breakdownMins.toFixed(2),
            `"${m.lastDate}"`,
          ].join(',')
        );
      }
    } else if (reportType === 'quality_color_wise') {
      csvLines.push(
        [
          'Department',
          'Quality / Count / Color',
          'Entries',
          'Machines Count',
          'Total Primary Output',
          'Primary Unit',
          'Total Secondary Output',
        ].join(',')
      );
      for (const q of qualityWiseRows) {
        csvLines.push(
          [
            `"${q.department}"`,
            `"${q.quality}"`,
            q.entries,
            q.machinesCount.size,
            q.totalPrimary.toFixed(2),
            `"${q.primaryLabel}"`,
            q.totalSecondary.toFixed(2),
          ].join(',')
        );
      }
    } else if (reportType === 'operator_weaver_wise') {
      csvLines.push(
        [
          'Operator / Weaver / Supervisor',
          'Department',
          'Shifts Worked',
          'Entries',
          'Machines Operated',
          'Total Primary Output',
          'Unit',
          'Total Secondary Output',
        ].join(',')
      );
      for (const op of operatorWiseRows) {
        csvLines.push(
          [
            `"${op.operator}"`,
            `"${op.department}"`,
            op.shifts.size,
            op.entries,
            `"${Array.from(op.machines).join('; ')}"`,
            op.totalPrimary.toFixed(2),
            `"${op.primaryLabel}"`,
            op.totalSecondary.toFixed(2),
          ].join(',')
        );
      }
    } else {
      const headers = [
        'Date',
        'Shift',
        'Department',
        'SQL Table',
        'Machine/Loom',
        'Beam/Round/Bale',
        'Quality/Order',
        'Operator/Supervisor',
        'Primary Output',
        'Unit',
        'Secondary Output',
        'Secondary Unit',
        'Efficiency %',
        'Breakdown Mins',
        'Remarks',
      ];
      csvLines.push(headers.join(','));
      for (const r of filteredRecords) {
        csvLines.push(
          [
            `"${r.date}"`,
            `"${r.shift}"`,
            `"${r.department}"`,
            `"${r.tableName}"`,
            `"${r.machine}"`,
            `"${r.beamOrRound || '-'}"`,
            `"${r.quality}"`,
            `"${r.operator}"`,
            r.primaryVal,
            `"${r.primaryLabel}"`,
            r.secondaryVal,
            `"${r.secondaryLabel}"`,
            r.efficiencyVal,
            r.breakdownMins,
            `"${String(r.remarks || '').replace(/"/g, '""')}"`,
          ].join(',')
        );
      }
    }

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bally_jute_${reportType}_${selectedDept}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeReportMeta =
    REPORT_TYPE_TABS.find((t) => t.key === reportType) || REPORT_TYPE_TABS[0];

  return (
    <div className="flex-1 overflow-y-auto bg-[#FAF7FD] p-5 text-[#1E0538]">
      <div className="max-w-[1480px] mx-auto space-y-5">
        {/* Top YAJUR Banner */}
        <div className="rounded-2xl yajur-banner p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">
              Central Production, Table &amp; Field Report Center (All 16 Departments)
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={loadReports}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white/15 hover:bg-white/25 border border-white/25 text-white text-xs font-semibold cursor-pointer transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#FDE68A] ${loading ? 'animate-spin' : ''}`} />
              Refresh Live Data
            </button>
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#3B0764] hover:bg-[#4C1D95] border border-white/25 text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#FDE68A]" />
              Export Current Report (CSV / Excel)
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white/15 border border-white/25 text-white hover:bg-white/25 text-xs font-semibold cursor-pointer transition-colors"
            >
              <Printer className="w-4 h-4 text-white" />
              Print / PDF
            </button>
          </div>
        </div>

        {/* 10 Report Type Selector Tabs */}
        <div className="bg-white border border-[#E9D5FF] rounded-2xl shadow-xs p-3.5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#6B21A8] mb-2.5 px-1">
            Select Report Type (10 Complete Report Views Available):
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {REPORT_TYPE_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = reportType === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setReportType(tab.key)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'yajur-active-tab text-white'
                      : 'bg-[#FAF5FF] hover:bg-[#F3E8FF] text-[#240046] border border-[#E9D5FF]'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#FDE68A]' : 'text-[#9D174D]'}`} />
                  <span className="truncate">{tab.shortLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Comprehensive Multi-Dimension Filter Bar */}
        <div className="bg-white border border-[#E9D5FF] rounded-2xl shadow-xs p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#3B0764] mb-1">
                <Filter className="w-3.5 h-3.5 inline mr-1 text-[#9D174D]" />
                1. Department (1–16)
              </label>
              <select
                value={selectedDept}
                onChange={(e) => {
                  setSelectedDept(e.target.value);
                  setSelectedTable('all');
                }}
                className="w-full px-3 py-2 text-xs font-semibold border border-[#D8B4FE] rounded-lg bg-white text-[#240046] focus:outline-none focus:border-[#9D174D]"
              >
                <option value="all">All 16 Departments (Master Combined)</option>
                {reportData.reportableModules.map((m, idx) => (
                  <option key={m.key} value={m.key}>
                    {idx + 1}. {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3B0764] mb-1">
                <TableIcon className="w-3.5 h-3.5 inline mr-1 text-[#9D174D]" />
                2. Database Table ({availableTables.length} Tables)
              </label>
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold border border-[#D8B4FE] rounded-lg bg-white text-[#240046] focus:outline-none focus:border-[#9D174D]"
              >
                <option value="all">All Tables ({availableTables.length})</option>
                {availableTables.map((t) => (
                  <option key={t.tableName} value={t.tableName}>
                    {t.tableName} ({t.moduleName} · {t.rowCount} rows)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3B0764] mb-1">
                <Calendar className="w-3.5 h-3.5 inline mr-1 text-[#9D174D]" />
                3. From Date
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold border border-[#D8B4FE] rounded-lg bg-white text-[#240046] focus:outline-none focus:border-[#9D174D]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3B0764] mb-1">
                <Calendar className="w-3.5 h-3.5 inline mr-1 text-[#9D174D]" />
                4. To Date
              </label>
              <div className="flex gap-1.5">
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs font-semibold border border-[#D8B4FE] rounded-lg bg-white text-[#240046] focus:outline-none focus:border-[#9D174D]"
                />
                {(fromDate || toDate) && (
                  <button
                    type="button"
                    onClick={() => {
                      setFromDate('');
                      setToDate('');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#FAF5FF] border border-[#D8B4FE] text-[11px] font-bold text-[#3B0764] hover:bg-[#F3E8FF] cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-[#3B0764] mb-1">
                5. Shift (A / B / C)
              </label>
              <select
                value={shiftFilter}
                onChange={(e) => setShiftFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold border border-[#D8B4FE] rounded-lg bg-white text-[#240046] focus:outline-none focus:border-[#9D174D]"
              >
                <option value="all">All Shifts (A + B + C)</option>
                <option value="a">Shift A Only</option>
                <option value="b">Shift B Only</option>
                <option value="c">Shift C Only</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3B0764] mb-1">
                6. Machine / Loom / Frame
              </label>
              <select
                value={machineFilter}
                onChange={(e) => setMachineFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold border border-[#D8B4FE] rounded-lg bg-white text-[#240046] focus:outline-none focus:border-[#9D174D]"
              >
                <option value="all">All Machines / Looms ({distinctMachines.length})</option>
                {distinctMachines.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3B0764] mb-1">
                7. Quality / Count / Color
              </label>
              <select
                value={qualityFilter}
                onChange={(e) => setQualityFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold border border-[#D8B4FE] rounded-lg bg-white text-[#240046] focus:outline-none focus:border-[#9D174D]"
              >
                <option value="all">All Qualities / Specs ({distinctQualities.length})</option>
                {distinctQualities.map((q) => (
                  <option key={q} value={q}>
                    {q}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3B0764] mb-1">
                8. Search Any Field / Operator / Bale / Beam
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#9333EA] absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search any value across fields..."
                  className="w-full pl-8 pr-2.5 py-2 text-xs font-semibold border border-[#D8B4FE] rounded-lg bg-white text-[#240046] focus:outline-none focus:border-[#9D174D]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Quick 16-Department Selector Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {reportData.departmentSummaries.map((dept) => {
            const isSelected = selectedDept === dept.moduleKey;
            return (
              <div
                key={dept.moduleKey}
                onClick={() => {
                  setSelectedDept(isSelected ? 'all' : dept.moduleKey);
                  setSelectedTable('all');
                }}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#FAF5FF] text-[#240046] border-[#9D174D] shadow-xs'
                    : 'bg-white hover:bg-[#FAF5FF] border-[#E9D5FF] text-[#240046]'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-xs truncate">{dept.shortName}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenDepartmentForm(dept.moduleKey);
                    }}
                    title={`Open ${dept.shortName} Form`}
                    className="p-1 rounded bg-[#F3E8FF] hover:bg-[#E9D5FF] text-[#3B0764]"
                  >
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="mt-1.5 pt-1.5 border-t border-[#F3E8FF] flex items-baseline justify-between">
                  <span className="text-xs font-bold font-mono tabular-nums text-[#9D174D]">
                    {dept.totalPrimary} {dept.primaryUnit}
                  </span>
                  <span className="text-[10px] font-semibold text-[#6B21A8]">
                    {dept.recordCount} rec
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Active Report Header Bar */}
        <div className="px-4 py-3 rounded-2xl bg-white border border-[#E9D5FF] shadow-xs flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-[#240046]">{activeReportMeta.fullTitle}</h2>
            <div className="text-xs text-[#6B21A8] mt-0.5">
              Department:{' '}
              <strong className="font-bold text-[#240046]">
                {selectedDept === 'all'
                  ? 'All 16 Departments'
                  : reportData.departmentSummaries.find((d) => d.moduleKey === selectedDept)?.name ||
                    selectedDept}
              </strong>{' '}
              · Table:{' '}
              <strong className="font-bold text-[#240046]">
                {selectedTable === 'all' ? 'All Tables' : selectedTable}
              </strong>{' '}
              · Shift: <strong className="font-bold text-[#240046]">{shiftFilter.toUpperCase()}</strong>
            </div>
          </div>

          {selectedDept !== 'all' && (
            <button
              onClick={() => onOpenDepartmentForm(selectedDept)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#3B0764] hover:bg-[#4C1D95] text-white text-xs font-semibold cursor-pointer shadow-xs"
            >
              Open {selectedDept.toUpperCase()} Entry Form
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* =================================================================== */}
        {/* REPORT 1: TABLE & FIELD-WISE COMPLETE REPORT (ALL TABLES & FIELDS)  */}
        {/* =================================================================== */}
        {reportType === 'table_field_explorer' && (
          <div className="space-y-4">
            {filteredRawTables.map((tbl) => {
              const cols = tbl.columns;
              const numericTotals: Record<string, number> = {};
              for (const c of cols) {
                if (c.name === 'id' || c.name.endsWith('_id')) continue;
                let hasNum = false;
                let sum = 0;
                for (const r of tbl.rows) {
                  const v = r[c.name];
                  if (typeof v === 'number' && Number.isFinite(v)) {
                    hasNum = true;
                    sum += v;
                  } else if (
                    typeof v === 'string' &&
                    v.trim() !== '' &&
                    !isNaN(Number(v)) &&
                    !c.name.includes('date') &&
                    !c.name.includes('time') &&
                    !c.name.includes('no') &&
                    !c.name.includes('code') &&
                    !c.name.includes('serial')
                  ) {
                    hasNum = true;
                    sum += Number(v);
                  }
                }
                if (hasNum) {
                  numericTotals[c.name] = Number(sum.toFixed(2));
                }
              }

              return (
                <div key={tbl.tableName} className="bg-white border border-[#E9D5FF] rounded-2xl shadow-xs overflow-hidden">
                  <div className="px-4 py-3 bg-[#FAF5FF] border-b border-[#E9D5FF] text-[#240046] flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <TableIcon className="w-4 h-4 text-[#9D174D]" />
                      <span className="font-mono text-xs font-bold text-[#240046]">
                        {tbl.moduleName} &rarr;{' '}
                        <span className="text-[#9D174D] font-bold">production.{tbl.tableName}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-mono text-[#6B21A8]">
                      <span>{cols.length} Fields / Columns</span>
                      <span className="px-2 py-0.5 rounded bg-[#F3E8FF] border border-[#D8B4FE] text-[#3B0764] font-bold">
                        {tbl.rows.length} Record(s)
                      </span>
                    </div>
                  </div>

                  {tbl.rows.length === 0 ? (
                    <div className="p-4 text-xs text-[#6B21A8] bg-white">
                      No records currently stored in <code className="font-mono font-bold text-[#240046]">{tbl.tableName}</code>{' '}
                      for the selected filters.
                    </div>
                  ) : (
                    <div className="overflow-x-auto bg-white">
                      <table className="w-full text-left border-collapse text-xs font-mono">
                        <thead>
                          <tr className="bg-[#3B0764] text-white font-bold">
                            {cols.map((c) => (
                              <th key={c.name} className="py-2.5 px-3 whitespace-nowrap">
                                {c.name}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F3E8FF] text-[#1E0538]">
                          {tbl.rows.map((row, idx) => (
                            <tr key={idx} className="hover:bg-[#FAF5FF]">
                              {cols.map((c) => (
                                <td key={c.name} className="py-2 px-3 whitespace-nowrap">
                                  {String(row[c.name] ?? '')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                        {Object.keys(numericTotals).length > 0 && (
                          <tfoot>
                            <tr className="bg-[#FAF5FF] border-t-2 border-[#D8B4FE] font-bold text-[#240046]">
                              {cols.map((c, idx) => (
                                <td key={c.name} className="py-2.5 px-3 whitespace-nowrap">
                                  {idx === 0
                                    ? 'TOTAL'
                                    : numericTotals[c.name] !== undefined
                                    ? numericTotals[c.name]
                                    : ''}
                                </td>
                              ))}
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* =================================================================== */}
        {/* REPORT 2: DATE & SHIFT-WISE (SHIFT A / B / C) PRODUCTION MATRIX     */}
        {/* =================================================================== */}
        {reportType === 'daily_shift_matrix' && (
          <div className="bg-white border border-[#E9D5FF] rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#3B0764] text-white font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4 text-right">Shift A Output</th>
                    <th className="py-3 px-4 text-right">Shift B Output</th>
                    <th className="py-3 px-4 text-right">Shift C Output</th>
                    <th className="py-3 px-4 text-right">Total Output</th>
                    <th className="py-3 px-4 text-right">Secondary Output</th>
                    <th className="py-3 px-4 text-right">Breakdown Mins</th>
                    <th className="py-3 px-4 text-center">Machines</th>
                    <th className="py-3 px-4 text-center">Records</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3E8FF] text-[#1E0538]">
                  {dailyShiftMatrix.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-10 text-center text-[#6B21A8]">
                        No shift production records found for the selected filters.
                      </td>
                    </tr>
                  ) : (
                    dailyShiftMatrix.map((row) => (
                      <tr key={row.key} className="hover:bg-[#FAF5FF]">
                        <td className="py-2.5 px-4 font-mono font-bold text-[#240046]">{row.date}</td>
                        <td className="py-2.5 px-4 font-bold text-[#240046]">{row.department}</td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                          {row.shiftAPrimary.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                          {row.shiftBPrimary.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                          {row.shiftCPrimary.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-[#9D174D] tabular-nums">
                          {row.totalPrimary.toFixed(2)} {row.primaryLabel}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                          {row.totalSecondary.toFixed(2)} {row.secondaryLabel}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                          {row.breakdownMins.toFixed(0)} mins
                        </td>
                        <td className="py-2.5 px-4 text-center font-mono">{row.machines.size}</td>
                        <td className="py-2.5 px-4 text-center font-mono">{row.recordCount}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* REPORT 3: DEPARTMENT-WISE EXECUTIVE SUMMARY (ALL 16 DEPARTMENTS)    */}
        {/* =================================================================== */}
        {reportType === 'dept_executive' && (
          <div className="bg-white border border-[#E9D5FF] rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#3B0764] text-white font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Department (1–16)</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">SQL Tables</th>
                    <th className="py-3 px-3 text-center">Shift A</th>
                    <th className="py-3 px-3 text-center">Shift B</th>
                    <th className="py-3 px-3 text-center">Shift C</th>
                    <th className="py-3 px-3 text-center">Total Records</th>
                    <th className="py-3 px-4 text-right">Primary Output</th>
                    <th className="py-3 px-4 text-right">Secondary Output</th>
                    <th className="py-3 px-3 text-right">Downtime</th>
                    <th className="py-3 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3E8FF] text-[#1E0538]">
                  {reportData.departmentSummaries.map((d) => (
                    <tr key={d.moduleKey} className="hover:bg-[#FAF5FF]">
                      <td className="py-2.5 px-4 font-bold text-[#240046]">{d.shortName}</td>
                      <td className="py-2.5 px-3 text-[#6B21A8]">{d.category}</td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-[#6B21A8]">{d.tables.join(', ')}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{d.shiftACount}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{d.shiftBCount}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{d.shiftCCount}</td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-[#240046]">
                        {d.recordCount}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-[#9D174D]">
                        {d.totalPrimary} {d.primaryUnit}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono">
                        {d.totalSecondary} {d.secondaryUnit}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">{d.breakdownMins} m</td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => {
                            setSelectedDept(d.moduleKey);
                            setReportType('table_field_explorer');
                          }}
                          className="px-2.5 py-1 rounded bg-[#F3E8FF] hover:bg-[#E9D5FF] text-[#3B0764] border border-[#D8B4FE] font-bold text-[11px] cursor-pointer"
                        >
                          View Tables
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* REPORT 4: MACHINE / LOOM / FRAME / PRESS WISE PERFORMANCE REPORT    */}
        {/* =================================================================== */}
        {reportType === 'machine_loom_wise' && (
          <div className="bg-white border border-[#E9D5FF] rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#3B0764] text-white font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Machine / Loom / Frame No</th>
                    <th className="py-3 px-4">Qualities Run</th>
                    <th className="py-3 px-3 text-center">Entries</th>
                    <th className="py-3 px-4 text-right">Total Primary Output</th>
                    <th className="py-3 px-4 text-right">Total Secondary Output</th>
                    <th className="py-3 px-3 text-right">Avg Efficiency %</th>
                    <th className="py-3 px-3 text-right">Breakdown Mins</th>
                    <th className="py-3 px-4">Last Active Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3E8FF] text-[#1E0538]">
                  {machineWiseRows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-[#6B21A8]">
                        No machine/loom records match the current filters.
                      </td>
                    </tr>
                  ) : (
                    machineWiseRows.map((m) => (
                      <tr key={m.key} className="hover:bg-[#FAF5FF]">
                        <td className="py-2.5 px-4 font-bold text-[#240046]">{m.department}</td>
                        <td className="py-2.5 px-4 font-mono font-bold text-[#9D174D]">
                          {m.machine}
                        </td>
                        <td className="py-2.5 px-4">
                          {Array.from(m.qualities).join(', ') || '-'}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono">{m.entries}</td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-[#240046] tabular-nums">
                          {m.totalPrimary.toFixed(2)} {m.primaryLabel}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                          {m.totalSecondary.toFixed(2)} {m.secondaryLabel}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          {m.effCount > 0 ? `${(m.effSum / m.effCount).toFixed(1)}%` : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          {m.breakdownMins > 0 ? `${m.breakdownMins} mins` : '0'}
                        </td>
                        <td className="py-2.5 px-4 font-mono">{m.lastDate}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* REPORT 5: QUALITY / COUNT / ORDER COLOR WISE PRODUCTION REPORT      */}
        {/* =================================================================== */}
        {reportType === 'quality_color_wise' && (
          <div className="bg-white border border-[#E9D5FF] rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#3B0764] text-white font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Quality / Count / Order Color / Mix</th>
                    <th className="py-3 px-3 text-center">Entries</th>
                    <th className="py-3 px-3 text-center">Machines Allocated</th>
                    <th className="py-3 px-4 text-right">Total Primary Output</th>
                    <th className="py-3 px-4 text-right">Total Secondary Output</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3E8FF] text-[#1E0538]">
                  {qualityWiseRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-[#6B21A8]">
                        No quality records match the current filters.
                      </td>
                    </tr>
                  ) : (
                    qualityWiseRows.map((q) => (
                      <tr key={q.key} className="hover:bg-[#FAF5FF]">
                        <td className="py-2.5 px-4 font-bold text-[#240046]">{q.department}</td>
                        <td className="py-2.5 px-4 font-bold text-[#9D174D]">{q.quality}</td>
                        <td className="py-2.5 px-3 text-center font-mono">{q.entries}</td>
                        <td className="py-2.5 px-3 text-center font-mono">
                          {q.machinesCount.size}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-[#240046] tabular-nums">
                          {q.totalPrimary.toFixed(2)} {q.primaryLabel}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                          {q.totalSecondary.toFixed(2)} {q.secondaryLabel}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* REPORT 6: OPERATOR / WEAVER / SUPERVISOR WISE REPORT                */}
        {/* =================================================================== */}
        {reportType === 'operator_weaver_wise' && (
          <div className="bg-white border border-[#E9D5FF] rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#3B0764] text-white font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Operator / Weaver / Supervisor</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-3 text-center">Shifts Worked</th>
                    <th className="py-3 px-3 text-center">Entries</th>
                    <th className="py-3 px-4">Machines Operated</th>
                    <th className="py-3 px-4 text-right">Total Primary Output</th>
                    <th className="py-3 px-4 text-right">Total Secondary Output</th>
                    <th className="py-3 px-3 text-right">Avg Efficiency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3E8FF] text-[#1E0538]">
                  {operatorWiseRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-[#6B21A8]">
                        No operator/weaver records match the current filters.
                      </td>
                    </tr>
                  ) : (
                    operatorWiseRows.map((op) => (
                      <tr key={op.key} className="hover:bg-[#FAF5FF]">
                        <td className="py-2.5 px-4 font-bold text-[#9D174D]">{op.operator}</td>
                        <td className="py-2.5 px-4 font-bold text-[#240046]">{op.department}</td>
                        <td className="py-2.5 px-3 text-center font-mono">{op.shifts.size}</td>
                        <td className="py-2.5 px-3 text-center font-mono">{op.entries}</td>
                        <td className="py-2.5 px-4 font-mono">
                          {Array.from(op.machines).join(', ') || '-'}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-[#240046] tabular-nums">
                          {op.totalPrimary.toFixed(2)} {op.primaryLabel}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                          {op.totalSecondary.toFixed(2)} {op.secondaryLabel}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          {op.effCount > 0 ? `${(op.effSum / op.effCount).toFixed(1)}%` : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* REPORT 7: MACHINE BREAKDOWN & DETENTION ANALYSIS REPORT             */}
        {/* =================================================================== */}
        {reportType === 'breakdown_detention' && (
          <div className="bg-white border border-[#E9D5FF] rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#3B0764] text-white font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-3">Shift</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-3">Machine / Frame</th>
                    <th className="py-3 px-3">Stop Time</th>
                    <th className="py-3 px-3">Start Time</th>
                    <th className="py-3 px-4 text-right">Downtime (Mins)</th>
                    <th className="py-3 px-4">Breakdown Reason / Detention</th>
                    <th className="py-3 px-4">Source Table</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3E8FF] text-[#1E0538]">
                  {breakdownRows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-[#6B21A8]">
                        No machine breakdown or detention records found for the selected filters.
                      </td>
                    </tr>
                  ) : (
                    breakdownRows.map((r) => (
                      <tr key={r.id} className="hover:bg-[#FAF5FF]">
                        <td className="py-2.5 px-4 font-mono font-bold text-[#240046]">{r.date}</td>
                        <td className="py-2.5 px-3 font-bold text-[#9D174D]">{r.shift}</td>
                        <td className="py-2.5 px-4 font-bold text-[#240046]">{r.department}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-[#240046]">{r.machine}</td>
                        <td className="py-2.5 px-3 font-mono">
                          {r.flatFields?.stop_time || '-'}
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          {r.flatFields?.start_time || '-'}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-red-600">
                          {r.breakdownMins || r.primaryVal} mins
                        </td>
                        <td className="py-2.5 px-4">{r.remarks || r.flatFields?.reason || '-'}</td>
                        <td className="py-2.5 px-4 font-mono text-[11px] text-[#6B21A8]">{r.tableName}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* REPORT 8: BEAMING ROUNDS, METER VERIFICATION & PURCHASE ORDERS      */}
        {/* =================================================================== */}
        {reportType === 'beaming_rounds_po' && (
          <div className="space-y-4">
            {beamingAndPoTables.map((tbl) => (
              <div key={tbl.tableName} className="bg-white border border-[#E9D5FF] rounded-2xl shadow-xs overflow-hidden">
                <div className="px-4 py-3 bg-[#FAF5FF] border-b border-[#E9D5FF] text-[#240046] flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#240046]">
                    {tbl.moduleName} &rarr;{' '}
                    <span className="text-[#9D174D] font-bold">production.{tbl.tableName}</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-[#6B21A8]">{tbl.rows.length} record(s)</span>
                </div>
                {tbl.rows.length === 0 ? (
                  <div className="p-4 text-xs text-[#6B21A8]">No rows in {tbl.tableName}</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs font-mono">
                      <thead>
                        <tr className="bg-[#3B0764] text-white font-bold">
                          {tbl.columns.map((c) => (
                            <th key={c.name} className="py-2.5 px-3 whitespace-nowrap">
                              {c.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F3E8FF] text-[#1E0538]">
                        {tbl.rows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-[#FAF5FF]">
                            {tbl.columns.map((c) => (
                              <td key={c.name} className="py-2 px-3 whitespace-nowrap">
                                {String(row[c.name] ?? '')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* =================================================================== */}
        {/* REPORT 9: PILE STOCK, SPREADER ROLLS & PRESS BALE PACKING REGISTER  */}
        {/* =================================================================== */}
        {reportType === 'stock_roll_bales' && (
          <div className="space-y-4">
            {stockAndBaleTables.map((tbl) => (
              <div key={tbl.tableName} className="bg-white border border-[#E9D5FF] rounded-2xl shadow-xs overflow-hidden">
                <div className="px-4 py-3 bg-[#FAF5FF] border-b border-[#E9D5FF] text-[#240046] flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#240046]">
                    {tbl.moduleName} &rarr;{' '}
                    <span className="text-[#9D174D] font-bold">production.{tbl.tableName}</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-[#6B21A8]">{tbl.rows.length} record(s)</span>
                </div>
                {tbl.rows.length === 0 ? (
                  <div className="p-4 text-xs text-[#6B21A8]">No rows in {tbl.tableName}</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs font-mono">
                      <thead>
                        <tr className="bg-[#3B0764] text-white font-bold">
                          {tbl.columns.map((c) => (
                            <th key={c.name} className="py-2.5 px-3 whitespace-nowrap">
                              {c.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F3E8FF] text-[#1E0538]">
                        {tbl.rows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-[#FAF5FF]">
                            {tbl.columns.map((c) => (
                              <td key={c.name} className="py-2 px-3 whitespace-nowrap">
                                {String(row[c.name] ?? '')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* =================================================================== */}
        {/* REPORT 10: MASTER UNIFIED CHRONOLOGICAL PRODUCTION LEDGER           */}
        {/* =================================================================== */}
        {reportType === 'unified_chronological' && (
          <div className="bg-white border border-[#E9D5FF] rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#3B0764] text-white font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-3">Shift</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-3">Machine / Loom</th>
                    <th className="py-3 px-3">Beam / Round / Bale</th>
                    <th className="py-3 px-4">Quality / Mix / Color</th>
                    <th className="py-3 px-4">Operator / Supervisor</th>
                    <th className="py-3 px-4 text-right">Primary Output</th>
                    <th className="py-3 px-4 text-right">Secondary Output</th>
                    <th className="py-3 px-4">SQL Table / Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3E8FF] text-[#1E0538]">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-10 text-center text-[#6B21A8]">
                        No production records match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((r) => (
                      <tr key={r.id} className="hover:bg-[#FAF5FF] transition-colors">
                        <td className="py-2.5 px-4 font-mono font-bold text-[#240046] whitespace-nowrap">
                          {r.date}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-[#9D174D]">{r.shift}</td>
                        <td className="py-2.5 px-4 font-bold text-[#240046]">{r.department}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-[#240046]">{r.machine}</td>
                        <td className="py-2.5 px-3 font-mono">{r.beamOrRound || '-'}</td>
                        <td className="py-2.5 px-4">{r.quality}</td>
                        <td className="py-2.5 px-4">{r.operator}</td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-[#240046] tabular-nums">
                          {r.primaryVal}{' '}
                          <span className="text-[11px] text-[#9D174D]">{r.primaryLabel}</span>
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                          {r.secondaryVal ? (
                            <>
                              {r.secondaryVal}{' '}
                              <span className="text-[11px] text-[#6B21A8]">{r.secondaryLabel}</span>
                            </>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-[11px] font-mono text-[#6B21A8]">
                          {r.tableName} {r.remarks ? `· ${r.remarks}` : ''}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
