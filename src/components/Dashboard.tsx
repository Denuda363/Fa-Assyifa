import { useMemo, useState } from 'react';
import { Transaction, CompanyProfile, formatRupiah } from '../types';
import { ArrowDownRight, ArrowUpRight, Wallet, Building, User, Download, Calendar, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { exportToPDF, exportToExcel } from '../utils/exportUtils';
import { format, isWithinInterval, startOfDay, endOfDay, parseISO, eachDayOfInterval } from 'date-fns';
import { motion } from 'motion/react';

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

  const { filteredTxs, summary, chartData } = useMemo(() => {
    
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
        const txDate = parseISO(tx.date);
        const start = startDate ? startOfDay(parseISO(startDate)) : null;
        const end = endDate ? endOfDay(parseISO(endDate)) : null;
        
        if (start && end) {
          return isWithinInterval(txDate, { start, end });
        } else if (start) {
          return txDate >= start;
        } else if (end) {
          return txDate <= end;
        }
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
          if (t.type === 'income') dailyData[dayIdx].Pemasukan += t.amount;
          if (t.type === 'outcome') dailyData[dayIdx].Pengeluaran += t.amount;
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

    return { 
      filteredTxs: filtered,
      summary,
      chartData: dailyData
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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 sm:gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-white">Dashboard</h2>
        <div className="flex flex-col xl:flex-row xl:items-center gap-3 w-full xl:w-auto">
          
          {/* Elegant Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 bg-neutral-900/30 backdrop-blur-xl border border-neutral-800/50 p-1.5 sm:p-2 rounded-xl sm:rounded-2xl shadow-sm">
            
            {/* Custom Segmented Control */}
            <div className="flex bg-neutral-950/60 border border-neutral-800/60 rounded-lg sm:rounded-xl p-1 relative w-full sm:w-auto">
              <button
                onClick={() => setFilterMode('month')}
                className={`relative z-10 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold rounded-md sm:rounded-lg transition-colors flex-1 sm:flex-none ${filterMode === 'month' ? 'text-indigo-300' : 'text-neutral-500 hover:text-neutral-300'}`}
              >
                {filterMode === 'month' && (
                  <motion.div layoutId="filter-bg" className="absolute inset-0 bg-indigo-500/20 border border-indigo-500/30 rounded-md sm:rounded-lg -z-10" transition={{ type: "spring", stiffness: 350, damping: 25 }} />
                )}
                Bulanan
              </button>
              <button
                onClick={() => setFilterMode('custom')}
                className={`relative z-10 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold rounded-md sm:rounded-lg transition-colors flex-1 sm:flex-none ${filterMode === 'custom' ? 'text-indigo-300' : 'text-neutral-500 hover:text-neutral-300'}`}
              >
                {filterMode === 'custom' && (
                  <motion.div layoutId="filter-bg" className="absolute inset-0 bg-indigo-500/20 border border-indigo-500/30 rounded-md sm:rounded-lg -z-10" transition={{ type: "spring", stiffness: 350, damping: 25 }} />
                )}
                Spesifik
              </button>
            </div>

            {filterMode === 'month' ? (
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-neutral-950/50 border border-neutral-800/60 text-white rounded-lg sm:rounded-xl focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-xs sm:text-sm py-1.5 px-3 sm:py-2.5 sm:px-4 outline-none transition-all w-full sm:w-auto min-w-[150px] shadow-inner"
              />
            ) : (
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

          <div className="flex gap-2 w-full xl:w-auto">
            <button
              onClick={handleExportPDF}
              className="flex-1 xl:flex-none inline-flex justify-center items-center px-3 py-1.5 sm:px-5 sm:py-2.5 border border-neutral-800/60 shadow-sm text-xs sm:text-sm font-semibold rounded-xl sm:rounded-2xl text-neutral-200 bg-neutral-900/40 backdrop-blur-md hover:bg-neutral-800/60 transition-all hover:border-indigo-500/30"
            >
              <Download className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 text-indigo-400" /> PDF
            </button>
            <button
              onClick={handleExportExcel}
              className="flex-1 xl:flex-none inline-flex justify-center items-center px-3 py-1.5 sm:px-5 sm:py-2.5 border border-neutral-800/60 shadow-sm text-xs sm:text-sm font-semibold rounded-xl sm:rounded-2xl text-neutral-200 bg-neutral-900/40 backdrop-blur-md hover:bg-neutral-800/60 transition-all hover:border-indigo-500/30"
            >
              <Download className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 text-indigo-400" /> Excel
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:gap-6">
        {/* Top: Chart Area */}
        <div className="bg-neutral-900/30 backdrop-blur-xl border border-neutral-800/50 rounded-xl sm:rounded-[2rem] p-3 sm:p-6 h-[180px] sm:h-[400px] shadow-sm sm:shadow-xl relative overflow-hidden flex flex-col w-full">
          <h3 className="text-[10px] sm:text-sm font-bold text-neutral-500 uppercase tracking-widest mb-2 sm:mb-6 relative z-10">Arus Kas Harian - {reportLabel}</h3>
          <div className="flex-1 relative z-10 w-full min-h-[120px] sm:min-h-[300px]">
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
          </div>
        </div>

        {/* Middle: 3 Breakdown Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6">
          <div className="bg-neutral-900/30 backdrop-blur-xl border border-neutral-800/50 rounded-xl sm:rounded-[2rem] p-3 sm:p-6 shadow-sm sm:shadow-xl relative overflow-hidden">
             <h3 className="text-[10px] sm:text-sm font-bold text-neutral-500 uppercase tracking-widest mb-1 sm:mb-4">Pemasukan Kotor</h3>
             <div className="text-lg sm:text-2xl font-bold text-emerald-400 mb-1 sm:mb-4">{formatRupiah(summary.incomeBruto)}</div>
             {summary.incomeBreakdown.length > 0 && (
                <ul className="text-xs sm:text-sm text-neutral-400">
                  {summary.incomeBreakdown.map((item, idx) => (
                    <li key={idx} className="flex justify-between items-center py-1 sm:py-2 border-b border-neutral-800/30 last:border-0">
                      <span className="capitalize text-neutral-400 font-medium">{item.name}</span>
                      <span className="font-semibold text-neutral-200">{formatRupiah(item.amount)}</span>
                    </li>
                  ))}
                </ul>
              )}
          </div>

          <div className="bg-neutral-900/30 backdrop-blur-xl border border-neutral-800/50 rounded-xl sm:rounded-[2rem] p-3 sm:p-6 shadow-sm sm:shadow-xl relative overflow-hidden">
             <div className="flex justify-between items-center mb-1 sm:mb-4">
               <h3 className="text-[10px] sm:text-sm font-bold text-neutral-500 uppercase tracking-widest">Pengel. Cash</h3>
             </div>
             <div className="text-lg sm:text-2xl font-bold text-rose-400 mb-1 sm:mb-4">{formatRupiah(summary.pengeluaranCashTotal)}</div>
             {summary.pengeluaranCashBreakdown.length > 0 ? (
                <ul className="text-xs sm:text-sm text-neutral-400">
                  {summary.pengeluaranCashBreakdown.map((item, idx) => (
                    <li key={idx} className="flex justify-between items-center py-1 sm:py-2 border-b border-neutral-800/30 last:border-0">
                      <span className="capitalize text-neutral-400 font-medium truncate mr-2">{item.name}</span>
                      <span className="font-semibold text-neutral-200 whitespace-nowrap">{formatRupiah(item.amount)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-xs sm:text-sm text-neutral-600 py-1 sm:py-2 text-left">Tidak ada data</div>
              )}
          </div>

          <div className="bg-neutral-900/30 backdrop-blur-xl border border-neutral-800/50 rounded-xl sm:rounded-[2rem] p-3 sm:p-6 shadow-sm sm:shadow-xl relative overflow-hidden">
             <div className="flex justify-between items-center mb-1 sm:mb-4">
               <h3 className="text-[10px] sm:text-sm font-bold text-neutral-500 uppercase tracking-widest">Pengel. Transfer</h3>
             </div>
             <div className="text-lg sm:text-2xl font-bold text-rose-400 mb-1 sm:mb-4">{formatRupiah(summary.pengeluaranTfTotal)}</div>
             {summary.pengeluaranTfBreakdown.length > 0 ? (
                <ul className="text-xs sm:text-sm text-neutral-400">
                  {summary.pengeluaranTfBreakdown.map((item, idx) => (
                    <li key={idx} className="flex justify-between items-center py-1 sm:py-2 border-b border-neutral-800/30 last:border-0">
                      <span className="capitalize text-neutral-400 font-medium truncate mr-2">{item.name}</span>
                      <span className="font-semibold text-neutral-200 whitespace-nowrap">{formatRupiah(item.amount)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-xs sm:text-sm text-neutral-600 py-1 sm:py-2 text-left">Tidak ada data</div>
              )}
          </div>
        </div>

        {/* Hero Card Income Neto at Bottom */}
        <div className="bg-gradient-to-br from-indigo-500/10 to-neutral-900/30 backdrop-blur-xl border border-indigo-500/20 rounded-xl sm:rounded-[2rem] p-4 sm:p-10 shadow-sm sm:shadow-xl relative overflow-hidden flex-1 flex flex-col justify-center">
          <div className="absolute top-0 right-0 w-32 sm:w-48 h-32 sm:h-48 bg-indigo-500/20 rounded-full blur-2xl sm:blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-6">
            <div>
              <h3 className="text-[10px] sm:text-sm font-bold text-indigo-300 uppercase tracking-widest mb-1 sm:mb-2">Total Income Neto</h3>
              <div className="text-2xl sm:text-4xl xl:text-5xl font-bold text-white tracking-tight break-words">
                {formatRupiah(summary.incomeNeto)}
              </div>
            </div>
            
            <div className="flex flex-row sm:flex-col gap-4 sm:gap-4 md:gap-8 pt-3 sm:pt-0 border-t sm:border-t-0 md:pl-8 md:border-l border-indigo-500/20">
              <div className="flex-1">
                <span className="block text-[9px] sm:text-sm font-bold text-indigo-200/70 uppercase tracking-widest mb-0.5 sm:mb-1">Profit Perusahaan (15%)</span>
                <span className="text-sm sm:text-xl md:text-2xl font-bold text-indigo-100">{formatRupiah(summary.profitPerusahaan)}</span>
              </div>
              <div className="flex-1 border-l border-indigo-500/20 pl-4 sm:border-0 sm:pl-0">
                <span className="block text-[9px] sm:text-sm font-bold text-amber-200/70 uppercase tracking-widest mb-0.5 sm:mb-1">Profit Owner (20%)</span>
                <span className="text-sm sm:text-xl md:text-2xl font-bold text-amber-400">{formatRupiah(summary.profitOwner)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
