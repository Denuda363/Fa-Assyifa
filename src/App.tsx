/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { LayoutDashboard, ReceiptText, Building2, Settings } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Profile from './components/Profile';
import AppSettings from './components/AppSettings';
import { useFinanceData } from './hooks/useFinanceData';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { transactions, profile, loading, addTransaction, updateTransaction, deleteTransaction, updateProfile } = useFinanceData();

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
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transaksi', icon: ReceiptText },
    { id: 'profile', label: 'Profil Perusahaan', icon: Building2 },
    { id: 'settings', label: 'Pengaturan', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-[#0a0c10] text-slate-300 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-[#11141b] border-r border-slate-800 flex flex-col hidden md:flex">
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
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="h-16 bg-[#11141b] border-b border-slate-800 flex items-center justify-between px-4 md:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-slate-900 font-bold shrink-0">PF</div>
            <h1 className="text-lg font-bold text-white">ProfitFlow</h1>
          </div>
          <select 
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
            className="block w-40 pl-3 pr-10 py-2 text-base bg-slate-800 border-slate-700 text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md"
          >
            {navItems.map(item => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}

