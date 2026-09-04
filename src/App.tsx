/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { LayoutDashboard, ReceiptText, Building2, Settings, Clock, Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Profile from './components/Profile';
import AppSettings from './components/AppSettings';
import { useFinanceData } from './hooks/useFinanceData';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentTime, setCurrentTime] = useState(new Date());
  const { transactions, profile, loading, addTransaction, updateTransaction, deleteTransaction, updateProfile } = useFinanceData();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0c10]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard transactions={transactions} profile={profile} />;
      case 'transactions':
        return <Transactions 
          transactions={transactions} 
          onAdd={addTransaction} 
          onUpdate={updateTransaction} 
          onDelete={deleteTransaction} 
        />;
      case 'profile':
        return <Profile profile={profile} onUpdate={updateProfile} />;
      case 'settings':
        return <AppSettings transactions={transactions} onRestore={async () => {}} />;
      default:
        return <Dashboard transactions={transactions} profile={profile} />;
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', shortLabel: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transaksi', shortLabel: 'Transaksi', icon: ReceiptText },
    { id: 'profile', label: 'Profil Perusahaan', shortLabel: 'Profil', icon: Building2 },
    { id: 'settings', label: 'Pengaturan', shortLabel: 'Pengaturan', icon: Settings },
  ];

  const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  
  const dayName = DAYS[currentTime.getDay()];
  const day = currentTime.getDate();
  const monthName = MONTHS[currentTime.getMonth()];
  const year = currentTime.getFullYear();
  const dateStr = `${dayName}, ${day} ${monthName} ${year}`;
  
  const hours = String(currentTime.getHours()).padStart(2, '0');
  const minutes = String(currentTime.getMinutes()).padStart(2, '0');
  const seconds = String(currentTime.getSeconds()).padStart(2, '0');
  const timeStr = `${hours}:${minutes}:${seconds}`;

  return (
    <div className="flex h-screen bg-[#0a0c10] text-slate-300 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-[#11141b] border-r border-slate-800 flex flex-col hidden md:flex z-20">
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-400 rounded-xl flex items-center justify-center text-slate-950 font-black tracking-tight shadow-md shadow-emerald-500/20">
              PF
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight leading-tight">ProfitFlow</h1>
              <span className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase">Finance Pro</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full" title="Database Terhubung">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[10px] text-emerald-400 font-medium">Live</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            Menu Utama
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm font-medium rounded-xl transition-all ${
                  isActive 
                    ? 'bg-emerald-500/15 text-emerald-300 font-semibold shadow-sm border border-emerald-500/20' 
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center">
                  <Icon className={`mr-3 h-4 w-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                  {item.label}
                </div>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Company Profile Pill in Sidebar */}
        <div className="p-4 border-t border-slate-800/80 bg-[#0c0e14]">
          <div 
            onClick={() => setActiveTab('profile')}
            className="group cursor-pointer p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white truncate group-hover:text-emerald-400 transition-colors">
                {profile.name || 'Nama Perusahaan'}
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-1.5 py-0.5 rounded-md">
                20%
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate">Bagi Hasil Owner</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* Desktop Header */}
        <header className="hidden md:flex h-20 items-center justify-between px-8 border-b border-slate-800/60 bg-[#0a0c10]/90 backdrop-blur-md sticky top-0 z-10">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              {activeTab === 'dashboard' && 'Dashboard & Analitik Finansial'}
              {activeTab === 'transactions' && 'Riwayat & Mutasi Kas'}
              {activeTab === 'profile' && 'Profil Perusahaan'}
              {activeTab === 'settings' && 'Pengaturan & Backup'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {activeTab === 'dashboard' && 'Pantau ringkasan laba kotor, beban operasional, dan profit owner'}
              {activeTab === 'transactions' && 'Kelola dan cari transaksi kas masuk dan pengeluaran secara teratur'}
              {activeTab === 'profile' && 'Konfigurasi identitas apotek untuk kop laporan cetak & dokumen'}
              {activeTab === 'settings' && 'Cadangkan atau pulihkan data riwayat keuangan secara aman'}
            </p>
          </div>

          <div className="flex items-center gap-4">
             {/* Time Widget */}
             <div className="flex items-center gap-3 bg-[#11141b] border border-slate-800/80 py-2 px-4 rounded-xl shadow-sm">
               <div className="flex items-center gap-2 border-r border-slate-800 pr-3.5">
                 <div className="bg-emerald-500/10 p-1.5 rounded-lg">
                   <Calendar className="h-3.5 w-3.5 text-emerald-400" />
                 </div>
                 <span className="text-xs font-medium text-slate-300">{dateStr}</span>
               </div>
               <div className="flex items-center gap-2 pl-0.5">
                 <div className="bg-sky-500/10 p-1.5 rounded-lg">
                   <Clock className="h-3.5 w-3.5 text-sky-400" />
                 </div>
                 <span className="text-sm font-bold text-white tracking-wider font-mono">{timeStr}</span>
               </div>
             </div>
          </div>
        </header>

        {/* Mobile Header (Sleek Minimalist Single-bar) */}
        <header className="bg-[#11141b]/95 backdrop-blur-md border-b border-slate-800/80 md:hidden sticky top-0 z-20 px-3.5 py-2.5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 bg-gradient-to-tr from-emerald-600 to-teal-400 rounded-lg flex items-center justify-center text-slate-950 font-black text-xs shadow-sm shrink-0">
              PF
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-white tracking-tight">ProfitFlow</span>
                <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  {activeTab === 'dashboard' ? 'Overview' : activeTab === 'transactions' ? 'Mutasi' : activeTab === 'profile' ? 'Profil' : 'Sistem'}
                </span>
              </div>
            </div>
          </div>

          {/* Minimalist Live Time Capsule */}
          <div className="flex items-center gap-1.5 bg-[#0a0c10] border border-slate-800/80 px-2.5 py-1 rounded-xl shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[11px] font-bold text-white tracking-wider font-mono">{timeStr}</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-8">
          <div className="max-w-7xl mx-auto pb-24 md:pb-0">
            {renderContent()}
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-sm bg-[#11141b]/95 backdrop-blur-xl border border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.4)] rounded-2xl z-50 p-1.5 flex justify-between items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="relative flex flex-col items-center justify-center w-[4.5rem] h-14 rounded-xl outline-none"
              >
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-pill"
                    className="absolute inset-0 bg-emerald-500/15 rounded-xl border border-emerald-500/20"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon className={`relative z-10 h-[22px] w-[22px] mb-1 transition-colors duration-300 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span className={`relative z-10 text-[10px] font-medium transition-colors duration-300 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {item.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}


