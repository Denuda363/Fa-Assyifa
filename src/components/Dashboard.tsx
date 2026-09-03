import { useMemo, useState } from 'react';
import { Transaction, CompanyProfile, formatRupiah } from '../types';
import { ArrowDownRight, ArrowUpRight, Wallet, Building, User, Download, Calendar, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { exportToPDF, exportToExcel } from '../utils/exportUtils';
import { format, isWithinInterval, startOfDay, endOfDay, parseISO, eachDayOfInterval } from 'date-fns';

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
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-white">Dashboard</h2>
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          
          {/* Filter Mode Selector */}
          <select 
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value as 'month' | 'custom')}
            className="bg-slate-800 border-slate-700 text-white rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 text-sm py-2 px-3 border"
          >
            <option value="month">Per Bulan</option>
            <option value="custom">Rentang Tanggal</option>
          </select>

          {filterMode === 'month' ? (
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 text-sm py-2 px-3 border flex-1 min-w-[150px]"
            />
          ) : (
            <div className="flex items-center gap-2 bg-[#11141b] border border-slate-700 rounded-md p-1.5 flex-1 min-w-[200px]">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent border-none text-slate-300 text-sm focus:ring-0 w-full px-2"
                title="Dari Tanggal"
              />
              <span className="text-slate-500">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent border-none text-slate-300 text-sm focus:ring-0 w-full px-2"
                title="Sampai Tanggal"
              />
            </div>
          )}

          <div className="flex gap-2 flex-1 min-w-[200px]">
            <button
              onClick={handleExportPDF}
              className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-slate-700 shadow-sm text-sm font-medium rounded-md text-slate-200 bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              <Download className="mr-2 h-4 w-4" /> PDF
            </button>
            <button
              onClick={handleExportExcel}
              className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-slate-700 shadow-sm text-sm font-medium rounded-md text-slate-200 bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              <Download className="mr-2 h-4 w-4" /> Excel
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Breakdown text list */}
        <div className="lg:col-span-1">
          <div className="bg-[#11141b] border border-slate-800 rounded-xl p-5 shadow-sm">
            <h3 className="text-lg font-bold text-white mb-5">Ringkasan Laporan</h3>
            
            {/* Income Bruto */}
            <div className="mb-5">
              <div className="flex justify-between items-center text-emerald-400 font-semibold mb-2">
                <span>Income bruto</span>
                <span>{formatRupiah(summary.incomeBruto)}</span>
              </div>
              {summary.incomeBreakdown.length > 0 && (
                <ul className="space-y-1.5 pl-4 text-sm text-slate-400 border-l border-slate-800/80 ml-2">
                  {summary.incomeBreakdown.map((item, idx) => (
                    <li key={idx} className="flex justify-between">
                      <span className="capitalize">- {item.name}</span>
                      <span>{formatRupiah(item.amount)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Pengeluaran Cash */}
            <div className="mb-5">
              <div className="flex justify-between items-center text-rose-400 font-semibold mb-2">
                <span>Pengeluaran cash</span>
                <span>{formatRupiah(summary.pengeluaranCashTotal)}</span>
              </div>
              {summary.pengeluaranCashBreakdown.length > 0 && (
                <ul className="space-y-1.5 pl-4 text-sm text-slate-400 border-l border-slate-800/80 ml-2">
                  {summary.pengeluaranCashBreakdown.map((item, idx) => (
                    <li key={idx} className="flex justify-between">
                      <span className="capitalize">- {item.name}</span>
                      <span>{formatRupiah(item.amount)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Pengeluaran TF */}
            <div className="mb-5">
              <div className="flex justify-between items-center text-rose-400 font-semibold mb-2">
                <span>Pengeluaran tf</span>
                <span>{formatRupiah(summary.pengeluaranTfTotal)}</span>
              </div>
              {summary.pengeluaranTfBreakdown.length > 0 && (
                <ul className="space-y-1.5 pl-4 text-sm text-slate-400 border-l border-slate-800/80 ml-2">
                  {summary.pengeluaranTfBreakdown.map((item, idx) => (
                    <li key={idx} className="flex justify-between">
                      <span className="capitalize">- {item.name}</span>
                      <span>{formatRupiah(item.amount)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border-t border-slate-800 pt-5 mt-2 space-y-3.5">
              <div className="flex justify-between items-center text-emerald-300 font-semibold">
                <span>Profit perusahaan 15%</span>
                <span>{formatRupiah(summary.profitPerusahaan)}</span>
              </div>
              <div className="flex justify-between items-center text-amber-400 font-semibold">
                <span>Profit owner</span>
                <span>{formatRupiah(summary.profitOwner)}</span>
              </div>
              <div className="flex justify-between items-center text-sky-400 font-bold text-lg pt-3 border-t border-slate-800/50">
                <span>Income neto</span>
                <span>{formatRupiah(summary.incomeNeto)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Chart */}
        <div className="lg:col-span-2">
          <div className="bg-[#11141b] border border-slate-800 rounded-xl p-6 h-full shadow-sm">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-6">Arus Kas Harian - {reportLabel}</h3>
            <div className="h-[450px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                  <XAxis dataKey="name" tick={{fill: '#64748b'}} tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={(val) => `Rp ${val / 1000}k`} tick={{fill: '#64748b'}} tickLine={false} axisLine={false} />
                  <Tooltip 
                    formatter={(value: number) => formatRupiah(value)} 
                    cursor={{fill: '#1e293b'}} 
                    contentStyle={{ backgroundColor: '#11141b', borderColor: '#1e293b', color: '#f8fafc', borderRadius: '0.5rem' }}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="Pemasukan" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Pengeluaran" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
