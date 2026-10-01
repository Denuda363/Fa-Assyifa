import React, { useMemo, useState, useEffect } from 'react';
import { Transaction, CompanyProfile, formatRupiah, Loan, getLoanRemaining, getStartingBalanceForMonth } from '../types';
import { Download, Calendar, Filter, FileSpreadsheet, X, HandCoins, AlertCircle, Sparkles, Edit2, Wallet, Check, RotateCcw, Plus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { exportToPDF, exportToExcel, exportMonthlyReportExcel, exportYearlyReportExcel, MONTH_NAMES_ID } from '../utils/exportUtils';
import { format, isWithinInterval, startOfDay, endOfDay, parseISO, eachDayOfInterval } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';

interface DashboardProps {
  transactions: Transaction[];
  profile: CompanyProfile;
  loans?: Loan[];
  onUpdateProfile?: (data: Partial<CompanyProfile>) => Promise<void>;
}

export default function Dashboard({ transactions, profile, loans = [], onUpdateProfile }: DashboardProps) {
  const [filterMode, setFilterMode] = useState<'month' | 'all' | 'custom'>('month');
  
  // Calculate months that have transactions
  const availableMonths = useMemo(() => {
    const monthCounts = new Map<string, number>();
    transactions.forEach(t => {
      if (t.date && t.date.length >= 7) {
        const m = t.date.substring(0, 7);
        monthCounts.set(m, (monthCounts.get(m) || 0) + 1);
      }
    });
    return Array.from(monthCounts.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([monthStr, count]) => ({
        monthStr,
        count
      }));
  }, [transactions]);

  const [hasUserChangedMonth, setHasUserChangedMonth] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  // Automatically select the latest month that HAS data if the default current month is empty
  useEffect(() => {
    if (!hasUserChangedMonth && availableMonths.length > 0) {
      const currentMonthHasData = availableMonths.some(m => m.monthStr === selectedMonth);
      if (!currentMonthHasData) {
        setSelectedMonth(availableMonths[0].monthStr);
      }
    }
  }, [availableMonths, hasUserChangedMonth, selectedMonth]);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showYearModal, setShowYearModal] = useState(false);
  const [selectedYear, setSelectedYear] = useState(() => {
    const d = new Date();
    return d.getFullYear();
  });

  // Manual Starting Balance Modal State
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [balanceInput, setBalanceInput] = useState<string>('');
  const [isSavingBalance, setIsSavingBalance] = useState(false);

  const formatMonthLabel = (mStr: string) => {
    const parts = mStr.split('-');
    if (parts.length < 2) return mStr;
    const y = parts[0];
    const mIdx = parseInt(parts[1], 10) - 1;
    return `${MONTH_NAMES_ID[mIdx] || parts[1]} ${y}`;
  };

  const startingBalanceInfo = useMemo(() => {
    return getStartingBalanceForMonth(selectedMonth, profile, transactions);
  }, [selectedMonth, profile, transactions]);

  const startingBalance = filterMode === 'month' ? startingBalanceInfo.amount : 0;

  const openBalanceModal = () => {
    setBalanceInput(startingBalanceInfo.amount ? String(startingBalanceInfo.amount) : '');
    setIsBalanceModalOpen(true);
  };

  const handleSaveBalance = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!onUpdateProfile) return;
    try {
      setIsSavingBalance(true);
      const num = parseFloat(balanceInput.replace(/[^0-9.-]+/g, '')) || 0;
      const updated = {
        ...(profile.previousMonthBalances || {}),
        [selectedMonth]: num
      };
      await onUpdateProfile({ previousMonthBalances: updated });
      setIsBalanceModalOpen(false);
    } catch (err) {
      console.error('Failed to save manual starting balance:', err);
    } finally {
      setIsSavingBalance(false);
    }
  };

  const handleResetBalance = async () => {
    if (!onUpdateProfile) return;
    try {
      setIsSavingBalance(true);
      const updated = { ...(profile.previousMonthBalances || {}) };
      delete updated[selectedMonth];
      await onUpdateProfile({ previousMonthBalances: updated });
      setIsBalanceModalOpen(false);
    } catch (err) {
      console.error('Failed to reset starting balance:', err);
    } finally {
      setIsSavingBalance(false);
    }
  };

  const addPresetBalance = (addition: number) => {
    const current = parseFloat(balanceInput.replace(/[^0-9.-]+/g, '')) || 0;
    setBalanceInput(String(current + addition));
  };

  const { filteredTxs, summary, chartData } = useMemo(() => {
    let filtered: Transaction[] = [];
    let dailyData: any[] = [];
    let year = '', month = '';

    if (filterMode === 'month') {
      [year, month] = selectedMonth.split('-');
      // Direct string matching to completely prevent timezone shift bugs
      filtered = transactions.filter(t => {
        if (!t.date) return false;
        return t.date.startsWith(`${year}-${month}`);
      });

      const daysInMonth = new Date(parseInt(year, 10), parseInt(month, 10), 0).getDate();
      dailyData = Array.from({ length: daysInMonth }, (_, i) => ({
        name: `${i + 1}`,
        dateStr: `${year}-${month}-${String(i + 1).padStart(2, '0')}`,
        Pemasukan: 0,
        Pengeluaran: 0
      }));

      filtered.forEach(t => {
        const parts = (t.date || '').split('-');
        if (parts.length === 3) {
          const dayNum = parseInt(parts[2], 10);
          const dayIdx = dayNum - 1;
          if (dayIdx >= 0 && dayIdx < dailyData.length) {
            const amt = Number(t.amount) || 0;
            if (t.type === 'income') dailyData[dayIdx].Pemasukan += amt;
            if (t.type === 'outcome') dailyData[dayIdx].Pengeluaran += amt;
          }
        }
      });
    } else if (filterMode === 'all') {
      filtered = transactions;
      const monthsInAll = availableMonths.map(m => m.monthStr).sort();
      if (monthsInAll.length <= 1 && monthsInAll[0]) {
        const [y, m] = monthsInAll[0].split('-');
        const daysInMonth = new Date(parseInt(y, 10), parseInt(m, 10), 0).getDate();
        dailyData = Array.from({ length: daysInMonth }, (_, i) => ({
          name: `${i + 1}`,
          dateStr: `${y}-${m}-${String(i + 1).padStart(2, '0')}`,
          Pemasukan: 0,
          Pengeluaran: 0
        }));
        filtered.forEach(t => {
          const parts = (t.date || '').split('-');
          if (parts.length === 3) {
            const dayNum = parseInt(parts[2], 10);
            const dayIdx = dayNum - 1;
            if (dayIdx >= 0 && dayIdx < dailyData.length) {
              const amt = Number(t.amount) || 0;
              if (t.type === 'income') dailyData[dayIdx].Pemasukan += amt;
              if (t.type === 'outcome') dailyData[dayIdx].Pengeluaran += amt;
            }
          }
        });
      } else {
        dailyData = monthsInAll.map(mStr => {
          const [y, m] = mStr.split('-');
          const mIdx = parseInt(m, 10) - 1;
          return {
            name: `${MONTH_NAMES_ID[mIdx]?.slice(0, 3) || m} '${y.slice(2)}`,
            dateStr: mStr,
            Pemasukan: 0,
            Pengeluaran: 0
          };
        });
        filtered.forEach(t => {
          if (!t.date) return;
          const mStr = t.date.substring(0, 7);
          const found = dailyData.find(d => d.dateStr === mStr);
          if (found) {
            const amt = Number(t.amount) || 0;
            if (t.type === 'income') found.Pemasukan += amt;
            if (t.type === 'outcome') found.Pengeluaran += amt;
          }
        });
      }
    } else {
      // Custom date range
      filtered = transactions.filter((tx) => {
        if (!startDate && !endDate) return true;
        if (!tx.date) return false;
        if (startDate && tx.date < startDate) return false;
        if (endDate && tx.date > endDate) return false;
        return true;
      });

      if (startDate && endDate) {
        try {
          const days = eachDayOfInterval({ start: parseISO(startDate), end: parseISO(endDate) });
          dailyData = days.map(d => ({
            name: format(d, 'dd MMM'),
            dateStr: format(d, 'yyyy-MM-dd'),
            Pemasukan: 0,
            Pengeluaran: 0
          }));

          filtered.forEach(t => {
            const matchingDay = dailyData.find(d => d.dateStr === t.date);
            if (matchingDay) {
              const amt = Number(t.amount) || 0;
              if (t.type === 'income') matchingDay.Pemasukan += amt;
              if (t.type === 'outcome') matchingDay.Pengeluaran += amt;
            }
          });
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
      const amount = Number(t.amount) || 0;
      if (t.type === 'income') {
        incomeBruto += amount;
        const key = t.method === 'tf_bjb' ? 'TF BJB' : (t.method === 'tf_bri' ? 'TF BRI' : 'Cash');
        incomeMap.set(key, (incomeMap.get(key) || 0) + amount);
      }
      if (t.type === 'outcome') {
        if (t.method === 'cash') {
          pengeluaranCashTotal += amount;
          outcomeCashMap.set(t.category || 'Lainnya', (outcomeCashMap.get(t.category || 'Lainnya') || 0) + amount);
        } else {
          pengeluaranTfTotal += amount;
          outcomeTfMap.set(t.category || 'TF Lain2', (outcomeTfMap.get(t.category || 'TF Lain2') || 0) + amount);
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

    return { 
      filteredTxs: filtered,
      summary,
      chartData: dailyData
    };
  }, [transactions, filterMode, selectedMonth, startDate, endDate, availableMonths]);

  const reportLabel = useMemo(() => {
    if (filterMode === 'month') {
      return formatMonthLabel(selectedMonth);
    } else if (filterMode === 'all') {
      return 'Semua Waktu';
    } else {
      return `${startDate || 'Awal'} s.d ${endDate || 'Akhir'}`;
    }
  }, [filterMode, selectedMonth, startDate, endDate]);

  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    yearsSet.add(new Date().getFullYear());
    yearsSet.add(2025);
    yearsSet.add(2026);
    transactions.forEach(t => {
      if (t.date && t.date.length >= 4) {
        const y = parseInt(t.date.substring(0, 4), 10);
        if (!isNaN(y)) yearsSet.add(y);
      }
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [transactions]);

  const handleExportPDF = () => {
    exportToPDF({ transactions: filteredTxs, profile, monthYear: reportLabel, summary, startingBalance });
  };

  const handleExportExcel = () => {
    exportToExcel({ transactions: filteredTxs, profile, monthYear: reportLabel, summary, loans, startingBalance });
  };

  const handleExportMonthlyReport = () => {
    exportMonthlyReportExcel({ transactions: filteredTxs, profile, monthYear: reportLabel, summary, loans, startingBalance });
  };

  const handleExportYearlyReport = (yearToExport: number) => {
    exportYearlyReportExcel(transactions, profile, yearToExport, loans);
    setShowYearModal(false);
  };

  const currentMonthCount = availableMonths.find(m => m.monthStr === selectedMonth)?.count || 0;
  const latestMonthWithData = availableMonths[0];

  const totalEndingCash = startingBalance + summary.incomeNeto;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Filter & Actions Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Dashboard Finansial</h2>
          <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
            Menampilkan data untuk: <strong className="text-indigo-400 font-semibold">{reportLabel}</strong> ({filteredTxs.length} transaksi)
          </p>
        </div>

        <div className="flex flex-col xl:flex-row xl:items-center gap-3 w-full xl:w-auto">
          {/* Segmented Filter Control */}
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 bg-neutral-900/40 backdrop-blur-xl border border-neutral-800/60 p-1.5 sm:p-2 rounded-xl sm:rounded-2xl shadow-sm">
            <div className="flex bg-neutral-950/80 border border-neutral-800/80 rounded-lg sm:rounded-xl p-1 relative w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setFilterMode('month')}
                className={`relative z-10 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold rounded-md sm:rounded-lg transition-colors flex-1 sm:flex-none ${filterMode === 'month' ? 'text-indigo-300' : 'text-neutral-500 hover:text-neutral-300'}`}
              >
                {filterMode === 'month' && (
                  <motion.div layoutId="filter-bg" className="absolute inset-0 bg-indigo-500/20 border border-indigo-500/30 rounded-md sm:rounded-lg -z-10" transition={{ type: "spring", stiffness: 350, damping: 25 }} />
                )}
                Bulanan
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`relative z-10 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold rounded-md sm:rounded-lg transition-colors flex-1 sm:flex-none ${filterMode === 'all' ? 'text-indigo-300' : 'text-neutral-500 hover:text-neutral-300'}`}
              >
                {filterMode === 'all' && (
                  <motion.div layoutId="filter-bg" className="absolute inset-0 bg-indigo-500/20 border border-indigo-500/30 rounded-md sm:rounded-lg -z-10" transition={{ type: "spring", stiffness: 350, damping: 25 }} />
                )}
                Semua Waktu
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('custom')}
                className={`relative z-10 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold rounded-md sm:rounded-lg transition-colors flex-1 sm:flex-none ${filterMode === 'custom' ? 'text-indigo-300' : 'text-neutral-500 hover:text-neutral-300'}`}
              >
                {filterMode === 'custom' && (
                  <motion.div layoutId="filter-bg" className="absolute inset-0 bg-indigo-500/20 border border-indigo-500/30 rounded-md sm:rounded-lg -z-10" transition={{ type: "spring", stiffness: 350, damping: 25 }} />
                )}
                Spesifik
              </button>
            </div>

            {/* Sub-inputs per filter mode */}
            {filterMode === 'month' && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {availableMonths.length > 0 && (
                  <select
                    value={selectedMonth}
                    onChange={(e) => {
                      setSelectedMonth(e.target.value);
                      setHasUserChangedMonth(true);
                    }}
                    className="bg-neutral-950/70 border border-neutral-800 text-white rounded-lg sm:rounded-xl text-xs sm:text-sm py-1.5 px-3 sm:py-2.5 sm:px-3 outline-none transition-all focus:border-indigo-500 cursor-pointer shadow-inner"
                  >
                    {availableMonths.map(m => (
                      <option key={m.monthStr} value={m.monthStr}>
                        {formatMonthLabel(m.monthStr)} ({m.count} tx)
                      </option>
                    ))}
                    {!availableMonths.some(m => m.monthStr === selectedMonth) && (
                      <option value={selectedMonth}>
                        {formatMonthLabel(selectedMonth)} (0 tx)
                      </option>
                    )}
                  </select>
                )}

                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => {
                    setSelectedMonth(e.target.value);
                    setHasUserChangedMonth(true);
                  }}
                  className="bg-neutral-950/50 border border-neutral-800 text-white rounded-lg sm:rounded-xl focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-xs sm:text-sm py-1.5 px-3 sm:py-2.5 sm:px-4 outline-none transition-all w-full sm:w-auto min-w-[130px] shadow-inner"
                  title="Pilih Bulan Spesifik"
                />
              </div>
            )}

            {filterMode === 'custom' && (
              <div className="flex items-center gap-2 bg-neutral-950/50 border border-neutral-800/60 rounded-lg sm:rounded-xl px-2 py-1.5 sm:px-3 sm:py-2 w-full sm:w-auto transition-all focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 shadow-inner">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent border-none text-neutral-300 text-xs sm:text-sm focus:ring-0 w-full outline-none"
                  title="Dari Tanggal"
                />
                <span className="text-neutral-500 text-xs sm:text-sm">-</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent border-none text-neutral-300 text-xs sm:text-sm focus:ring-0 w-full outline-none"
                  title="Sampai Tanggal"
                />
              </div>
            )}
          </div>

          {/* Action Export Buttons */}
          <div className="flex flex-wrap gap-2 w-full xl:w-auto">
            <button
              onClick={handleExportMonthlyReport}
              className="flex-1 xl:flex-none inline-flex justify-center items-center px-3 py-1.5 sm:px-4 sm:py-2.5 border border-emerald-500/40 shadow-sm text-xs sm:text-sm font-semibold rounded-xl sm:rounded-2xl text-emerald-300 bg-emerald-950/40 backdrop-blur-md hover:bg-emerald-900/50 transition-all hover:border-emerald-400/60 cursor-pointer"
              title="Export Report Bulanan ke Excel (Format Resmi Closing & Rekap)"
            >
              <FileSpreadsheet className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-400" /> Report Bulanan
            </button>
            <button
              onClick={() => setShowYearModal(true)}
              className="flex-1 xl:flex-none inline-flex justify-center items-center px-3 py-1.5 sm:px-4 sm:py-2.5 border border-amber-500/40 shadow-sm text-xs sm:text-sm font-semibold rounded-xl sm:rounded-2xl text-amber-300 bg-amber-950/40 backdrop-blur-md hover:bg-amber-900/50 transition-all hover:border-amber-400/60 cursor-pointer"
              title="Export Report Tahunan ke Excel (12 Bulan Closing Monthly)"
            >
              <Calendar className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-400" /> Report Tahunan
            </button>
            <button
              onClick={handleExportExcel}
              className="flex-1 xl:flex-none inline-flex justify-center items-center px-3 py-1.5 sm:px-4 sm:py-2.5 border border-neutral-800/60 shadow-sm text-xs sm:text-sm font-semibold rounded-xl sm:rounded-2xl text-neutral-200 bg-neutral-900/40 backdrop-blur-md hover:bg-neutral-800/60 transition-all hover:border-indigo-500/30 cursor-pointer"
              title="Export Semua Sheet Lengkap ke Excel"
            >
              <Download className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-indigo-400" /> Excel
            </button>
            <button
              onClick={handleExportPDF}
              className="flex-1 xl:flex-none inline-flex justify-center items-center px-3 py-1.5 sm:px-4 sm:py-2.5 border border-neutral-800/60 shadow-sm text-xs sm:text-sm font-semibold rounded-xl sm:rounded-2xl text-neutral-200 bg-neutral-900/40 backdrop-blur-md hover:bg-neutral-800/60 transition-all hover:border-indigo-500/30 cursor-pointer"
              title="Export Laporan ke PDF"
            >
              <Download className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-indigo-400" /> PDF
            </button>
          </div>
        </div>
      </div>

      {/* Starting Balance Highlight & Edit Bar (For Month Mode) */}
      {filterMode === 'month' && (
        <div className="bg-gradient-to-r from-sky-950/50 via-neutral-900/60 to-neutral-900/60 border border-sky-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-sky-950/20">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-sky-500/10 border border-sky-500/25 flex items-center justify-center text-sky-400 shrink-0 shadow-sm">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-sky-300 uppercase tracking-wider">
                  Saldo Bulan Kemarin ({formatMonthLabel(selectedMonth)})
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  startingBalanceInfo.isManual 
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' 
                    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                }`}>
                  {startingBalanceInfo.isManual ? 'Input Manual' : (startingBalance > 0 ? 'Otomatis' : 'Belum Diinput')}
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl sm:text-2xl font-black text-white font-mono">
                  {formatRupiah(startingBalance)}
                </span>
                <span className="text-xs text-neutral-400">
                  (Masuk ke hitungan saldo akhir & report closing)
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              type="button"
              onClick={openBalanceModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-sky-600/20 transition-all cursor-pointer"
            >
              <Edit2 className="w-4 h-4" />
              <span>Input Saldo Manual</span>
            </button>
          </div>
        </div>
      )}

      {/* Helpful Alert if currently selected month has 0 transactions but other months have data */}
      {filterMode === 'month' && currentMonthCount === 0 && latestMonthWithData && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-300">
                Bulan {formatMonthLabel(selectedMonth)} belum memiliki transaksi
              </h4>
              <p className="text-xs text-neutral-300 mt-0.5">
                Ditemukan total <strong className="text-white">{latestMonthWithData.count} transaksi</strong> pada bulan <strong className="text-white">{formatMonthLabel(latestMonthWithData.monthStr)}</strong>.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              onClick={() => {
                setSelectedMonth(latestMonthWithData.monthStr);
                setHasUserChangedMonth(true);
              }}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Buka {formatMonthLabel(latestMonthWithData.monthStr)}</span>
            </button>
            <button
              onClick={() => setFilterMode('all')}
              className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-xl border border-neutral-700 transition-all cursor-pointer"
            >
              Lihat Semua Waktu
            </button>
          </div>
        </div>
      )}

      {/* Main Dashboard Content */}
      <div className="flex flex-col gap-3 sm:gap-6">
        {/* Top: Chart Area */}
        <div className="bg-neutral-900/30 backdrop-blur-xl border border-neutral-800/50 rounded-xl sm:rounded-[2rem] p-3 sm:p-6 h-[200px] sm:h-[400px] shadow-sm sm:shadow-xl relative overflow-hidden flex flex-col w-full">
          <div className="flex items-center justify-between mb-2 sm:mb-6 relative z-10">
            <h3 className="text-[10px] sm:text-sm font-bold text-neutral-400 uppercase tracking-widest">
              Arus Kas {filterMode === 'all' && availableMonths.length > 1 ? 'Bulanan' : 'Harian'} — {reportLabel}
            </h3>
            <span className="text-[11px] font-mono text-neutral-400">
              {filteredTxs.length} Transaksi Tercatat
            </span>
          </div>

          <div className="flex-1 relative z-10 w-full min-h-[140px] sm:min-h-[300px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262626" />
                  <XAxis dataKey="name" tick={{fill: '#737373', fontSize: 10}} tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={(val) => `${val / 1000}k`} tick={{fill: '#737373', fontSize: 10}} tickLine={false} axisLine={false} />
                  <Tooltip 
                    formatter={(value: number) => formatRupiah(value)} 
                    cursor={{fill: '#262626'}} 
                    contentStyle={{ backgroundColor: '#171717', borderColor: '#262626', color: '#f5f5f5', borderRadius: '1rem', padding: '8px', fontSize: '12px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}
                    itemStyle={{ color: '#f5f5f5', fontWeight: 600 }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '5px', fontSize: '10px' }} />
                  <Bar dataKey="Pemasukan" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="Pengeluaran" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-neutral-500">
                Tidak ada data grafik untuk periode terpilih
              </div>
            )}
          </div>
        </div>

        {/* 4 Cards Grid: Saldo Kemarin, Pemasukan, Pengeluaran Cash, Pengeluaran TF */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {/* Card 1: Saldo Bulan Kemarin */}
          <div className="bg-neutral-900/30 backdrop-blur-xl border border-sky-500/20 rounded-xl sm:rounded-[2rem] p-4 sm:p-6 shadow-sm sm:shadow-xl relative overflow-hidden flex flex-col justify-between">
             <div>
               <div className="flex items-center justify-between mb-1 sm:mb-3">
                 <h3 className="text-[10px] sm:text-xs font-bold text-sky-400 uppercase tracking-widest">Saldo Bulan Kemarin</h3>
                 <button
                   onClick={openBalanceModal}
                   className="text-neutral-400 hover:text-sky-300 p-1 rounded-lg hover:bg-neutral-800 transition-colors"
                   title="Input saldo kemarin secara manual"
                 >
                   <Edit2 className="w-3.5 h-3.5" />
                 </button>
               </div>
               <div className="text-lg sm:text-2xl font-black text-sky-300 mb-1">{formatRupiah(startingBalance)}</div>
             </div>
             <div className="text-xs text-neutral-400 pt-2 border-t border-neutral-800/40 flex items-center justify-between">
               <span>Status Saldo:</span>
               <span className="font-semibold text-neutral-200">
                 {startingBalanceInfo.isManual ? 'Manual' : (startingBalance > 0 ? 'Otomatis' : 'Rp 0')}
               </span>
             </div>
          </div>

          {/* Card 2: Pemasukan Kotor */}
          <div className="bg-neutral-900/30 backdrop-blur-xl border border-neutral-800/50 rounded-xl sm:rounded-[2rem] p-4 sm:p-6 shadow-sm sm:shadow-xl relative overflow-hidden">
             <h3 className="text-[10px] sm:text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1 sm:mb-3">Pemasukan Kotor</h3>
             <div className="text-lg sm:text-2xl font-black text-emerald-400 mb-1">{formatRupiah(summary.incomeBruto)}</div>
             {summary.incomeBreakdown.length > 0 ? (
                <ul className="text-xs text-neutral-400 pt-2 border-t border-neutral-800/40 space-y-1">
                  {summary.incomeBreakdown.slice(0, 3).map((item, idx) => (
                    <li key={idx} className="flex justify-between items-center">
                      <span className="capitalize text-neutral-400 font-medium truncate mr-2">{item.name}</span>
                      <span className="font-semibold text-neutral-200">{formatRupiah(item.amount)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-xs text-neutral-500 pt-2 border-t border-neutral-800/40">Tidak ada pemasukan</div>
              )}
          </div>

          {/* Card 3: Pengeluaran Cash */}
          <div className="bg-neutral-900/30 backdrop-blur-xl border border-neutral-800/50 rounded-xl sm:rounded-[2rem] p-4 sm:p-6 shadow-sm sm:shadow-xl relative overflow-hidden">
             <h3 className="text-[10px] sm:text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1 sm:mb-3">Pengel. Cash (Tunai)</h3>
             <div className="text-lg sm:text-2xl font-black text-rose-400 mb-1">{formatRupiah(summary.pengeluaranCashTotal)}</div>
             {summary.pengeluaranCashBreakdown.length > 0 ? (
                <ul className="text-xs text-neutral-400 pt-2 border-t border-neutral-800/40 space-y-1 max-h-24 overflow-y-auto pr-1 scrollbar-none">
                  {summary.pengeluaranCashBreakdown.slice(0, 3).map((item, idx) => (
                    <li key={idx} className="flex justify-between items-center">
                      <span className="capitalize text-neutral-400 font-medium truncate mr-2">{item.name}</span>
                      <span className="font-semibold text-neutral-200 whitespace-nowrap">{formatRupiah(item.amount)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-xs text-neutral-500 pt-2 border-t border-neutral-800/40">Tidak ada pengeluaran tunai</div>
              )}
          </div>

          {/* Card 4: Pengeluaran Transfer */}
          <div className="bg-neutral-900/30 backdrop-blur-xl border border-neutral-800/50 rounded-xl sm:rounded-[2rem] p-4 sm:p-6 shadow-sm sm:shadow-xl relative overflow-hidden">
             <h3 className="text-[10px] sm:text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1 sm:mb-3">Pengel. Transfer (Bank)</h3>
             <div className="text-lg sm:text-2xl font-black text-rose-400 mb-1">{formatRupiah(summary.pengeluaranTfTotal)}</div>
             {summary.pengeluaranTfBreakdown.length > 0 ? (
                <ul className="text-xs text-neutral-400 pt-2 border-t border-neutral-800/40 space-y-1 max-h-24 overflow-y-auto pr-1 scrollbar-none">
                  {summary.pengeluaranTfBreakdown.slice(0, 3).map((item, idx) => (
                    <li key={idx} className="flex justify-between items-center">
                      <span className="capitalize text-neutral-400 font-medium truncate mr-2">{item.name}</span>
                      <span className="font-semibold text-neutral-200 whitespace-nowrap">{formatRupiah(item.amount)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-xs text-neutral-500 pt-2 border-t border-neutral-800/40">Tidak ada pengeluaran transfer</div>
              )}
          </div>
        </div>

        {/* Hero Card: Total Saldo Akhir Kas Kumulatif (Saldo Kemarin + Laba Bersih) */}
        <div className="bg-gradient-to-br from-indigo-950/60 via-neutral-900/80 to-neutral-900/80 backdrop-blur-xl border border-indigo-500/30 rounded-xl sm:rounded-[2rem] p-4 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 sm:w-64 h-32 sm:h-64 bg-indigo-500/15 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                  Total Kas & Bank Akumulatif
                </span>
                <span className="text-xs text-neutral-400">Tercantum pada Laporan Excel & PDF</span>
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-neutral-300 uppercase tracking-widest">
                Total Saldo Akhir Kas Berjalan
              </h3>
              <div className="text-2xl sm:text-4xl xl:text-5xl font-black text-white tracking-tight break-words font-mono">
                {formatRupiah(totalEndingCash)}
              </div>
              <div className="p-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800/80 inline-flex flex-wrap items-center gap-2 text-xs text-neutral-300">
                <span>Rincian:</span>
                <span className="text-sky-400 font-semibold font-mono">Saldo Kemarin: {formatRupiah(startingBalance)}</span>
                <span className="text-neutral-500">+</span>
                <span className="text-emerald-400 font-semibold font-mono">Neto Bulan Ini: {formatRupiah(summary.incomeNeto)}</span>
                <span className="text-neutral-500">=</span>
                <span className="text-white font-bold font-mono">{formatRupiah(totalEndingCash)}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 lg:pt-0 border-t lg:border-t-0 lg:pl-8 lg:border-l border-neutral-800">
              <div>
                <span className="block text-[10px] sm:text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">
                  Income Neto (Bulan Ini)
                </span>
                <span className="text-base sm:text-xl font-bold text-emerald-400 font-mono">
                  {formatRupiah(summary.incomeNeto)}
                </span>
              </div>
              <div>
                <span className="block text-[10px] sm:text-xs font-bold text-indigo-300 uppercase tracking-wider mb-1">
                  Profit Perusahaan (15%)
                </span>
                <span className="text-base sm:text-xl font-bold text-indigo-200 font-mono">
                  {formatRupiah(summary.profitPerusahaan)}
                </span>
              </div>
              <div>
                <span className="block text-[10px] sm:text-xs font-bold text-amber-300 uppercase tracking-wider mb-1">
                  Profit Owner (20%)
                </span>
                <span className="text-base sm:text-xl font-bold text-amber-400 font-mono">
                  {formatRupiah(summary.profitOwner)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Loan Summary Section if loans exist */}
        {loans.length > 0 && (
          <div className="bg-neutral-900/30 backdrop-blur-xl border border-neutral-800/50 rounded-xl sm:rounded-[2rem] p-4 sm:p-6 shadow-sm sm:shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl">
                  <HandCoins className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Status Pinjaman & Pelunasan</h3>
                  <p className="text-xs text-neutral-400">Ringkasan tagihan pinjaman karyawan & owner</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs sm:text-sm font-mono">
                <div>
                  <span className="text-neutral-400">Total Sisa Tagihan: </span>
                  <span className="font-bold text-rose-400">
                    {formatRupiah(loans.reduce((sum, l) => sum + getLoanRemaining(l), 0))}
                  </span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
              {loans.slice(0, 3).map(loan => {
                const rem = getLoanRemaining(loan);
                return (
                  <div key={loan.id} className="p-3 bg-neutral-950/50 border border-neutral-800/50 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-neutral-200">{loan.borrowerName} ({loan.type === 'owner' ? 'Owner' : 'Karyawan'})</div>
                      <div className="text-neutral-500 mt-0.5 font-mono">{formatRupiah(loan.amount)}</div>
                    </div>
                    <div className="text-right">
                      {rem <= 0 ? (
                        <span className="text-emerald-400 font-bold">Lunas</span>
                      ) : (
                        <div>
                          <span className="text-rose-400 font-bold font-mono">{formatRupiah(rem)}</span>
                          <div className="text-[10px] text-neutral-500">Sisa</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Manual Starting Balance Modal */}
      {isBalanceModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm">
          <div 
            className="fixed inset-0" 
            onClick={() => setIsBalanceModalOpen(false)} 
          />
          <div className="relative bg-neutral-900 border border-neutral-800 rounded-t-[2rem] sm:rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl space-y-5 z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-sky-500/10 border border-sky-500/25 rounded-xl text-sky-400">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">Input Saldo Bulan Kemarin</h3>
                  <p className="text-xs text-neutral-400">Periode {formatMonthLabel(selectedMonth)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBalanceModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBalance} className="space-y-4">
              <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-3.5 text-xs text-sky-200/90 leading-relaxed">
                Total saldo sisa kas fisik & rekening bank dari akhir bulan sebelumnya yang dibawa masuk sebagai saldo awal bulan <strong>{formatMonthLabel(selectedMonth)}</strong>. Saldo ini akan otomatis masuk ke perhitungan closing bulanan dan laporan Excel/PDF.
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                  Nominal Saldo Kemarin (Rp)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-sm font-bold text-neutral-400">
                    Rp
                  </span>
                  <input
                    type="number"
                    value={balanceInput}
                    onChange={(e) => setBalanceInput(e.target.value)}
                    placeholder="Contoh: 15000000"
                    className="w-full pl-12 pr-4 py-3 bg-neutral-950/70 border border-neutral-800 focus:border-sky-500 rounded-xl text-base sm:text-lg font-bold text-white outline-none focus:ring-2 focus:ring-sky-500/20 font-mono"
                    autoFocus
                  />
                </div>
                {balanceInput && (
                  <p className="text-xs text-neutral-400 mt-1.5 font-mono">
                    Terbaca: <strong className="text-sky-300">{formatRupiah(parseFloat(balanceInput) || 0)}</strong>
                  </p>
                )}
              </div>

              {/* Quick Nominal Chips */}
              <div>
                <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                  Tambah Cepat Nominal
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[1000000, 5000000, 10000000, 25000000, 50000000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => addPresetBalance(amt)}
                      className="px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 hover:border-sky-500/50 hover:bg-neutral-800 rounded-lg text-xs font-semibold text-neutral-300 transition-colors cursor-pointer"
                    >
                      +{amt >= 1000000 ? `${amt / 1000000}jt` : `${amt / 1000}rb`}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setBalanceInput('')}
                    className="px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 hover:border-rose-500/50 text-rose-400 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Reset (0)
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-neutral-800">
                {startingBalanceInfo.isManual ? (
                  <button
                    type="button"
                    onClick={handleResetBalance}
                    disabled={isSavingBalance}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Kembalikan ke Hitungan Otomatis</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setIsBalanceModalOpen(false)}
                    disabled={isSavingBalance}
                    className="flex-1 sm:flex-none px-4 py-2.5 text-xs sm:text-sm font-medium text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingBalance}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-xl shadow-lg shadow-sky-600/25 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isSavingBalance ? 'Menyimpan...' : 'Simpan Saldo'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Annual Report Export Modal */}
      <AnimatePresence>
        {showYearModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl sm:rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white">Export Report Tahunan</h3>
                    <p className="text-xs text-neutral-400">Workbook Excel 12 Bulan + Ringkasan Tahunan</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowYearModal(false)}
                  className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Year Selector */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                  Pilih Tahun Laporan
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {availableYears.map(yr => (
                    <button
                      key={yr}
                      onClick={() => setSelectedYear(yr)}
                      className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all border ${
                        selectedYear === yr
                          ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-sm'
                          : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
                      }`}
                    >
                      {yr}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sheet Structure Preview */}
              <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between font-semibold text-neutral-300">
                  <span>Daftar Sheets yang Dibuat:</span>
                  <span className="text-amber-400">13 Sheets (1 Tahun + 12 Bulan)</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="px-2 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold rounded-lg">
                    {selectedYear}
                  </span>
                  {MONTH_NAMES_ID.map(mName => (
                    <span
                      key={mName}
                      className="px-2 py-0.5 bg-neutral-900 border border-neutral-800 text-neutral-300 rounded-md"
                    >
                      {mName} {String(selectedYear).slice(-2)}
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-neutral-400 italic pt-1 border-t border-neutral-800/60">
                  Format setiap sheet bulanan menggunakan template resmi Closing Monthly dengan baris Saldo Akhir, Income Bruto, Share Profit, Pengeluaran Dinas, Pengeluaran Bulanan, Kebutuhan Owner, Pinjaman Karyawan, dan rumus kalkulasi otomatis.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowYearModal(false)}
                  className="px-4 py-2 text-xs sm:text-sm font-medium text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800/80 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => handleExportYearlyReport(selectedYear)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-lg shadow-amber-400/20 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Download Excel ({selectedYear})
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
