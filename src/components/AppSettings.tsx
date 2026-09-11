import React, { useState, useRef } from 'react';
import { Transaction, CompanyProfile, DEFAULT_PROFILE } from '../types';
import { Download, Upload, AlertTriangle, Plus, X, Tag, Edit2, Check } from 'lucide-react';
import { db } from '../firebase';
import { collection, writeBatch, doc } from 'firebase/firestore';

interface AppSettingsProps {
  transactions: Transaction[];
  profile: CompanyProfile;
  onUpdateProfile: (data: Partial<CompanyProfile>) => Promise<void>;
  onRestore: () => Promise<void>;
}

export default function AppSettings({ transactions, profile, onUpdateProfile, onRestore }: AppSettingsProps) {
  const [isRestoring, setIsRestoring] = useState(false);
  const [message, setMessage] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editCategoryValue, setEditCategoryValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const customCategories = profile.customOutcomeCategories || DEFAULT_PROFILE.customOutcomeCategories || [];

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
    
    // Check if new name already exists
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

        // We can either append or replace. The prompt just says "Backup dan restore data".
        // Restoring usually means adding back missing records. For simplicity, we write batch.
        // Actually, to replace, we'd delete all first. But let's just append for safety.
        
        const batch = writeBatch(db);
        let count = 0;
        
        data.forEach((tx) => {
          // generate a new id or use existing
          const newDocRef = doc(collection(db, 'transactions'));
          const txData = { ...tx };
          delete txData.id; // remove id to prevent collision, firestore will generate new one
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

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-neutral-900/40 backdrop-blur-2xl border border-neutral-800/60 shadow-2xl px-4 py-8 sm:rounded-[2rem] sm:p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
        <div className="md:grid md:grid-cols-3 md:gap-8 relative z-10">
          <div className="md:col-span-1">
            <h3 className="text-xl font-bold leading-6 text-white tracking-tight">Backup & Restore</h3>
            <p className="mt-2 text-sm text-neutral-400 leading-relaxed">
              Amankan data transaksi Anda dengan mengunduh file cadangan. Anda juga dapat memulihkan data dari file cadangan.
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
                    Hati-hati saat melakukan restore data, karena akan menambahkan transaksi dari file ke database Anda.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <button
                onClick={handleBackup}
                className="inline-flex justify-center items-center py-3 px-6 border border-transparent shadow-lg shadow-indigo-500/20 text-sm font-bold rounded-2xl text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-neutral-900 transition-all"
              >
                <Download className="mr-2 h-4 w-4" /> Backup Data
              </button>
              
              <button
                onClick={handleRestoreClick}
                disabled={isRestoring}
                className="inline-flex justify-center items-center py-3 px-6 border border-neutral-800/60 shadow-sm text-sm font-semibold rounded-2xl text-neutral-300 bg-neutral-900/60 hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all hover:border-indigo-500/30"
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

      <div className="bg-neutral-900/40 backdrop-blur-2xl border border-neutral-800/60 shadow-2xl px-4 py-8 sm:rounded-[2rem] sm:p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
        <div className="md:grid md:grid-cols-3 md:gap-8 relative z-10">
          <div className="md:col-span-1">
            <h3 className="text-xl font-bold leading-6 text-white tracking-tight">Kategori Pengeluaran</h3>
            <p className="mt-2 text-sm text-neutral-400 leading-relaxed">
              Kelola rincian pengeluaran tambahan (seperti air, sampah, keamanan, dll) sesuai kebutuhan Anda.
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
                  placeholder="Kategori baru..."
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
                <span className="text-sm text-neutral-500 italic">Belum ada kategori kustom.</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
