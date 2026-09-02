import { useMemo, useState } from 'react';
import { Transaction, CompanyProfile, formatRupiah } from '../types';
import { ArrowDownRight, ArrowUpRight, Wallet, Building, User, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { exportToPDF, exportToExcel } from '../utils/exportUtils';
import { format } from 'date-fns';

interface DashboardProps {
  transactions: Transaction[];
  profile: CompanyProfile;
}

export default function Dashboard({ transactions, profile }: DashboardProps) {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const { filteredTxs, summary, chartData } = useMemo(() => {
    const [year, month] = selectedMonth.split('-');
    
    const filtered = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === parseInt(year) && d.getMonth() + 1 === parseInt(month);
    });

    let incomeBruto = 0;
    let outcomeTotal = 0;

    filtered.forEach(t => {
      if (t.type === 'income') incomeBruto += t.amount;
      if (t.type === 'outcome') outcomeTotal += t.amount;
    });

    const operationalProfit = incomeBruto - outcomeTotal;
    // According to instructions: Profit Perusahaan 15%, Profit Owner 20% dari profit perusahaan
    const profitPerusahaan = operationalProfit > 0 ? operationalProfit * 0.15 : 0;
    const profitOwner = profitPerusahaan * 0.20;
    const incomeNeto = operationalProfit > 0 ? operationalProfit - profitPerusahaan - profitOwner : operationalProfit;

    // Daily chart data
    const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
    const dailyData = Array.from({ length: daysInMonth }, (_, i) => ({
      name: `${i + 1}`,
      Pemasukan: 0,
      Pengeluaran: 0
    }));

    filtered.forEach(t => {
      const d = new Date(t.date);
      const dayIdx = d.getDate() - 1;
      if (t.type === 'income') dailyData[dayIdx].Pemasukan += t.amount;
      if (t.type === 'outcome') dailyData[dayIdx].Pengeluaran += t.amount;
    });

    return { 
      filteredTxs: filtered,
      summary: { incomeBruto, outcomeTotal, operationalProfit, profitPerusahaan, profitOwner, incomeNeto },
      chartData: dailyData
    };
  }, [transactions, selectedMonth]);

  const monthYearLabel = format(new Date(`${selectedMonth}-01`), 'MMMM yyyy');

  const handleExportPDF = () => {
    exportToPDF({ transactions: filteredTxs, profile, monthYear: monthYearLabel, summary });
  };

  const handleExportExcel = () => {
    exportToExcel({ transactions: filteredTxs, profile, monthYear: monthYearLabel, summary });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-white">Dashboard</h2>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-slate-800 border-slate-700 text-white rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 text-sm py-2 px-3 border flex-1 min-w-[150px]"
          />
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

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Income Bruto */}
        <div className="bg-[#11141b] border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArrowUpRight className="h-6 w-6 text-emerald-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-slate-500 truncate">Income Bruto</dt>
                  <dd className="text-xl font-bold text-white tracking-tight">{formatRupiah(summary.incomeBruto)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Pengeluaran */}
        <div className="bg-[#11141b] border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArrowDownRight className="h-6 w-6 text-rose-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-slate-500 truncate">Total Pengeluaran</dt>
                  <dd className="text-xl font-bold text-white tracking-tight">{formatRupiah(summary.outcomeTotal)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Income Neto */}
        <div className="bg-[#11141b] border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Wallet className="h-6 w-6 text-sky-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-slate-500 truncate">Income Neto</dt>
                  <dd className="text-xl font-bold text-white tracking-tight">{formatRupiah(summary.incomeNeto)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        
        {/* Profit Perusahaan */}
        <div className="bg-[#11141b] border border-slate-800 rounded-xl overflow-hidden sm:col-span-1 lg:col-span-1">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Building className="h-6 w-6 text-emerald-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-emerald-400/70 truncate">Profit Perusahaan (15%)</dt>
                  <dd className="text-lg font-bold text-emerald-400">{formatRupiah(summary.profitPerusahaan)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Profit Owner */}
        <div className="bg-[#11141b] border border-slate-800 rounded-xl overflow-hidden sm:col-span-1 lg:col-span-2">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <User className="h-6 w-6 text-amber-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-amber-400/70 truncate">Profit Owner (20% dari Profit)</dt>
                  <dd className="text-lg font-bold text-amber-400">{formatRupiah(summary.profitOwner)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#11141b] border border-slate-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Arus Kas Harian - {monthYearLabel}</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
              <XAxis dataKey="name" tick={{fill: '#64748b'}} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={(val) => `Rp ${val / 1000}k`} tick={{fill: '#64748b'}} tickLine={false} axisLine={false} />
              <Tooltip 
                formatter={(value: number) => formatRupiah(value)} 
                cursor={{fill: '#1e293b'}} 
                contentStyle={{ backgroundColor: '#11141b', borderColor: '#1e293b', color: '#f8fafc' }}
                itemStyle={{ color: '#f8fafc' }}
              />
              <Legend />
              <Bar dataKey="Pemasukan" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Pengeluaran" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
