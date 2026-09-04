/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { LayoutDashboard, ReceiptText, Building2, Settings, Clock, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
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
    { id: 'dashboard', label: 'Dashboard', shortLabel: 'Home', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transaksi', shortLabel: 'Data', icon: ReceiptText },
    { id: 'profile', label: 'Profil Perusahaan', shortLabel: 'Profil', icon: Building2 },
    { id: 'settings', label: 'Pengaturan', shortLabel: 'Config', icon: Settings },
  ];

  const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  
  const dayName = DAYS[currentTime.getDay()];
  const day = currentTime.getDate();
  const monthName = MONTHS[currentTime.getMonth()];
  const year = currentTime.getFullYear();
  const dateStr = `${dayName}, ${day} ${monthName} ${year}`;
  
  const hours = String(currentTime.getHours()).padStart(2, '0');
  const minutes = String(currentTime.getMinutes()).padStart(2, '0');

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans selection:bg-indigo-500/30 overflow-hidden flex">
      {/* Floating Sidebar (Desktop) */}
      <aside className="fixed left-6 top-6 bottom-6 w-64 bg-neutral-900/60 backdrop-blur-2xl border border-neutral-800/60 rounded-[2rem] shadow-2xl hidden md:flex flex-col z-30">
        <div className="h-24 flex items-center px-8 border-b border-neutral-800/50">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white font-bold mr-4 shrink-0 shadow-lg shadow-indigo-500/20">PF</div>
          <h1 className="text-xl font-bold text-white tracking-tight">ProfitFlow</h1>
        </div>
        <nav className="flex-1 px-5 py-8 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full group flex items-center px-4 py-3.5 text-sm font-medium rounded-2xl transition-all duration-300 relative ${
                  isActive 
                    ? 'text-white' 
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/30'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="desktop-active-nav"
                    className="absolute inset-0 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <Icon className={`mr-4 h-5 w-5 relative z-10 transition-colors ${isActive ? 'text-indigo-400' : 'text-neutral-500 group-hover:text-neutral-400'}`} />
                <span className="relative z-10">{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="p-6 border-t border-neutral-800/50 mt-auto">
          <div className="bg-neutral-950/50 rounded-2xl p-4 border border-neutral-800/50 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-neutral-400">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-medium">{dateStr}</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              <Clock className="w-4 h-4 text-sky-400" />
              <span className="text-xl font-mono font-bold tracking-tight">{hours}:{minutes}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-screen overflow-y-auto md:pl-[19rem] relative w-full">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between px-6 py-5 bg-neutral-950/80 backdrop-blur-xl sticky top-0 z-20 border-b border-neutral-900">
           <div className="flex items-center gap-3">
             <div className="w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center text-white font-bold shrink-0 shadow-lg shadow-indigo-500/20">PF</div>
             <h1 className="text-lg font-bold text-white tracking-tight">ProfitFlow</h1>
           </div>
           <div className="flex flex-col items-end">
             <span className="text-xs font-medium text-neutral-400">{dateStr}</span>
             <span className="text-sm font-bold text-white font-mono">{hours}:{minutes}</span>
           </div>
        </header>

        {/* Content Container */}
        <div className="p-4 md:p-10 pb-32 md:pb-10 min-h-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="max-w-6xl mx-auto"
            >
              <div className="hidden md:block mb-8">
                 <h2 className="text-3xl font-bold text-white capitalize tracking-tight">{activeTab.replace('-', ' ')}</h2>
                 <p className="text-neutral-400 mt-1">Overview finansial Anda hari ini.</p>
              </div>
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Mobile Floating Bottom Nav */}
        <div className="md:hidden fixed bottom-6 left-4 right-4 bg-neutral-900/80 backdrop-blur-2xl border border-neutral-800/80 shadow-[0_20px_40px_rgb(0,0,0,0.5)] rounded-[2rem] z-50 p-2 flex justify-between items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="relative flex flex-col items-center justify-center w-full h-16 rounded-2xl outline-none"
              >
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-pill"
                    className="absolute inset-0 bg-indigo-500/15 border border-indigo-500/20 rounded-2xl"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon className={`relative z-10 h-[22px] w-[22px] mb-1.5 transition-colors duration-300 ${isActive ? 'text-indigo-400' : 'text-neutral-500'}`} />
                <span className={`relative z-10 text-[10px] font-semibold transition-colors duration-300 ${isActive ? 'text-indigo-300' : 'text-neutral-500'}`}>
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


