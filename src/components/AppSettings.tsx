import React, { useState, useRef } from 'react';
import { Transaction } from '../types';
import { Download, Upload, AlertTriangle } from 'lucide-react';
import { db } from '../firebase';
import { collection, writeBatch, doc } from 'firebase/firestore';

interface AppSettingsProps {
  transactions: Transaction[];
  onRestore: () => Promise<void>;
}

export default function AppSettings({ transactions }: AppSettingsProps) {
  const [isRestoring, setIsRestoring] = useState(false);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      <div className="bg-[#11141b] border border-slate-800 shadow px-4 py-5 sm:rounded-xl sm:p-6">
        <div className="md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-1">
            <h3 className="text-lg font-medium leading-6 text-white">Backup & Restore</h3>
            <p className="mt-1 text-sm text-slate-400">
              Amankan data transaksi Anda dengan mengunduh file cadangan. Anda juga dapat memulihkan data dari file cadangan.
            </p>
          </div>
          <div className="mt-5 md:mt-0 md:col-span-2 space-y-4">
            
            <div className="bg-amber-500/10 border-l-4 border-amber-500 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-amber-400/90">
                    Hati-hati saat melakukan restore data, karena akan menambahkan transaksi dari file ke database Anda.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleBackup}
                className="inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
              >
                <Download className="mr-2 h-4 w-4" /> Backup Data
              </button>
              
              <button
                onClick={handleRestoreClick}
                disabled={isRestoring}
                className="inline-flex justify-center items-center py-2 px-4 border border-slate-700 shadow-sm text-sm font-medium rounded-md text-slate-200 bg-slate-800 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-colors"
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
              <p className={`text-sm font-medium mt-2 ${message.includes('Gagal') ? 'text-rose-500' : 'text-emerald-400'}`}>
                {message}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
