import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, INCOME_CATEGORIES, OUTCOME_CASH_CATEGORIES, OUTCOME_TF_CATEGORIES, formatRupiah } from '../types';
import { Plus, Edit2, Trash2, X, Filter, Search, ArrowUpRight, ArrowDownRight, Calendar, RotateCcw } from 'lucide-react';
import { format, isWithinInterval, startOfDay, endOfDay, parseISO, subDays, startOfMonth, endOfMonth } from 'date-fns';

interface TransactionsProps {
  transactions: Transaction[];
  onAdd: (data: Omit<Transaction, 'id' | 'timestamp'>) => Promise<void>;
  onUpdate: (id: string, data: Partial<Transaction>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function Transactions({ transactions, onAdd, onUpdate, onDelete }: TransactionsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'outcome' | 'cash' | 'tf'>('all');
  
  const [formData, setFormData] = useState<Omit<Transaction, 'id' | 'timestamp'>>({
    type: 'income',
    method: 'cash',
    category: 'Cash',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // ESC key listener for modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        handleCloseModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  // Date Quick Presets
  const handleSetToday = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    setStartDate(today);
    setEndDate(today);
  };

  const handleSetThisMonth = () => {
    const now = new Date();
    setStartDate(format(startOfMonth(now), 'yyyy-MM-dd'));
    setEndDate(format(endOfMonth(now), 'yyyy-MM-dd'));
  };

  const handleSetLast7Days = () => {
    const now = new Date();
    setStartDate(format(subDays(now, 6), 'yyyy-MM-dd'));
    setEndDate(format(now, 'yyyy-MM-dd'));
  };

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setSearchQuery('');
    setTypeFilter('all');
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // 1. Date filter
      if (startDate || endDate) {
        try {
          const txDate = parseISO(tx.date);
          const start = startDate ? startOfDay(parseISO(startDate)) : null;
          const end = endDate ? endOfDay(parseISO(endDate)) : null;
          
          if (start && end) {
            if (start > end) return false;
            if (!isWithinInterval(txDate, { start, end })) return false;
          } else if (start && txDate < start) {
            return false;
          } else if (end && txDate > end) {
            return false;
          }
        } catch (e) {
          return false;
        }
      }

      // 2. Type & Method filter
      if (typeFilter === 'income' && tx.type !== 'income') return false;
      if (typeFilter === 'outcome' && tx.type !== 'outcome') return false;
      if (typeFilter === 'cash' && tx.method !== 'cash') return false;
      if (typeFilter === 'tf' && tx.method === 'cash') return false;

      // 3. Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const catMatch = tx.category.toLowerCase().includes(query);
        const notesMatch = (tx.notes || '').toLowerCase().includes(query);
        const amountMatch = tx.amount.toString().includes(query);
        if (!catMatch && !notesMatch && !amountMatch) return false;
      }

      return true;
    });
  }, [transactions, startDate, endDate, typeFilter, searchQuery]);

  // Computed summary for filtered transactions
  const filteredStats = useMemo(() => {
    let totalIncome = 0;
    let totalOutcome = 0;
    filteredTransactions.forEach(t => {
      if (t.type === 'income') totalIncome += t.amount;
      else totalOutcome += t.amount;
    });
    return {
      count: filteredTransactions.length,
      totalIncome,
      totalOutcome,
      net: totalIncome - totalOutcome
    };
  }, [filteredTransactions]);

  const handleOpenModal = (tx?: Transaction) => {
    if (tx) {
      setEditingId(tx.id);
      setFormData({
        type: tx.type,
        method: tx.method,
        category: tx.category,
        amount: tx.amount,
        date: tx.date,
        notes: tx.notes || ''
      });
    } else {
      setEditingId(null);
      setFormData({
        type: 'income',
        method: 'cash',
        category: 'Cash',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        notes: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        handleCloseModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await onUpdate(editingId, formData);
    } else {
      await onAdd(formData);
    }
    handleCloseModal();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Yakin ingin menghapus transaksi ini?')) {
      await onDelete(id);
    }
  };

  const availableCategories = formData.type === 'income' 
    ? INCOME_CATEGORIES 
    : (formData.method === 'tf' ? OUTCOME_TF_CATEGORIES.map(c => ({label: c, method: 'tf'})) : OUTCOME_CASH_CATEGORIES.map(c => ({label: c, method: 'cash'})));

  return (
    <div className="space-y-5">
      {/* Top Filter & Action Bar */}
      <div className="bg-[#11141b] border border-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-sm space-y-3 sm:space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
          
          {/* Search bar & Type pills */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
            {/* Search Input */}
            <div className="relative flex-1 min-w-0">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-500" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari transaksi..."
                className="w-full pl-10 pr-9 py-2 bg-[#0a0c10] border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Type Filter Pills (Horizontal Touch Scroll on Mobile) */}
            <div className="flex items-center gap-1.5 bg-[#0a0c10] p-1 rounded-xl border border-slate-800 text-xs overflow-x-auto scrollbar-none shrink-0">
              <button
                onClick={() => setTypeFilter('all')}
                className={`whitespace-nowrap px-3 py-1.5 rounded-lg font-medium transition-all ${
                  typeFilter === 'all'
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setTypeFilter('income')}
                className={`whitespace-nowrap px-3 py-1.5 rounded-lg font-medium transition-all ${
                  typeFilter === 'income'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Masuk
              </button>
              <button
                onClick={() => setTypeFilter('outcome')}
                className={`whitespace-nowrap px-3 py-1.5 rounded-lg font-medium transition-all ${
                  typeFilter === 'outcome'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Keluar
              </button>
              <button
                onClick={() => setTypeFilter('cash')}
                className={`whitespace-nowrap px-3 py-1.5 rounded-lg font-medium transition-all ${
                  typeFilter === 'cash'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Cash
              </button>
              <button
                onClick={() => setTypeFilter('tf')}
                className={`whitespace-nowrap px-3 py-1.5 rounded-lg font-medium transition-all ${
                  typeFilter === 'tf'
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Transfer
              </button>
            </div>
          </div>

          {/* Right Action: Add Transaction Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center justify-center px-4 py-2.5 border border-transparent shadow-sm text-sm font-semibold rounded-xl text-slate-900 bg-emerald-400 hover:bg-emerald-300 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 w-full sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4 stroke-[2.5]" /> Tambah Transaksi
            </button>
          </div>
        </div>

        {/* Date Filter Row with Quick Presets */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2.5 sm:pt-3 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none w-full sm:w-auto pb-1 sm:pb-0">
            <span className="text-slate-400 flex items-center gap-1.5 whitespace-nowrap">
              <Calendar className="h-3.5 w-3.5 text-slate-500" />
              Tanggal:
            </span>
            <div className="flex items-center gap-1.5 bg-[#0a0c10] border border-slate-800 rounded-xl px-2 py-1 shrink-0">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent border-none text-slate-300 text-xs focus:ring-0 cursor-pointer p-0"
                title="Dari Tanggal"
              />
              <span className="text-slate-600">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent border-none text-slate-300 text-xs focus:ring-0 cursor-pointer p-0"
                title="Sampai Tanggal"
              />
            </div>

            {/* Quick Presets */}
            <button
              onClick={handleSetToday}
              className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/50 transition-colors"
            >
              Hari Ini
            </button>
            <button
              onClick={handleSetLast7Days}
              className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/50 transition-colors"
            >
              7 Hari
            </button>
            <button
              onClick={handleSetThisMonth}
              className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/50 transition-colors"
            >
              Bulan Ini
            </button>

            {(startDate || endDate || searchQuery || typeFilter !== 'all') && (
              <button 
                onClick={handleResetFilters}
                className="whitespace-nowrap inline-flex items-center gap-1 text-slate-400 hover:text-rose-400 px-2 py-1 transition-colors"
                title="Reset Semua Filter"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Quick Summary Pill */}
          <div className="flex items-center justify-between sm:justify-end gap-2.5 text-xs bg-[#0a0c10] px-3 py-1.5 rounded-xl border border-slate-800 w-full sm:w-auto">
            <span className="text-slate-400 font-medium">
              <span className="text-white font-bold">{filteredStats.count}</span> Data
            </span>
            <span className="text-slate-700">|</span>
            <span className="text-emerald-400 font-mono font-medium">
              +{formatRupiah(filteredStats.totalIncome)}
            </span>
            <span className="text-slate-700">|</span>
            <span className="text-rose-400 font-mono font-medium">
              -{formatRupiah(filteredStats.totalOutcome)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-[#11141b] border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {/* Mobile View: Modern Minimalist Cards */}
        <div className="block md:hidden p-3 sm:p-4">
          {filteredTransactions.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/50 flex items-center justify-center mx-auto mb-3 text-slate-500">
                <Filter className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-slate-300">Tidak ada transaksi ditemukan</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Coba sesuaikan kata kunci pencarian atau rentang tanggal filter Anda.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredTransactions.map((tx) => (
                <div 
                  key={tx.id} 
                  className="bg-[#0c0f16] border border-slate-800/90 rounded-2xl p-3.5 shadow-sm space-y-2.5 transition-all active:scale-[0.99]"
                >
                  {/* Card Header: Icon + Category + Amount */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        tx.type === 'income' 
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' 
                          : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                      }`}>
                        {tx.type === 'income' ? (
                          <ArrowUpRight className="h-4 w-4 stroke-[2.5]" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 stroke-[2.5]" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-white tracking-tight truncate leading-snug">
                          {tx.category}
                        </h4>
                        <p className="text-[11px] text-slate-400 font-medium">
                          {format(new Date(tx.date), 'dd MMMM yyyy')}
                        </p>
                      </div>
                    </div>

                    <div className={`text-right font-mono font-bold text-sm sm:text-base shrink-0 ${
                      tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {tx.type === 'income' ? '+' : '-'}{formatRupiah(tx.amount)}
                    </div>
                  </div>

                  {/* Notes Tag (if any) */}
                  {tx.notes && (
                    <div className="text-xs text-slate-300 bg-[#121620]/90 px-3 py-1.5 rounded-xl border border-slate-800/60 leading-relaxed flex items-start gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-500 shrink-0 mt-0.5">Ket:</span>
                      <span className="break-words line-clamp-2">{tx.notes}</span>
                    </div>
                  )}

                  {/* Card Footer: Metadata badges + Action buttons */}
                  <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/60 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                        tx.type === 'income' 
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25' 
                          : 'bg-rose-500/10 text-rose-300 border-rose-500/25'
                      }`}>
                        {tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold border uppercase ${
                        tx.method === 'cash'
                          ? 'bg-amber-500/10 text-amber-300 border-amber-500/25'
                          : 'bg-sky-500/10 text-sky-300 border-sky-500/25'
                      }`}>
                        {tx.method.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleOpenModal(tx)} 
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors" 
                        title="Edit Transaksi"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(tx.id)} 
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors" 
                        title="Hapus Transaksi"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Desktop View (Enhanced Table) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800">
            <thead className="bg-[#0a0c10]/70">
              <tr>
                <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Tanggal</th>
                <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Kategori</th>
                <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Tipe & Metode</th>
                <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Nominal</th>
                <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Keterangan</th>
                <th scope="col" className="px-6 py-3.5 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <span className="text-base font-medium text-slate-300">Tidak ada transaksi ditemukan</span>
                      <span className="text-xs text-slate-500">Coba ubah kata kunci pencarian atau rentang tanggal.</span>
                      <button
                        onClick={() => handleOpenModal()}
                        className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
                      >
                        <Plus className="h-3.5 w-3.5" /> Tambah Transaksi Baru
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 font-medium">
                      {format(new Date(tx.date), 'dd MMM yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-semibold">
                      {tx.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${
                          tx.type === 'income' 
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' 
                            : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                        }`}>
                          {tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                        </span>
                        <span className={`text-xs uppercase px-2 py-0.5 rounded-md font-medium border ${
                          tx.method === 'cash' 
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' 
                            : 'bg-sky-500/10 text-sky-300 border-sky-500/20'
                        }`}>
                          {tx.method.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-mono font-bold tracking-tight ${
                      tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {tx.type === 'income' ? '+' : '-'}{formatRupiah(tx.amount)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400 max-w-xs truncate" title={tx.notes || ''}>
                      {tx.notes || <span className="text-slate-600">-</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleOpenModal(tx)} 
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors" 
                          title="Edit Transaksi"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(tx.id)} 
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors" 
                          title="Hapus Transaksi"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Dialog (Responsive: Centered on Desktop, Sheet on Mobile) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-[#0a0c10]/80 backdrop-blur-sm transition-opacity" aria-hidden="true" onClick={handleCloseModal}></div>
          
          <div className="relative w-full sm:max-w-xl bg-[#11141b] border-t sm:border border-slate-800 rounded-t-2xl sm:rounded-2xl shadow-2xl transform transition-all flex flex-col max-h-[95vh] sm:max-h-[90vh]">
            {/* Drag handle for mobile */}
            <div className="w-full flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-12 h-1.5 bg-slate-800 rounded-full"></div>
            </div>

            <div className="px-5 pt-3 pb-6 sm:p-6 sm:pb-6 overflow-y-auto">
              <div className="flex justify-between items-center mb-6 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-lg font-bold text-white" id="modal-title">
                    {editingId ? 'Edit Transaksi' : 'Tambah Transaksi Baru'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Isi detail pencatatan kas masuk atau kas keluar</p>
                </div>
                <button 
                  onClick={handleCloseModal} 
                  className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors"
                  title="Tutup (Esc)"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Segmented Control for Tipe */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Tipe Transaksi</label>
                  <div className="grid grid-cols-2 gap-2 bg-[#0a0c10] p-1.5 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ 
                          ...formData, 
                          type: 'income', 
                          method: 'cash',
                          category: INCOME_CATEGORIES[0].label
                        });
                      }}
                      className={`py-2.5 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
                        formData.type === 'income' 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm' 
                          : 'text-slate-400 hover:text-slate-300'
                      }`}
                    >
                      <ArrowUpRight className="h-4 w-4" />
                      Pemasukan
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ 
                          ...formData, 
                          type: 'outcome', 
                          method: 'cash',
                          category: OUTCOME_CASH_CATEGORIES[0]
                        });
                      }}
                      className={`py-2.5 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
                        formData.type === 'outcome' 
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-sm' 
                          : 'text-slate-400 hover:text-slate-300'
                      }`}
                    >
                      <ArrowDownRight className="h-4 w-4" />
                      Pengeluaran
                    </button>
                  </div>
                </div>

                {/* Grid 2 Column on Desktop for Amount & Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Jumlah Amount */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Jumlah Nominal</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <span className="text-slate-400 text-sm font-semibold">Rp</span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        required
                        value={formData.amount || ''}
                        onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                        className="block w-full pl-11 pr-4 py-2.5 bg-[#0a0c10] border-slate-700 text-white rounded-xl shadow-sm focus:ring-emerald-500 focus:border-emerald-500 text-base font-mono font-semibold border transition-colors"
                        placeholder="0"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Tanggal */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Tanggal</label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="block w-full bg-[#0a0c10] border-slate-700 text-white rounded-xl shadow-sm focus:ring-emerald-500 focus:border-emerald-500 py-2.5 px-3.5 text-sm border transition-colors cursor-pointer"
                    />
                  </div>
                </div>

                {/* Grid 2 Column on Desktop for Method & Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Metode */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      {formData.type === 'income' ? 'Metode / Jenis Kas' : 'Metode Pembayaran'}
                    </label>
                    <select
                      value={formData.method}
                      onChange={(e) => {
                        const method = e.target.value as any;
                        let category = formData.category;
                        if (formData.type === 'outcome') {
                          category = method === 'tf' ? OUTCOME_TF_CATEGORIES[0] : OUTCOME_CASH_CATEGORIES[0];
                        } else {
                          category = INCOME_CATEGORIES.find(c => c.method === method)?.label || 'Cash';
                        }
                        setFormData({ ...formData, method, category });
                      }}
                      className="block w-full px-3.5 py-2.5 text-sm bg-[#0a0c10] border-slate-700 text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 rounded-xl border transition-colors cursor-pointer"
                    >
                      {formData.type === 'income' ? (
                        <>
                          <option value="cash">Cash / Tunai</option>
                          <option value="tf_bjb">Transfer Bank BJB</option>
                          <option value="tf_bri">Transfer Bank BRI</option>
                        </>
                      ) : (
                        <>
                          <option value="cash">Cash / Tunai</option>
                          <option value="tf">Transfer Bank</option>
                        </>
                      )}
                    </select>
                  </div>

                  {/* Kategori - Only for Outcome */}
                  {formData.type === 'outcome' ? (
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Kategori Pengeluaran</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="block w-full px-3.5 py-2.5 text-sm bg-[#0a0c10] border-slate-700 text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 rounded-xl border transition-colors cursor-pointer"
                      >
                        {availableCategories.map((c, i) => (
                          <option key={i} value={c.label}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Label Kategori</label>
                      <input
                        type="text"
                        disabled
                        value={formData.category}
                        className="block w-full px-3.5 py-2.5 text-sm bg-[#0a0c10]/50 border-slate-800 text-slate-400 rounded-xl border"
                      />
                    </div>
                  )}
                </div>

                {/* Keterangan / Notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Keterangan Tambahan (Opsional)</label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="block w-full bg-[#0a0c10] border-slate-700 text-white rounded-xl shadow-sm focus:ring-emerald-500 focus:border-emerald-500 text-sm border py-2 px-3.5 transition-colors"
                    placeholder="Contoh: Beli ATK apotek, kirim via kurir"
                  />
                </div>
                
                {/* Form Action Buttons */}
                <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-slate-300 bg-slate-800 border border-slate-700 rounded-xl shadow-sm hover:bg-slate-700 focus:outline-none transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-6 py-2.5 text-sm font-semibold text-slate-900 bg-emerald-400 hover:bg-emerald-300 border border-transparent rounded-xl shadow-sm focus:outline-none transition-colors"
                  >
                    {editingId ? 'Simpan Perubahan' : 'Simpan Transaksi'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

