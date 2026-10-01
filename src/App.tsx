/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ReceiptText, 
  Building2, 
  Settings, 
  Clock, 
  Calendar, 
  HandCoins, 
  Plus, 
  BookOpen, 
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Wifi,
  WifiOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Loans from './components/Loans';
import Profile from './components/Profile';
import AppSettings from './components/AppSettings';
import { useFinanceData } from './hooks/useFinanceData';
import { PWAInstallButton } from './components/PWAInstallButton';
import { getLoanRemaining, formatRupiah } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [openTransactionModalTrigger, setOpenTransactionModalTrigger] = useState(false);

  const { 
    transactions, 
    loans,
    profile, 
    loading, 
    isOnline,
    addTransaction, 
    updateTransaction, 
    deleteTransaction, 
    updateProfile,
    addLoan,
    updateLoan,
    deleteLoan,
    addLoanPayment,
    deleteLoanPayment
  } = useFinanceData();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#090d14] text-white">
        <div className="relative">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center animate-pulse">
            <span className="font-bold text-indigo-400">PF</span>
          </div>
          <div className="absolute inset-0 rounded-2xl border-t-2 border-indigo-500 animate-spin"></div>
        </div>
        <p className="mt-4 text-xs font-semibold text-neutral-400 tracking-wider uppercase">
          Memuat ProfitFlow OS...
        </p>
      </div>
    );
  }

  const activeUnpaidCount = loans.filter(l => getLoanRemaining(l) > 0).length;

  const navGroups = [
    {
      groupTitle: 'IKHTISAR UTAMA',
      items: [
        { id: 'dashboard', label: 'Dashboard', shortLabel: 'Home', icon: LayoutDashboard },
        { id: 'transactions', label: 'Data Transaksi', shortLabel: 'Data', icon: ReceiptText },
        { 
          id: 'loans', 
          label: 'Pinjaman & Pelunasan', 
          shortLabel: 'Pinjaman', 
          icon: HandCoins,
          badge: activeUnpaidCount > 0 ? activeUnpaidCount : undefined 
        },
      ]
    },
    {
      groupTitle: 'MANAJEMEN & SISTEM',
      items: [
        { id: 'profile', label: 'Profil Perusahaan', shortLabel: 'Profil', icon: Building2 },
        { id: 'settings', label: 'Pengaturan & SOP', shortLabel: 'Config', icon: Settings },
      ]
    }
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
  const seconds = String(currentTime.getSeconds()).padStart(2, '0');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            transactions={transactions} 
            profile={profile} 
            loans={loans} 
            onUpdateProfile={updateProfile} 
          />
        );
      case 'transactions':
        return (
          <Transactions 
            transactions={transactions} 
            profile={profile}
            onAdd={async (tx) => { await addTransaction(tx); }} 
            onUpdate={updateTransaction} 
            onDelete={deleteTransaction} 
          />
        );
      case 'loans':
        return (
          <Loans
            loans={loans}
            onAddLoan={addLoan}
            onUpdateLoan={updateLoan}
            onDeleteLoan={deleteLoan}
            onAddPayment={addLoanPayment}
            onDeletePayment={deleteLoanPayment}
          />
        );
      case 'profile':
        return <Profile profile={profile} onUpdate={updateProfile} />;
      case 'settings':
        return (
          <AppSettings 
            transactions={transactions} 
            profile={profile} 
            onUpdateProfile={updateProfile} 
            onRestore={async () => {}} 
          />
        );
      default:
        return (
          <Dashboard 
            transactions={transactions} 
            profile={profile} 
            loans={loans} 
            onUpdateProfile={updateProfile} 
          />
        );
    }
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard Finansial';
      case 'transactions': return 'Riwayat Data Transaksi';
      case 'loans': return 'Manajemen Pinjaman & Pelunasan';
      case 'profile': return 'Profil Perusahaan Apotek';
      case 'settings': return 'Pengaturan Sistem & SOP';
      default: return 'Dashboard';
    }
  };

  const getPageSubtitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Rekapitulasi pendapatan kotor, pengeluaran kas/transfer, laba bersih, dan sisa saldo.';
      case 'transactions': return 'Pencatatan real-time arus kas masuk dan keluar apotek dengan filter dan pencarian komprehensif.';
      case 'loans': return 'Pemantauan pinjaman owner & karyawan, cicilan pelunasan, dan sinkronisasi otomatis ke buku kas.';
      case 'profile': return 'Kelola nama apotek, alamat lengkap, dan nomor kontak resmi untuk kop laporan Excel & PDF.';
      case 'settings': return 'Buku panduan lengkap 9 bab, kelola kategori kas operasional, serta backup dan restore data.';
      default: return 'Overview finansial apotek.';
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-neutral-200 font-sans selection:bg-indigo-500/30 overflow-x-hidden flex flex-col md:flex-row">
      {/* Docked Enterprise Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 h-screen fixed left-0 top-0 bottom-0 bg-[#0a0d14] border-r border-neutral-800/80 z-30 shadow-2xl">
        {/* Brand Header */}
        <div className="p-6 border-b border-neutral-800/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700 flex items-center justify-center text-white font-extrabold shadow-lg shadow-indigo-500/25 border border-indigo-400/30">
              PF
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-bold text-white tracking-tight">ProfitFlow</h1>
                <span className="px-1.5 py-0.2 text-[9px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 font-medium">Financial Operating System</p>
            </div>
          </div>
        </div>

        {/* Entity Card in Sidebar */}
        <div className="px-5 py-4 border-b border-neutral-800/50 bg-[#0d111a]/40">
          <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800/80 flex items-center justify-between gap-2.5">
            <div className="min-w-0 flex-1">
              <span className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Entitas Apotek</span>
              <p className="text-xs font-bold text-neutral-200 truncate mt-0.5">
                {profile.name || 'Apotek Assyifa Farma Cideres'}
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0" title={isOnline ? 'Terhubung ke Cloud Database' : 'Mode Offline'}>
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
              <span className="text-[10px] font-semibold text-neutral-400 font-mono">
                {isOnline ? 'Cloud' : 'Offline'}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Items Grouped */}
        <nav className="flex-1 px-4 py-5 space-y-6 overflow-y-auto scrollbar-none">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1.5">
              <div className="px-3 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                {group.groupTitle}
              </div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full group flex items-center justify-between px-3.5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-200 relative cursor-pointer ${
                        isActive 
                          ? 'bg-indigo-600/15 text-white border border-indigo-500/30 shadow-sm' 
                          : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3 relative z-10">
                        <Icon className={`h-4 w-4 transition-colors ${isActive ? 'text-indigo-400' : 'text-neutral-500 group-hover:text-neutral-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      
                      {item.badge !== undefined && (
                        <span className="relative z-10 bg-rose-500/20 text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-500/30">
                          {item.badge}
                        </span>
                      )}

                      {isActive && (
                        <div className="w-1.5 h-4 bg-indigo-500 rounded-full shrink-0"></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer with Live Digital Clock & PWA */}
        <div className="p-4 border-t border-neutral-800/70 bg-[#090c12] space-y-3 mt-auto">
          <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800/80 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-neutral-400 text-[10px] font-medium">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                <span>{dateStr}</span>
              </div>
              <div className="flex items-center gap-1.5 text-white">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-sm font-mono font-bold tracking-tight">
                  {hours}:{minutes}:<span className="text-neutral-500">{seconds}</span>
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-neutral-500 block">Status</span>
              <span className="text-[10px] font-bold text-emerald-400 font-mono">SINKRON</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-neutral-500 px-1 pt-1">
            <span>ProfitFlow v2.6</span>
            <PWAInstallButton />
          </div>
        </div>
      </aside>

      {/* Main App Container */}
      <main className="flex-1 min-h-screen md:pl-72 relative w-full flex flex-col bg-[#07090e]">
        {/* Offline indicator banner if device network is unavailable */}
        {!isOnline && (
          <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2.5 text-center text-xs text-amber-300 font-medium flex items-center justify-center gap-2 sticky top-0 z-40 backdrop-blur-md">
            <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Mode Offline: Koneksi internet terputus. Data Anda tetap tersimpan di perangkat lokal dan akan disinkronkan saat terhubung kembali.</span>
          </div>
        )}

        {/* Desktop Premium TopBar (Hidden on mobile) */}
        <header className="hidden md:flex items-center justify-between px-8 py-3.5 bg-[#090d14]/85 backdrop-blur-xl border-b border-neutral-800/70 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-medium text-neutral-400">
              <span>ProfitFlow</span>
              <ChevronRight className="w-3.5 h-3.5 text-neutral-600" />
              <span className="text-white font-semibold">{getPageTitle()}</span>
            </div>
            <span className="text-neutral-700">|</span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{profile.name || 'Apotek Assyifa Farma Cideres'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('settings')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-semibold text-neutral-300 transition-all cursor-pointer"
              title="Buka Buku Panduan & SOP Operasional"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span>Panduan SOP</span>
            </button>

            <button
              onClick={() => setActiveTab('transactions')}
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Catat Transaksi</span>
            </button>

            <div className="h-6 w-px bg-neutral-800 mx-1"></div>

            <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono bg-neutral-900/60 px-3 py-1.5 rounded-xl border border-neutral-800/60">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              <span>{hours}:{minutes} WIB</span>
            </div>
          </div>
        </header>

        {/* Mobile Header (Hidden on PC) */}
        <header className="md:hidden flex items-center justify-between px-5 py-4 bg-[#090d14]/90 backdrop-blur-xl sticky top-0 z-20 border-b border-neutral-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-500/20">
              PF
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight">ProfitFlow</h1>
              <p className="text-[10px] text-neutral-400 truncate max-w-[170px]">{profile.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <PWAInstallButton />
          </div>
        </header>

        {/* Main Content Area Container */}
        <div className="flex-1 p-4 md:p-8 lg:p-10 pb-28 md:pb-12 max-w-7xl mx-auto w-full">
          {/* Header Description on PC */}
          <div className="hidden md:block mb-6 pb-4 border-b border-neutral-800/40">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>{getPageTitle()}</span>
                </h2>
                <p className="text-xs text-neutral-400 mt-1 max-w-3xl leading-relaxed">
                  {getPageSubtitle()}
                </p>
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="w-full"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Mobile Floating Bottom Nav (Hidden on PC) */}
        <div className="md:hidden fixed bottom-4 left-3 right-3 bg-[#0c1018]/90 backdrop-blur-2xl border border-neutral-800/90 shadow-[0_20px_40px_rgb(0,0,0,0.6)] rounded-2xl z-30 p-1.5 flex justify-between items-center">
          {navGroups.flatMap(g => g.items).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="relative flex flex-col items-center justify-center w-full h-14 rounded-xl outline-none"
              >
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-pill"
                    className="absolute inset-0 bg-indigo-500/15 border border-indigo-500/25 rounded-xl"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon className={`relative z-10 h-5 w-5 mb-1 transition-colors duration-200 ${isActive ? 'text-indigo-400' : 'text-neutral-500'}`} />
                {item.badge !== undefined && (
                  <span className="absolute top-1 right-1/4 w-3.5 h-3.5 bg-rose-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center shadow-md z-20">
                    {item.badge}
                  </span>
                )}
                <span className={`relative z-10 text-[9px] font-semibold transition-colors duration-200 ${isActive ? 'text-indigo-300' : 'text-neutral-500'}`}>
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
