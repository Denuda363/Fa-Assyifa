import React, { useState, useRef } from 'react';
import { Transaction, CompanyProfile, DEFAULT_PROFILE, formatRupiah } from '../types';
import { Download, Upload, AlertTriangle, Plus, X, Tag, Edit2, Check, BookOpen, Wallet, Trash2, RotateCcw } from 'lucide-react';
import { db } from '../firebase';
import { collection, writeBatch, doc } from 'firebase/firestore';
import UserGuide from './UserGuide';
import { MONTH_NAMES_ID } from '../utils/exportUtils';

interface AppSettingsProps {
  transactions: Transaction[];
  profile: CompanyProfile;
  onUpdateProfile: (data: Partial<CompanyProfile>) => Promise<void>;
  onRestore: () => Promise<void>;
}

export default function AppSettings({ transactions, profile, onUpdateProfile, onRestore }: AppSettingsProps) {
  const [activeTab, setActiveTab] = useState<'guide' | 'categories' | 'balances' | 'backup'>('guide');
  const [isRestoring, setIsRestoring] = useState(false);
  const [message, setMessage] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editCategoryValue, setEditCategoryValue] = useState('');
  
  const [newIncomeCategory, setNewIncomeCategory] = useState('');
  const [editingIncomeCategory, setEditingIncomeCategory] = useState<string | null>(null);
  const [editIncomeCategoryValue, setEditIncomeCategoryValue] = useState('');

  const [newTfCategory, setNewTfCategory] = useState('');
  const [editingTfCategory, setEditingTfCategory] = useState<string | null>(null);
  const [editTfCategoryValue, setEditTfCategoryValue] = useState('');

  // Saldo Bulan Kemarin State
  const [balanceMonth, setBalanceMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [balanceAmount, setBalanceAmount] = useState<string>('');
  const [balanceMessage, setBalanceMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const customCategories = profile.customOutcomeCategories || DEFAULT_PROFILE.customOutcomeCategories || [];
  const customIncomeCategories = profile.customIncomeCategories || DEFAULT_PROFILE.customIncomeCategories || [];
  const customOutcomeTfCategories = profile.customOutcomeTfCategories || DEFAULT_PROFILE.customOutcomeTfCategories || [];
  const previousMonthBalances = profile.previousMonthBalances || {};

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    if (customCategories.includes(newCategory.trim())) return;

    const updatedCategories = [...customCategories, newCategory.trim()];
    await onUpdateProfile({ customOutcomeCategories: updatedCategories });
    setNewCategory('');
  };

  const handleRemoveCategory = async (catToRemove: string) => {
    const updatedCategories = customCategories.filter(c => c !== catToRemove);
    await onUpdateProfile({ customOutcomeCategories: updatedCategories });
  };

  const handleSaveEditCategory = async (oldCat: string) => {
    if (!editCategoryValue.trim() || editCategoryValue.trim() === oldCat) {
      setEditingCategory(null);
      return;
    }
    
    if (customCategories.includes(editCategoryValue.trim())) {
      setEditingCategory(null);
      return;
    }

    const updatedCategories = customCategories.map(c => 
      c === oldCat ? editCategoryValue.trim() : c
    );
    await onUpdateProfile({ customOutcomeCategories: updatedCategories });
    setEditingCategory(null);
  };

  const handleAddIncomeCategory = async () => {
    if (!newIncomeCategory.trim()) return;
    if (customIncomeCategories.includes(newIncomeCategory.trim())) return;

    const updatedCategories = [...customIncomeCategories, newIncomeCategory.trim()];
    await onUpdateProfile({ customIncomeCategories: updatedCategories });
    setNewIncomeCategory('');
  };

  const handleRemoveIncomeCategory = async (catToRemove: string) => {
    const updatedCategories = customIncomeCategories.filter(c => c !== catToRemove);
    await onUpdateProfile({ customIncomeCategories: updatedCategories });
  };

  const handleSaveEditIncomeCategory = async (oldCat: string) => {
    if (!editIncomeCategoryValue.trim() || editIncomeCategoryValue.trim() === oldCat) {
      setEditingIncomeCategory(null);
      return;
    }
    
    if (customIncomeCategories.includes(editIncomeCategoryValue.trim())) {
      setEditingIncomeCategory(null);
      return;
    }

    const updatedCategories = customIncomeCategories.map(c => 
      c === oldCat ? editIncomeCategoryValue.trim() : c
    );
    await onUpdateProfile({ customIncomeCategories: updatedCategories });
    setEditingIncomeCategory(null);
  };

  const handleAddTfCategory = async () => {
    if (!newTfCategory.trim()) return;
    if (customOutcomeTfCategories.includes(newTfCategory.trim())) return;

    const updatedCategories = [...customOutcomeTfCategories, newTfCategory.trim()];
    await onUpdateProfile({ customOutcomeTfCategories: updatedCategories });
    setNewTfCategory('');
  };

  const handleRemoveTfCategory = async (catToRemove: string) => {
    const updatedCategories = customOutcomeTfCategories.filter(c => c !== catToRemove);
    await onUpdateProfile({ customOutcomeTfCategories: updatedCategories });
  };

  const handleSaveEditTfCategory = async (oldCat: string) => {
    if (!editTfCategoryValue.trim() || editTfCategoryValue.trim() === oldCat) {
      setEditingTfCategory(null);
      return;
    }
    
    if (customOutcomeTfCategories.includes(editTfCategoryValue.trim())) {
      setEditingTfCategory(null);
      return;
    }

    const updatedCategories = customOutcomeTfCategories.map(c => 
      c === oldCat ? editTfCategoryValue.trim() : c
    );
    await onUpdateProfile({ customOutcomeTfCategories: updatedCategories });
    setEditingTfCategory(null);
  };

  // Saldo Bulan Kemarin Handlers
  const handleSaveManualBalance = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!balanceMonth) return;
    const num = parseFloat(balanceAmount.replace(/[^0-9.-]+/g, '')) || 0;
    const updated = {
      ...previousMonthBalances,
      [balanceMonth]: num
    };
    await onUpdateProfile({ previousMonthBalances: updated });
    setBalanceMessage(`Saldo bulan kemarin untuk periode ${formatMonthStr(balanceMonth)} berhasil disimpan: ${formatRupiah(num)}`);
    setTimeout(() => setBalanceMessage(''), 4000);
  };

  const handleDeleteManualBalance = async (mKey: string) => {
    const updated = { ...previousMonthBalances };
    delete updated[mKey];
    await onUpdateProfile({ previousMonthBalances: updated });
    setBalanceMessage(`Pengaturan saldo manual untuk ${formatMonthStr(mKey)} telah dihapus.`);
    setTimeout(() => setBalanceMessage(''), 4000);
  };

  const formatMonthStr = (mStr: string) => {
    const parts = mStr.split('-');
    if (parts.length < 2) return mStr;
    const y = parts[0];
    const mIdx = parseInt(parts[1], 10) - 1;
    return `${MONTH_NAMES_ID[mIdx] || parts[1]} ${y}`;
  };

  const handleBackup = () => {
    const dataStr = JSON.stringify(transactions, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_profitflow_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleRestoreClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setIsRestoring(true);
        setMessage('');
        const data = JSON.parse(event.target?.result as string) as Transaction[];
        
        if (!Array.isArray(data)) {
          throw new Error("Format file tidak valid.");
        }

        const batch = writeBatch(db);
        let count = 0;
        
        data.forEach((tx) => {
          const newDocRef = doc(collection(db, 'transactions'));
          const txData = { ...tx };
          delete txData.id;
          batch.set(newDocRef, txData);
          count++;
        });

        await batch.commit();
        setMessage(`Berhasil memulihkan ${count} data transaksi.`);
      } catch (error) {
        console.error(error);
        setMessage('Gagal memulihkan data. Pastikan format file benar.');
      } finally {
        setIsRestoring(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const totalCustomCats = customCategories.length + customOutcomeTfCategories.length + customIncomeCategories.length;
  const totalManualBalances = Object.keys(previousMonthBalances).length;

  return (
    <div className="space-y-6">
      {/* Top Setting Navigation Tabs */}
      <div className="bg-neutral-900/60 backdrop-blur-2xl border border-neutral-800/80 rounded-2xl sm:rounded-3xl p-2 sm:p-2.5 shadow-xl flex items-center justify-between gap-1 overflow-x-auto scrollbar-none no-print">
        <button
          onClick={() => setActiveTab('guide')}
          className={`flex items-center justify-center gap-2 px-3 sm:px-5 py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex-1 ${
            activeTab === 'guide'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
          }`}
        >
          <BookOpen className="w-4 h-4 text-indigo-300" />
          <span>Panduan</span>
          <span className="hidden sm:inline-block px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/25 text-indigo-200 border border-indigo-500/30">
            9 Bab
          </span>
        </button>

        <button
          onClick={() => setActiveTab('balances')}
          className={`flex items-center justify-center gap-2 px-3 sm:px-5 py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex-1 ${
            activeTab === 'balances'
              ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
          }`}
        >
          <Wallet className="w-4 h-4 text-sky-400" />
          <span>Saldo Kemarin</span>
          {totalManualBalances > 0 && (
            <span className="hidden sm:inline-block px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-neutral-800 text-sky-300 border border-neutral-700">
              {totalManualBalances}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center justify-center gap-2 px-3 sm:px-5 py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex-1 ${
            activeTab === 'categories'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
          }`}
        >
          <Tag className="w-4 h-4 text-emerald-400" />
          <span>Kategori Kas</span>
          <span className="hidden sm:inline-block px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-neutral-800 text-neutral-300 border border-neutral-700">
            {totalCustomCats}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`flex items-center justify-center gap-2 px-3 sm:px-5 py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex-1 ${
            activeTab === 'backup'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
          }`}
        >
          <Download className="w-4 h-4 text-amber-400" />
          <span>Backup</span>
        </button>
      </div>

      {/* Tab: Panduan Penggunaan Lengkap */}
      {activeTab === 'guide' && (
        <UserGuide />
      )}

      {/* Tab: Saldo Bulan Kemarin (Manual Input) */}
      {activeTab === 'balances' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-neutral-900/40 backdrop-blur-2xl border border-sky-500/20 shadow-2xl px-4 py-8 sm:rounded-[2rem] sm:p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
            
            <div className="relative z-10 space-y-6">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-sky-500/10 border border-sky-500/20 rounded-xl text-sky-400">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold leading-6 text-white tracking-tight">
                      Input Saldo Bulan Kemarin (Saldo Awal)
                    </h3>
                    <p className="mt-1 text-sm text-neutral-400 leading-relaxed">
                      Atur total saldo kas/bank sisa akhir bulan lalu secara manual untuk setiap bulan. Saldo ini akan masuk ke kartu Total Saldo Kas Berjalan di Dashboard dan tercantum pada baris ke-4 Closing Monthly Excel serta PDF.
                    </p>
                  </div>
                </div>
              </div>

              {balanceMessage && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-medium">
                  {balanceMessage}
                </div>
              )}

              <form onSubmit={handleSaveManualBalance} className="bg-neutral-950/60 border border-neutral-800/80 rounded-2xl p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                      Pilih Bulan Periode
                    </label>
                    <input
                      type="month"
                      value={balanceMonth}
                      onChange={(e) => {
                        setBalanceMonth(e.target.value);
                        if (previousMonthBalances[e.target.value] !== undefined) {
                          setBalanceAmount(String(previousMonthBalances[e.target.value]));
                        } else {
                          setBalanceAmount('');
                        }
                      }}
                      className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-sm focus:border-sky-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                      Nominal Saldo Kemarin (Rp)
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-bold text-neutral-400">
                        Rp
                      </span>
                      <input
                        type="number"
                        value={balanceAmount}
                        onChange={(e) => setBalanceAmount(e.target.value)}
                        placeholder="Contoh: 15000000"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-sm font-bold focus:border-sky-500 outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>

                {balanceAmount && (
                  <p className="text-xs text-neutral-400 font-mono">
                    Nominal: <strong className="text-sky-300">{formatRupiah(parseFloat(balanceAmount) || 0)}</strong>
                  </p>
                )}

                {/* Quick Presets */}
                <div>
                  <span className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                    Tambah Cepat
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[1000000, 5000000, 10000000, 25000000, 50000000].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          const cur = parseFloat(balanceAmount.replace(/[^0-9.-]+/g, '')) || 0;
                          setBalanceAmount(String(cur + amt));
                        }}
                        className="px-2.5 py-1 bg-neutral-900 border border-neutral-800 hover:border-sky-500/50 hover:bg-neutral-800 text-neutral-300 rounded-lg text-xs font-medium cursor-pointer"
                      >
                        +{amt >= 1000000 ? `${amt / 1000000}jt` : `${amt / 1000}rb`}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setBalanceAmount('')}
                      className="px-2.5 py-1 bg-neutral-900 border border-neutral-800 hover:border-rose-500/50 text-rose-400 rounded-lg text-xs font-medium cursor-pointer"
                    >
                      Reset (0)
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-sky-600/20 transition-all cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Simpan Saldo Bulan Kemarin</span>
                  </button>
                </div>
              </form>

              {/* Table of Configured Manual Balances */}
              <div className="space-y-3 pt-2">
                <h4 className="text-sm font-bold text-white tracking-tight">
                  Daftar Saldo Bulan Kemarin yang Tersimpan
                </h4>

                {Object.keys(previousMonthBalances).length === 0 ? (
                  <div className="p-4 rounded-xl bg-neutral-950/40 border border-neutral-800 text-xs text-neutral-500 italic text-center">
                    Belum ada saldo manual yang diatur. Sistem akan menghitung otomatis dari mutasi transaksi bulan sebelumnya jika tersedia.
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-800/60 rounded-xl border border-neutral-800 overflow-hidden bg-neutral-950/40">
                    {Object.entries(previousMonthBalances)
                      .sort((a, b) => b[0].localeCompare(a[0]))
                      .map(([mKey, amount]) => (
                        <div key={mKey} className="p-3.5 flex items-center justify-between gap-4 text-xs sm:text-sm">
                          <div>
                            <span className="font-bold text-white">{formatMonthStr(mKey)}</span>
                            <span className="text-neutral-500 ml-2 font-mono text-xs">({mKey})</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-sky-300">
                              {formatRupiah(amount)}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setBalanceMonth(mKey);
                                setBalanceAmount(String(amount));
                              }}
                              className="p-1 text-neutral-400 hover:text-sky-300 transition-colors"
                              title="Edit Saldo"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteManualBalance(mKey)}
                              className="p-1 text-neutral-400 hover:text-rose-400 transition-colors"
                              title="Hapus Saldo Manual"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Kategori Kas */}
      {activeTab === 'categories' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-neutral-900/40 backdrop-blur-2xl border border-neutral-800/60 shadow-2xl px-4 py-8 sm:rounded-[2rem] sm:p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
            <div className="md:grid md:grid-cols-3 md:gap-8 relative z-10">
              <div className="md:col-span-1">
                <h3 className="text-xl font-bold leading-6 text-white tracking-tight">Kategori Pengeluaran (Tunai)</h3>
                <p className="mt-2 text-sm text-neutral-400 leading-relaxed">
                  Kelola rincian pengeluaran tambahan (seperti air, sampah, keamanan, dll) untuk metode tunai.
                </p>
              </div>
              <div className="mt-5 md:mt-0 md:col-span-2 space-y-6">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Tag className="h-5 w-5 text-neutral-500" />
                    </div>
                    <input
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCategory();
                        }
                      }}
                      className="block w-full pl-10 bg-neutral-900/50 border border-neutral-800 rounded-xl text-white py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder-neutral-500"
                      placeholder="Kategori tunai baru..."
                    />
                  </div>
                  <button
                    onClick={handleAddCategory}
                    disabled={!newCategory.trim()}
                    className="inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-bold rounded-xl shadow-lg shadow-indigo-500/20 text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {customCategories.map((cat, idx) => (
                    <div key={idx} className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-neutral-800/80 border border-neutral-700 text-neutral-200">
                      {editingCategory === cat ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editCategoryValue}
                            onChange={(e) => setEditCategoryValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEditCategory(cat);
                              if (e.key === 'Escape') setEditingCategory(null);
                            }}
                            className="bg-neutral-900 border border-indigo-500/50 rounded-md px-2 py-0.5 text-white text-sm outline-none w-24 focus:ring-1 focus:ring-indigo-500"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveEditCategory(cat)}
                            className="p-1 rounded text-emerald-400 hover:bg-emerald-400/10 transition-colors"
                            title="Simpan"
                          >
                            <Check className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => setEditingCategory(null)}
                            className="p-1 rounded text-neutral-400 hover:bg-neutral-700 transition-colors"
                            title="Batal"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <span>{cat}</span>
                          <div className="flex items-center ml-2 border-l border-neutral-700 pl-1">
                            <button
                              onClick={() => {
                                setEditingCategory(cat);
                                setEditCategoryValue(cat);
                              }}
                              className="inline-flex items-center p-0.5 mx-0.5 rounded text-neutral-400 hover:text-indigo-400 hover:bg-indigo-400/10 transition-colors focus:outline-none"
                              title="Edit"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleRemoveCategory(cat)}
                              className="inline-flex items-center p-0.5 mx-0.5 rounded text-neutral-400 hover:text-rose-400 hover:bg-rose-400/10 transition-colors focus:outline-none"
                              title="Hapus"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                  {customCategories.length === 0 && (
                    <span className="text-sm text-neutral-500 italic">Belum ada kategori tunai kustom.</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-neutral-900/40 backdrop-blur-2xl border border-neutral-800/60 shadow-2xl px-4 py-8 sm:rounded-[2rem] sm:p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
            <div className="md:grid md:grid-cols-3 md:gap-8 relative z-10">
              <div className="md:col-span-1">
                <h3 className="text-xl font-bold leading-6 text-white tracking-tight">Kategori Pengeluaran (Transfer)</h3>
                <p className="mt-2 text-sm text-neutral-400 leading-relaxed">
                  Kelola rincian pengeluaran tambahan khusus untuk metode transfer.
                </p>
              </div>
              <div className="mt-5 md:mt-0 md:col-span-2 space-y-6">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Tag className="h-5 w-5 text-neutral-500" />
                    </div>
                    <input
                      type="text"
                      value={newTfCategory}
                      onChange={(e) => setNewTfCategory(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTfCategory();
                        }
                      }}
                      className="block w-full pl-10 bg-neutral-900/50 border border-neutral-800 rounded-xl text-white py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder-neutral-500"
                      placeholder="Kategori transfer baru..."
                    />
                  </div>
                  <button
                    onClick={handleAddTfCategory}
                    disabled={!newTfCategory.trim()}
                    className="inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-bold rounded-xl shadow-lg shadow-indigo-500/20 text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {customOutcomeTfCategories.map((cat, idx) => (
                    <div key={idx} className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-neutral-800/80 border border-neutral-700 text-neutral-200">
                      {editingTfCategory === cat ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editTfCategoryValue}
                            onChange={(e) => setEditTfCategoryValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEditTfCategory(cat);
                              if (e.key === 'Escape') setEditingTfCategory(null);
                            }}
                            className="bg-neutral-900 border border-indigo-500/50 rounded-md px-2 py-0.5 text-white text-sm outline-none w-24 focus:ring-1 focus:ring-indigo-500"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveEditTfCategory(cat)}
                            className="p-1 rounded text-emerald-400 hover:bg-emerald-400/10 transition-colors"
                            title="Simpan"
                          >
                            <Check className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => setEditingTfCategory(null)}
                            className="p-1 rounded text-neutral-400 hover:bg-neutral-700 transition-colors"
                            title="Batal"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <span>{cat}</span>
                          <div className="flex items-center ml-2 border-l border-neutral-700 pl-1">
                            <button
                              onClick={() => {
                                setEditingTfCategory(cat);
                                setEditTfCategoryValue(cat);
                              }}
                              className="inline-flex items-center p-0.5 mx-0.5 rounded text-neutral-400 hover:text-indigo-400 hover:bg-indigo-400/10 transition-colors focus:outline-none"
                              title="Edit"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleRemoveTfCategory(cat)}
                              className="inline-flex items-center p-0.5 mx-0.5 rounded text-neutral-400 hover:text-rose-400 hover:bg-rose-400/10 transition-colors focus:outline-none"
                              title="Hapus"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                  {customOutcomeTfCategories.length === 0 && (
                    <span className="text-sm text-neutral-500 italic">Belum ada kategori transfer kustom.</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-neutral-900/40 backdrop-blur-2xl border border-neutral-800/60 shadow-2xl px-4 py-8 sm:rounded-[2rem] sm:p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
            <div className="md:grid md:grid-cols-3 md:gap-8 relative z-10">
              <div className="md:col-span-1">
                <h3 className="text-xl font-bold leading-6 text-white tracking-tight">Kategori Pemasukan</h3>
                <p className="mt-2 text-sm text-neutral-400 leading-relaxed">
                  Kelola kategori pemasukan tambahan sesuai kebutuhan (misalnya: Penjualan, QRIS, dll).
                </p>
              </div>
              <div className="mt-5 md:mt-0 md:col-span-2 space-y-6">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Tag className="h-5 w-5 text-neutral-500" />
                    </div>
                    <input
                      type="text"
                      value={newIncomeCategory}
                      onChange={(e) => setNewIncomeCategory(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddIncomeCategory();
                        }
                      }}
                      className="block w-full pl-10 bg-neutral-900/50 border border-neutral-800 rounded-xl text-white py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder-neutral-500"
                      placeholder="Kategori baru..."
                    />
                  </div>
                  <button
                    onClick={handleAddIncomeCategory}
                    disabled={!newIncomeCategory.trim()}
                    className="inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-bold rounded-xl shadow-lg shadow-indigo-500/20 text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {customIncomeCategories.map((cat, idx) => (
                    <div key={idx} className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-neutral-800/80 border border-neutral-700 text-neutral-200">
                      {editingIncomeCategory === cat ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editIncomeCategoryValue}
                            onChange={(e) => setEditIncomeCategoryValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEditIncomeCategory(cat);
                              if (e.key === 'Escape') setEditingIncomeCategory(null);
                            }}
                            className="bg-neutral-900 border border-indigo-500/50 rounded-md px-2 py-0.5 text-white text-sm outline-none w-24 focus:ring-1 focus:ring-indigo-500"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveEditIncomeCategory(cat)}
                            className="p-1 rounded text-emerald-400 hover:bg-emerald-400/10 transition-colors"
                            title="Simpan"
                          >
                            <Check className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => setEditingIncomeCategory(null)}
                            className="p-1 rounded text-neutral-400 hover:bg-neutral-700 transition-colors"
                            title="Batal"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <span>{cat}</span>
                          <div className="flex items-center ml-2 border-l border-neutral-700 pl-1">
                            <button
                              onClick={() => {
                                setEditingIncomeCategory(cat);
                                setEditIncomeCategoryValue(cat);
                              }}
                              className="inline-flex items-center p-0.5 mx-0.5 rounded text-neutral-400 hover:text-indigo-400 hover:bg-indigo-400/10 transition-colors focus:outline-none"
                              title="Edit"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleRemoveIncomeCategory(cat)}
                              className="inline-flex items-center p-0.5 mx-0.5 rounded text-neutral-400 hover:text-rose-400 hover:bg-rose-400/10 transition-colors focus:outline-none"
                              title="Hapus"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                  {customIncomeCategories.length === 0 && (
                    <span className="text-sm text-neutral-500 italic">Belum ada kategori kustom.</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Backup & Restore */}
      {activeTab === 'backup' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-neutral-900/40 backdrop-blur-2xl border border-neutral-800/60 shadow-2xl px-4 py-8 sm:rounded-[2rem] sm:p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
            <div className="md:grid md:grid-cols-3 md:gap-8 relative z-10">
              <div className="md:col-span-1">
                <h3 className="text-xl font-bold leading-6 text-white tracking-tight">Backup & Restore</h3>
                <p className="mt-2 text-sm text-neutral-400 leading-relaxed">
                  Amankan data transaksi Anda dengan mengunduh file cadangan JSON. Anda juga dapat memulihkan data dari file cadangan.
                </p>
              </div>
              <div className="mt-5 md:mt-0 md:col-span-2 space-y-6">
                
                <div className="bg-amber-500/10 border-l-4 border-amber-500 p-5 rounded-r-xl">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertTriangle className="h-5 w-5 text-amber-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-amber-400/90 leading-relaxed">
                        Hati-hati saat melakukan restore data, karena akan menambahkan transaksi dari file cadangan ke database cloud Anda.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <button
                    onClick={handleBackup}
                    className="inline-flex justify-center items-center py-3 px-6 border border-transparent shadow-lg shadow-indigo-500/20 text-sm font-bold rounded-2xl text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-neutral-900 transition-all cursor-pointer"
                  >
                    <Download className="mr-2 h-4 w-4" /> Backup Data
                  </button>
                  
                  <button
                    onClick={handleRestoreClick}
                    disabled={isRestoring}
                    className="inline-flex justify-center items-center py-3 px-6 border border-neutral-800/60 shadow-sm text-sm font-semibold rounded-2xl text-neutral-300 bg-neutral-900/60 hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all hover:border-indigo-500/30 cursor-pointer"
                  >
                    <Upload className="mr-2 h-4 w-4" /> {isRestoring ? 'Memulihkan...' : 'Restore Data'}
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".json"
                    className="hidden"
                  />
                </div>

                {message && (
                  <p className={`text-sm font-medium mt-4 p-3 rounded-xl ${message.includes('Gagal') ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                    {message}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
