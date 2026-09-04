import { useMemo, useState } from 'react';
import { Transaction, CompanyProfile, formatRupiah } from '../types';
import { 
  ArrowDownRight, 
  ArrowUpRight, 
  Wallet, 
  Building2, 
  UserCheck, 
  FileText, 
  FileSpreadsheet, 
  Filter, 
  TrendingUp, 
  CalendarDays,
  Receipt,
  PieChart as PieChartIcon
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { exportToPDF, exportToExcel } from '../utils/exportUtils';
import { format, isWithinInterval, startOfDay, endOfDay, parseISO, eachDayOfInterval, subMonths, subDays } from 'date-fns';

interface DashboardProps {
  transactions: Transaction[];
  profile: CompanyProfile;
}

export default function Dashboard({ transactions, profile }: DashboardProps) {
  const [filterMode, setFilterMode] = useState<'month' | 'custom'>('month');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Quick preset functions for desktop convenience
  const setThisMonth = () => {
    setFilterMode('month');
    const d = new Date();
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const setLastMonth = () => {
    setFilterMode('month');
    const lastM = subMonths(new Date(), 1);
    setSelectedMonth(`${lastM.getFullYear()}-${String(lastM.getMonth() + 1).padStart(2, '0')}`);
  };

  const setLast7Days = () => {
    setFilterMode('custom');
    const today = new Date();
    const past7 = subDays(today, 6);
    setStartDate(format(past7, 'yyyy-MM-dd'));
    setEndDate(format(today, 'yyyy-MM-dd'));
  };

  const setLast30Days = () => {
    setFilterMode('custom');
    const today = new Date();
    const past30 = subDays(today, 29);
    setStartDate(format(past30, 'yyyy-MM-dd'));
    setEndDate(format(today, 'yyyy-MM-dd'));
  };

  const { filteredTxs, summary, chartData, stats } = useMemo(() => {
    let filtered = transactions;
    let dailyData: any[] = [];
    let year = '', month = '';

    if (filterMode === 'month') {
      [year, month] = selectedMonth.split('-');
      filtered = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getFullYear() === parseInt(year) && d.getMonth() + 1 === parseInt(month);
      });

      const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
      dailyData = Array.from({ length: daysInMonth }, (_, i) => ({
        name: `${i + 1}`,
        dateStr: `${year}-${month}-${String(i + 1).padStart(2, '0')}`,
        Pemasukan: 0,
        Pengeluaran: 0
      }));
    } else {
      filtered = transactions.filter((tx) => {
        if (!startDate && !endDate) return true;
        try {
          const txDate = parseISO(tx.date);
          const start = startDate ? startOfDay(parseISO(startDate)) : null;
          const end = endDate ? endOfDay(parseISO(endDate)) : null;
          
          if (start && end) {
            if (start > end) return false;
            return isWithinInterval(txDate, { start, end });
          } else if (start) {
            return txDate >= start;
          } else if (end) {
            return txDate <= end;
          }
          return true;
        } catch (e) {
          return false;
        }
      });

      if (startDate && endDate) {
        try {
          const start = parseISO(startDate);
          const end = parseISO(endDate);
          if (start <= end) {
            const days = eachDayOfInterval({ start, end });
            dailyData = days.map(d => ({
              name: format(d, 'dd MMM'),
              dateStr: format(d, 'yyyy-MM-dd'),
              Pemasukan: 0,
              Pengeluaran: 0
            }));
          } else {
            dailyData = [];
          }
        } catch (e) {
          dailyData = [];
        }
      }
    }

    let incomeBruto = 0;
    const incomeMap = new Map<string, number>();
    const outcomeCashMap = new Map<string, number>();
    const outcomeTfMap = new Map<string, number>();
    let pengeluaranCashTotal = 0;
    let pengeluaranTfTotal = 0;

    filtered.forEach(t => {
      if (t.type === 'income') {
        incomeBruto += t.amount;
        const key = t.method === 'tf_bjb' ? 'TF BJB' : (t.method === 'tf_bri' ? 'TF BRI' : 'Cash');
        incomeMap.set(key, (incomeMap.get(key) || 0) + t.amount);
      }
      if (t.type === 'outcome') {
        if (t.method === 'cash') {
          pengeluaranCashTotal += t.amount;
          outcomeCashMap.set(t.category, (outcomeCashMap.get(t.category) || 0) + t.amount);
        } else {
          pengeluaranTfTotal += t.amount;
          outcomeTfMap.set(t.category, (outcomeTfMap.get(t.category) || 0) + t.amount);
        }
      }

      // Add to chart data
      if (dailyData.length > 0) {
        if (filterMode === 'month') {
          const d = new Date(t.date);
          const dayIdx = d.getDate() - 1;
          if (t.type === 'income' && dailyData[dayIdx]) dailyData[dayIdx].Pemasukan += t.amount;
          if (t.type === 'outcome' && dailyData[dayIdx]) dailyData[dayIdx].Pengeluaran += t.amount;
        } else {
          const matchingDay = dailyData.find(d => d.dateStr === t.date);
          if (matchingDay) {
            if (t.type === 'income') matchingDay.Pemasukan += t.amount;
            if (t.type === 'outcome') matchingDay.Pengeluaran += t.amount;
          }
        }
      }
    });

    const incomeNeto = incomeBruto - pengeluaranCashTotal - pengeluaranTfTotal;
    const profitPerusahaan = incomeNeto > 0 ? incomeNeto * 0.15 : 0;
    const profitOwner = profitPerusahaan * 0.20;

    const summary = {
      incomeBruto,
      incomeBreakdown: Array.from(incomeMap.entries()).map(([name, amount]) => ({ name, amount })),
      pengeluaranCashTotal,
      pengeluaranCashBreakdown: Array.from(outcomeCashMap.entries()).map(([name, amount]) => ({ name, amount })),
      pengeluaranTfTotal,
      pengeluaranTfBreakdown: Array.from(outcomeTfMap.entries()).map(([name, amount]) => ({ name, amount })),
      profitPerusahaan,
      profitOwner,
      incomeNeto
    };

    const totalPengeluaran = pengeluaranCashTotal + pengeluaranTfTotal;
    const marginRate = incomeBruto > 0 ? ((incomeNeto / incomeBruto) * 100).toFixed(1) : '0';

    return { 
      filteredTxs: filtered,
      summary,
      chartData: dailyData,
      stats: {
        totalPengeluaran,
        marginRate,
        txCount: filtered.length,
        incomeCount: filtered.filter(t => t.type === 'income').length,
        outcomeCount: filtered.filter(t => t.type === 'outcome').length
      }
    };
  }, [transactions, selectedMonth, filterMode, startDate, endDate]);

  const reportLabel = filterMode === 'month' 
    ? format(new Date(`${selectedMonth}-01`), 'MMMM yyyy')
    : `${startDate || 'Awal'} s.d ${endDate || 'Akhir'}`;

  const handleExportPDF = () => {
    exportToPDF({ transactions: filteredTxs, profile, monthYear: reportLabel, summary });
  };

  const handleExportExcel = () => {
    exportToExcel({ transactions: filteredTxs, profile, monthYear: reportLabel, summary });
  };

  return (
    <div className="space-y-6">
      {/* Top Filter & Actions Header Bar */}
      <div className="bg-[#11141b] border border-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-sm space-y-3 sm:space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
          
          {/* Left: Mode & Presets */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {/* Segmented Mode Button */}
            <div className="flex bg-[#0a0c10] p-1 rounded-xl border border-slate-800 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setFilterMode('month')}
                className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterMode === 'month'
                    ? 'bg-emerald-500/20 text-emerald-400 shadow-sm border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Bulanan
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('custom')}
                className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterMode === 'custom'
                    ? 'bg-emerald-500/20 text-emerald-400 shadow-sm border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Rentang Tanggal
              </button>
            </div>

            {/* Quick Presets (Horizontal scroll on mobile) */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                onClick={setThisMonth}
                className="whitespace-nowrap px-2.5 py-1 rounded-lg text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/60"
              >
                Bulan Ini
              </button>
              <button
                onClick={setLastMonth}
                className="whitespace-nowrap px-2.5 py-1 rounded-lg text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/60"
              >
                Bulan Lalu
              </button>
              <button
                onClick={setLast7Days}
                className="whitespace-nowrap px-2.5 py-1 rounded-lg text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/60"
              >
                7 Hari
              </button>
              <button
                onClick={setLast30Days}
                className="whitespace-nowrap px-2.5 py-1 rounded-lg text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/60"
              >
                30 Hari
              </button>
            </div>
          </div>

          {/* Right: Date Picker & Export Buttons */}
          <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3 w-full lg:w-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-800/70">
            {filterMode === 'month' ? (
              <div className="flex items-center gap-2 bg-[#0a0c10] border border-slate-700/80 rounded-xl px-2.5 sm:px-3 py-1.5 flex-1 sm:flex-none">
                <CalendarDays className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-400 shrink-0" />
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent border-none text-white text-xs sm:text-sm focus:ring-0 cursor-pointer w-full"
                />
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-[#0a0c10] border border-slate-700/80 rounded-xl px-2.5 py-1.5 flex-1 sm:flex-none">
                <Filter className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent border-none text-slate-200 text-xs focus:ring-0 cursor-pointer"
                  title="Dari Tanggal"
                />
                <span className="text-slate-600 font-bold">-</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent border-none text-slate-200 text-xs focus:ring-0 cursor-pointer"
                  title="Sampai Tanggal"
                />
              </div>
            )}

            {/* Export Action Buttons with distinct badges */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleExportPDF}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all shadow-sm"
                title="Ekspor Laporan PDF"
              >
                <FileText className="h-3.5 w-3.5 text-rose-400" />
                <span>PDF</span>
              </button>
              <button
                onClick={handleExportExcel}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl text-xs font-semibold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all shadow-sm"
                title="Ekspor Laporan Excel"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
                <span>Excel</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Section: Minimalist Hero Card + Modern 2x2 Grid on Mobile */}
      <div className="space-y-3 sm:space-y-4">
        {/* Minimalist Hero Card (Income Neto) */}
        <div className="bg-gradient-to-br from-[#121722] via-[#0f131c] to-[#0a0c10] border border-sky-500/20 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-lg shadow-sky-950/20">
          <div className="absolute top-0 right-0 w-48 h-48 bg-sky-500/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <Wallet className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-semibold text-slate-300 tracking-wide">Income Neto (Kas Bersih)</span>
              </div>
              <div className="flex items-center gap-1.5 bg-sky-500/10 border border-sky-500/25 px-2.5 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></span>
                <span className="text-[11px] font-bold text-sky-300 font-mono">{stats.marginRate}% Margin</span>
              </div>
            </div>

            <div className="my-2.5">
              <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight font-mono ${
                summary.incomeNeto >= 0 ? 'text-white' : 'text-rose-400'
              }`}>
                {formatRupiah(summary.incomeNeto)}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Total pendapatan setelah dikurangi seluruh pengeluaran operasional
              </p>
            </div>

            {/* Mini Stat Split on Mobile */}
            <div className="grid grid-cols-2 gap-2 pt-3 mt-3 border-t border-slate-800/80 text-xs">
              <div className="flex items-center justify-between bg-[#0a0c10]/60 px-3 py-1.5 rounded-xl border border-slate-800/50">
                <span className="text-slate-400 text-[11px]">Masuk</span>
                <span className="text-emerald-400 font-mono font-semibold">+{formatRupiah(summary.incomeBruto)}</span>
              </div>
              <div className="flex items-center justify-between bg-[#0a0c10]/60 px-3 py-1.5 rounded-xl border border-slate-800/50">
                <span className="text-slate-400 text-[11px]">Keluar</span>
                <span className="text-rose-400 font-mono font-semibold">-{formatRupiah(stats.totalPengeluaran)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Minimalist Secondary Cards: 2-Columns on Mobile, 4-Columns on Desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {/* Card 1: Income Bruto */}
          <div className="bg-[#11141b] border border-slate-800 hover:border-emerald-500/30 rounded-2xl p-3 sm:p-4 transition-all shadow-sm flex flex-col justify-between group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] sm:text-xs font-medium text-slate-400 truncate">Income Bruto</span>
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                <TrendingUp className="h-3.5 w-3.5" />
              </div>
            </div>
            <div>
              <div className="text-sm sm:text-lg xl:text-xl font-bold text-white tracking-tight font-mono truncate">
                {formatRupiah(summary.incomeBruto)}
              </div>
              <div className="text-[10px] text-emerald-400 font-medium mt-1 flex items-center justify-between">
                <span>{stats.incomeCount} transaksi</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          {/* Card 2: Pengeluaran Total */}
          <div className="bg-[#11141b] border border-slate-800 hover:border-rose-500/30 rounded-2xl p-3 sm:p-4 transition-all shadow-sm flex flex-col justify-between group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] sm:text-xs font-medium text-slate-400 truncate">Total Beban</span>
              <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0">
                <ArrowDownRight className="h-3.5 w-3.5" />
              </div>
            </div>
            <div>
              <div className="text-sm sm:text-lg xl:text-xl font-bold text-white tracking-tight font-mono truncate">
                {formatRupiah(stats.totalPengeluaran)}
              </div>
              <div className="text-[10px] text-slate-400 mt-1 truncate">
                Cash: <span className="text-rose-300">{formatRupiah(summary.pengeluaranCashTotal)}</span>
              </div>
            </div>
          </div>

          {/* Card 3: Profit Perusahaan (15%) */}
          <div className="bg-[#11141b] border border-slate-800 hover:border-teal-500/30 rounded-2xl p-3 sm:p-4 transition-all shadow-sm flex flex-col justify-between group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] sm:text-xs font-medium text-slate-400 truncate">Profit PT (15%)</span>
              <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 shrink-0">
                <Building2 className="h-3.5 w-3.5" />
              </div>
            </div>
            <div>
              <div className="text-sm sm:text-lg xl:text-xl font-bold text-teal-300 tracking-tight font-mono truncate">
                {formatRupiah(summary.profitPerusahaan)}
              </div>
              <div className="text-[10px] text-teal-400/80 mt-1">
                15% dari neto
              </div>
            </div>
          </div>

          {/* Card 4: Profit Owner (20%) */}
          <div className="bg-[#11141b] border border-slate-800 hover:border-amber-500/30 rounded-2xl p-3 sm:p-4 transition-all shadow-sm flex flex-col justify-between group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] sm:text-xs font-medium text-slate-400 truncate">Bagi Owner (20%)</span>
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                <UserCheck className="h-3.5 w-3.5" />
              </div>
            </div>
            <div>
              <div className="text-sm sm:text-lg xl:text-xl font-bold text-amber-300 tracking-tight font-mono truncate">
                {formatRupiah(summary.profitOwner)}
              </div>
              <div className="text-[10px] text-amber-400/80 mt-1">
                20% dari profit PT
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Desktop Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Structured Breakdown Card */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-[#11141b] border border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <PieChartIcon className="h-4 w-4 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Rincian Keuangan</h3>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                {stats.txCount} Transaksi
              </span>
            </div>
            
            {/* Income Bruto Section */}
            <div className="mb-5 pb-4 border-b border-slate-800/80">
              <div className="flex justify-between items-center text-emerald-400 font-semibold mb-2 text-sm">
                <span className="flex items-center gap-1.5">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  Income Bruto
                </span>
                <span className="font-mono">{formatRupiah(summary.incomeBruto)}</span>
              </div>
              {summary.incomeBreakdown.length > 0 ? (
                <div className="space-y-2 mt-2">
                  {summary.incomeBreakdown.map((item, idx) => {
                    const pct = summary.incomeBruto > 0 ? Math.round((item.amount / summary.incomeBruto) * 100) : 0;
                    return (
                      <div key={idx} className="bg-[#0a0c10] border border-slate-800/60 rounded-xl p-2.5">
                        <div className="flex justify-between items-center text-xs text-slate-300 mb-1.5">
                          <span className="font-medium">{item.name}</span>
                          <span className="font-mono font-semibold">{formatRupiah(item.amount)}</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden flex">
                          <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">Belum ada pemasukan pada periode ini</p>
              )}
            </div>

            {/* Pengeluaran Cash Section */}
            <div className="mb-5 pb-4 border-b border-slate-800/80">
              <div className="flex justify-between items-center text-rose-400 font-semibold mb-2 text-sm">
                <span className="flex items-center gap-1.5">
                  <ArrowDownRight className="h-3.5 w-3.5" />
                  Pengeluaran Cash
                </span>
                <span className="font-mono">{formatRupiah(summary.pengeluaranCashTotal)}</span>
              </div>
              {summary.pengeluaranCashBreakdown.length > 0 ? (
                <div className="space-y-1.5 pl-2 max-h-44 overflow-y-auto pr-1">
                  {summary.pengeluaranCashBreakdown.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs py-1 border-b border-slate-800/40 last:border-0">
                      <span className="text-slate-400">{item.name}</span>
                      <span className="font-mono text-slate-300">{formatRupiah(item.amount)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">Tidak ada pengeluaran cash</p>
              )}
            </div>

            {/* Pengeluaran TF Section */}
            <div className="mb-5 pb-4 border-b border-slate-800/80">
              <div className="flex justify-between items-center text-rose-400 font-semibold mb-2 text-sm">
                <span className="flex items-center gap-1.5">
                  <ArrowDownRight className="h-3.5 w-3.5" />
                  Pengeluaran Transfer
                </span>
                <span className="font-mono">{formatRupiah(summary.pengeluaranTfTotal)}</span>
              </div>
              {summary.pengeluaranTfBreakdown.length > 0 ? (
                <div className="space-y-1.5 pl-2 max-h-44 overflow-y-auto pr-1">
                  {summary.pengeluaranTfBreakdown.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs py-1 border-b border-slate-800/40 last:border-0">
                      <span className="text-slate-400">{item.name}</span>
                      <span className="font-mono text-slate-300">{formatRupiah(item.amount)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">Tidak ada pengeluaran transfer</p>
              )}
            </div>

            {/* Profit & Net Summary Box */}
            <div className="bg-[#0a0c10] border border-slate-800 rounded-xl p-3.5 space-y-2.5">
              <div className="flex justify-between items-center text-xs text-emerald-300">
                <span>Profit Perusahaan (15%)</span>
                <span className="font-mono font-semibold">{formatRupiah(summary.profitPerusahaan)}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-amber-400">
                <span>Profit Owner (20%)</span>
                <span className="font-mono font-semibold">{formatRupiah(summary.profitOwner)}</span>
              </div>
              <div className="border-t border-slate-800 pt-2 flex justify-between items-center text-sm font-bold text-sky-400">
                <span>Income Neto</span>
                <span className="font-mono text-base">{formatRupiah(summary.incomeNeto)}</span>
              </div>
            </div>

          </div>
        </div>

        {/* Right column: Interactive Chart & Timeline */}
        <div className="lg:col-span-2">
          <div className="bg-[#11141b] border border-slate-800 rounded-2xl p-6 h-full shadow-sm flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-emerald-400" />
                  Arus Kas Harian
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Periode: {reportLabel}</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                  <span className="text-slate-400">Pemasukan</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                  <span className="text-slate-400">Pengeluaran</span>
                </div>
              </div>
            </div>

            {/* Chart Area */}
            <div className="h-[380px] xl:h-[440px] w-full flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 15, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#64748b', fontSize: 11 }} 
                    tickLine={false} 
                    axisLine={{ stroke: '#334155' }} 
                  />
                  <YAxis 
                    tickFormatter={(val) => {
                      if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                      if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
                      return `${val}`;
                    }} 
                    tick={{ fill: '#64748b', fontSize: 11 }} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <Tooltip 
                    formatter={(value: number) => formatRupiah(value)} 
                    cursor={{ fill: 'rgba(51, 65, 85, 0.3)' }} 
                    contentStyle={{ 
                      backgroundColor: '#0a0c10', 
                      borderColor: '#334155', 
                      color: '#f8fafc', 
                      borderRadius: '0.75rem',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
                    }}
                    labelStyle={{ color: '#94a3b8', fontWeight: 600, marginBottom: '4px' }}
                  />
                  <Bar dataKey="Pemasukan" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={32} />
                  <Bar dataKey="Pengeluaran" fill="#f43f5e" radius={[6, 6, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Bottom Quick Insight Bar */}
            <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
              <div className="bg-[#0a0c10] p-2.5 rounded-xl border border-slate-800/50">
                <span className="text-[11px] text-slate-500 block">Total Masuk</span>
                <span className="text-xs font-mono font-bold text-emerald-400">{formatRupiah(summary.incomeBruto)}</span>
              </div>
              <div className="bg-[#0a0c10] p-2.5 rounded-xl border border-slate-800/50">
                <span className="text-[11px] text-slate-500 block">Total Keluar</span>
                <span className="text-xs font-mono font-bold text-rose-400">{formatRupiah(stats.totalPengeluaran)}</span>
              </div>
              <div className="col-span-2 sm:col-span-1 bg-[#0a0c10] p-2.5 rounded-xl border border-slate-800/50">
                <span className="text-[11px] text-slate-500 block">Rasio Bersih</span>
                <span className="text-xs font-mono font-bold text-sky-400">{stats.marginRate}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

