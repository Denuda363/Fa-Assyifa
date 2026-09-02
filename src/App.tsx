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
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-slate-900 font-bold mr-3 shrink-0">PF</div>
          <h1 className="text-lg font-bold text-white tracking-tight">ProfitFlow</h1>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-emerald-500/10 text-emerald-400' 
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* Desktop Header */}
        <header className="hidden md:flex h-20 items-center justify-between px-8 border-b border-slate-800/50 bg-[#0a0c10]/80 backdrop-blur-md sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-white capitalize">{activeTab.replace('-', ' ')}</h2>
            <p className="text-sm text-slate-500">Overview finansial Anda hari ini</p>
          </div>
          <div className="flex items-center gap-4">
             {/* Time Widget */}
             <div className="flex items-center gap-4 bg-[#11141b] border border-slate-800 py-2.5 px-5 rounded-2xl shadow-sm">
               <div className="flex items-center gap-2.5 border-r border-slate-700/80 pr-4">
                 <div className="bg-emerald-500/10 p-1.5 rounded-lg">
                   <Calendar className="h-4 w-4 text-emerald-500" />
                 </div>
                 <span className="text-sm font-medium text-slate-300">{dateStr}</span>
               </div>
               <div className="flex items-center gap-2.5 pl-1">
                 <div className="bg-sky-500/10 p-1.5 rounded-lg">
                   <Clock className="h-4 w-4 text-sky-500" />
                 </div>
                 <span className="text-base font-bold text-white tracking-wider font-mono">{timeStr}</span>
               </div>
             </div>
          </div>
        </header>

        {/* Mobile Header */}
        <header className="bg-[#11141b] border-b border-slate-800 md:hidden flex flex-col sticky top-0 z-10">
          <div className="h-16 flex items-center justify-center px-4 relative">
             <div className="flex items-center gap-2">
               <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-slate-900 font-bold shrink-0">PF</div>
               <h1 className="text-lg font-bold text-white tracking-tight">ProfitFlow</h1>
             </div>
          </div>
          <div className="px-4 pb-3 flex items-center justify-between">
             <div className="flex items-center gap-2 bg-[#0a0c10] border border-slate-800 px-3 py-1.5 rounded-lg">
               <Calendar className="h-3.5 w-3.5 text-emerald-500" />
               <span className="text-xs font-medium text-slate-400">{dateStr}</span>
             </div>
             <div className="flex items-center gap-2 bg-[#0a0c10] border border-slate-800 px-3 py-1.5 rounded-lg">
               <Clock className="h-3.5 w-3.5 text-sky-500" />
               <span className="text-xs font-bold text-white tracking-widest font-mono">{timeStr}</span>
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto pb-28 md:pb-0">
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


