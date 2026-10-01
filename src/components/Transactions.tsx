import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, CompanyProfile, DEFAULT_PROFILE, INCOME_CATEGORIES, OUTCOME_CASH_CATEGORIES, OUTCOME_TF_CATEGORIES, formatRupiah } from '../types';
import { Edit2, Trash2, Plus, X, Filter, Search, ArrowUpRight, ArrowDownRight, RotateCcw, ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import { createPortal } from 'react-dom';

interface TransactionsProps {
  transactions: Transaction[];
  profile: CompanyProfile;
  onAdd: (tx: Omit<Transaction, 'id' | 'timestamp'>) => Promise<void>;
  onUpdate: (id: string, tx: Partial<Transaction>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function Transactions({ transactions, profile, onAdd, onUpdate, onDelete }: TransactionsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Transaction, 'id' | 'timestamp'>>({
    type: 'income',
    method: 'cash',
    category: 'Cash',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'outcome'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Timezone-safe date formatter (DD MMM YYYY)
  const formatDateID = (dStr: string) => {
    if (!dStr) return '-';
    const parts = dStr.split('-');
    if (parts.length === 3) {
      const y = parts[0];
      const mIdx = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      const mNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      return `${d} ${mNames[mIdx] || parts[1]} ${y}`;
    }
    return dStr;
  };

  // Filter & Search Calculations
  const { filteredTransactions, counts, totals } = useMemo(() => {
    let incomeCount = 0;
    let outcomeCount = 0;
    let incomeSum = 0;
    let outcomeSum = 0;

    transactions.forEach(t => {
      const amt = Number(t.amount) || 0;
      if (t.type === 'income') {
        incomeCount++;
        incomeSum += amt;
      } else {
        outcomeCount++;
        outcomeSum += amt;
      }
    });

    const q = searchQuery.trim().toLowerCase();

    const filtered = transactions.filter((tx) => {
      // 1. Filter by Type
      if (typeFilter !== 'all' && tx.type !== typeFilter) {
        return false;
      }

      // 2. Filter by Date range (string comparison avoids timezone offset bugs)
      if (startDate && tx.date && tx.date < startDate) return false;
      if (endDate && tx.date && tx.date > endDate) return false;

      // 3. Filter by Search Query
      if (q) {
        const matchCategory = (tx.category || '').toLowerCase().includes(q);
        const matchNotes = (tx.notes || '').toLowerCase().includes(q);
        const matchMethod = (tx.method || '').toLowerCase().replace(/_/g, ' ').includes(q);
        const matchDate = (tx.date || '').toLowerCase().includes(q);
        const matchAmount = String(tx.amount || '').includes(q);
        const matchType = (tx.type === 'income' ? 'pemasukan' : 'pengeluaran').includes(q);

        if (!matchCategory && !matchNotes && !matchMethod && !matchDate && !matchAmount && !matchType) {
          return false;
        }
      }

      return true;
    });

    let filteredIncome = 0;
    let filteredOutcome = 0;
    filtered.forEach(t => {
      const amt = Number(t.amount) || 0;
      if (t.type === 'income') filteredIncome += amt;
      else filteredOutcome += amt;
    });

    return {
      filteredTransactions: filtered,
      counts: {
        total: transactions.length,
        income: incomeCount,
        outcome: outcomeCount,
        filtered: filtered.length
      },
      totals: {
        filteredIncome,
        filteredOutcome,
        net: filteredIncome - filteredOutcome
      }
    };
  }, [transactions, typeFilter, startDate, endDate, searchQuery]);

  // Reset to first page when any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, typeFilter, startDate, endDate, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / pageSize));
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTransactions.slice(start, start + pageSize);
  }, [filteredTransactions, currentPage, pageSize]);

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

  const resetAllFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setStartDate('');
    setEndDate('');
  };

  const isAnyFilterActive = !!(searchQuery || typeFilter !== 'all' || startDate || endDate);

  const customCategories = profile.customOutcomeCategories || DEFAULT_PROFILE.customOutcomeCategories || [];
  const combinedCashCategories = Array.from(new Set([...OUTCOME_CASH_CATEGORIES, ...customCategories]));

  const customTfCategories = profile.customOutcomeTfCategories || DEFAULT_PROFILE.customOutcomeTfCategories || [];
  const combinedTfCategories = Array.from(new Set([...OUTCOME_TF_CATEGORIES, ...customTfCategories]));

  const customIncomeCategories = profile.customIncomeCategories || DEFAULT_PROFILE.customIncomeCategories || [];
  const combinedIncomeCategories = [
    ...INCOME_CATEGORIES,
    ...customIncomeCategories.map(c => ({ label: c, method: c.toLowerCase().replace(/\s+/g, '_') }))
  ];

  const availableCategories = formData.type === 'income' 
    ? combinedIncomeCategories 
    : (formData.method === 'tf' ? combinedTfCategories.map(c => ({label: c, method: 'tf'})) : combinedCashCategories.map(c => ({label: c, method: 'cash'})));

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Riwayat Data Transaksi</h2>
          <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
            Total {counts.total} transaksi tercatat di sistem pembukuan
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center justify-center px-4 py-2.5 shadow-lg shadow-indigo-600/25 text-xs sm:text-sm font-bold rounded-xl sm:rounded-2xl text-white bg-indigo-600 hover:bg-indigo-500 transition-all cursor-pointer w-full sm:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" /> Tambah Transaksi
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-neutral-900/50 backdrop-blur-xl border border-neutral-800/80 rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-lg space-y-3 sm:space-y-4">
        {/* Row 1: Type Segmented Filter Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex bg-neutral-950/80 border border-neutral-800 p-1 rounded-xl sm:rounded-2xl overflow-x-auto scrollbar-none w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setTypeFilter('all')}
              className={`flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl transition-all flex-1 sm:flex-none cursor-pointer ${
                typeFilter === 'all'
                  ? 'bg-neutral-800 text-white shadow-sm font-bold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <span>Semua</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                typeFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-neutral-900 text-neutral-400'
              }`}>
                {counts.total}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setTypeFilter('income')}
              className={`flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl transition-all flex-1 sm:flex-none cursor-pointer ${
                typeFilter === 'income'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm font-bold'
                  : 'text-neutral-400 hover:text-emerald-400'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
              <span>Pemasukan</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                typeFilter === 'income' ? 'bg-emerald-500 text-neutral-950' : 'bg-neutral-900 text-emerald-400'
              }`}>
                {counts.income}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setTypeFilter('outcome')}
              className={`flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl transition-all flex-1 sm:flex-none cursor-pointer ${
                typeFilter === 'outcome'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm font-bold'
                  : 'text-neutral-400 hover:text-rose-400'
              }`}
            >
              <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
              <span>Pengeluaran</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                typeFilter === 'outcome' ? 'bg-rose-500 text-white' : 'bg-neutral-900 text-rose-400'
              }`}>
                {counts.outcome}
              </span>
            </button>
          </div>

          {/* Active Filter Clear Button */}
          {isAnyFilterActive && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-neutral-800/80 hover:bg-neutral-800 text-rose-400 hover:text-rose-300 rounded-xl text-xs font-semibold border border-neutral-700/80 transition-colors cursor-pointer self-start sm:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Semua Filter</span>
            </button>
          )}
        </div>

        {/* Row 2: Search Input & Date Range Controls */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 sm:gap-3">
          {/* Search Box */}
          <div className="md:col-span-7 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari transaksi (keterangan, kategori, metode, nominal)..."
              className="w-full pl-10 pr-9 py-2.5 bg-neutral-950/70 border border-neutral-800 focus:border-indigo-500 rounded-xl text-xs sm:text-sm text-white placeholder-neutral-500 outline-none transition-all shadow-inner focus:ring-1 focus:ring-indigo-500/30"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-white cursor-pointer"
                title="Hapus kata kunci"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Date Range Picker */}
          <div className="md:col-span-5 flex items-center gap-2 bg-neutral-950/70 border border-neutral-800 rounded-xl px-2.5 py-1.5 shadow-inner transition-all focus-within:border-indigo-500">
            <Filter className="h-3.5 w-3.5 text-neutral-500 shrink-0 ml-1" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent border-none text-neutral-300 text-xs sm:text-sm focus:ring-0 w-full outline-none"
              title="Dari Tanggal"
            />
            <span className="text-neutral-600 text-xs">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent border-none text-neutral-300 text-xs sm:text-sm focus:ring-0 w-full outline-none"
              title="Sampai Tanggal"
            />
            {(startDate || endDate) && (
              <button 
                type="button"
                onClick={() => { setStartDate(''); setEndDate(''); }}
                className="text-neutral-500 hover:text-rose-400 p-0.5 transition-colors cursor-pointer"
                title="Hapus Filter Tanggal"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Row 3: Filter Results Summary Strip */}
        <div className="pt-2 border-t border-neutral-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-neutral-400 flex items-center gap-1.5">
            <span>Menampilkan:</span>
            <strong className="text-white">{filteredTransactions.length}</strong>
            <span>dari {counts.total} transaksi</span>
            {searchQuery && (
              <span className="text-indigo-300 italic">
                (kata kunci: "{searchQuery}")
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-4 font-mono">
            <div className="flex items-center gap-1">
              <span className="text-neutral-500 text-[11px]">Masuk:</span>
              <span className="font-bold text-emerald-400">{formatRupiah(totals.filteredIncome)}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-neutral-500 text-[11px]">Keluar:</span>
              <span className="font-bold text-rose-400">{formatRupiah(totals.filteredOutcome)}</span>
            </div>
            <div className="flex items-center gap-1 pl-2 border-l border-neutral-800">
              <span className="text-neutral-500 text-[11px]">Selisih:</span>
              <span className={`font-bold ${totals.net >= 0 ? 'text-indigo-300' : 'text-rose-400'}`}>
                {formatRupiah(totals.net)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Transactions Container */}
      <div className="bg-neutral-900/30 backdrop-blur-xl border border-neutral-800/60 rounded-2xl sm:rounded-[2rem] shadow-xl overflow-hidden">
        {/* Mobile View (Cards) */}
        <div className="block md:hidden">
          {paginatedTransactions.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <Search className="w-8 h-8 text-neutral-600 mx-auto" />
              <p className="text-sm font-semibold text-white">Tidak ada transaksi yang cocok</p>
              <p className="text-xs text-neutral-400">
                Coba ubah kata kunci pencarian atau reset filter jenis dan tanggal.
              </p>
              {isAnyFilterActive && (
                <button
                  onClick={resetAllFilters}
                  className="mt-3 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  Reset Filter
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-neutral-800/40">
              {paginatedTransactions.map((tx) => (
                <div key={tx.id} className="p-4 hover:bg-neutral-800/30 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="text-sm font-bold text-white tracking-tight">{tx.category}</h4>
                      <div className="text-xs text-neutral-400 mt-0.5">{formatDateID(tx.date)}</div>
                    </div>
                    <div className={`text-sm font-mono font-bold ${
                      tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {tx.type === 'income' ? '+' : '-'}{formatRupiah(tx.amount)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${
                        tx.type === 'income' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' : 'bg-rose-500/15 text-rose-400 border border-rose-500/25'
                      }`}>
                        {tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                      </span>
                      <span className="text-neutral-400 uppercase text-[10px] font-semibold tracking-wide border border-neutral-800 px-2 py-0.5 rounded-full bg-neutral-950/50">
                        {tx.method.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => handleOpenModal(tx)} className="text-neutral-400 hover:text-indigo-400 p-1 transition-colors cursor-pointer" title="Edit">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(tx.id)} className="text-neutral-400 hover:text-rose-400 p-1 transition-colors cursor-pointer" title="Hapus">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {tx.notes && (
                    <div className="mt-2.5 text-xs text-neutral-300 bg-neutral-950/50 px-3 py-2 rounded-xl border border-neutral-800/50 leading-relaxed font-sans">
                      {tx.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Desktop View (Table) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-800/60">
            <thead className="bg-neutral-900/80">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Tanggal</th>
                <th scope="col" className="px-6 py-4 text-left text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Kategori</th>
                <th scope="col" className="px-6 py-4 text-left text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Tipe / Metode</th>
                <th scope="col" className="px-6 py-4 text-left text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Jumlah</th>
                <th scope="col" className="px-6 py-4 text-left text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Keterangan</th>
                <th scope="col" className="px-6 py-4 text-right text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-transparent divide-y divide-neutral-800/60">
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <Search className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-white">Tidak ada transaksi yang cocok</p>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Coba ubah kata kunci pencarian atau reset filter.
                    </p>
                    {isAnyFilterActive && (
                      <button
                        onClick={resetAllFilters}
                        className="mt-3 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                      >
                        Reset Filter
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-neutral-800/40 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-300 font-mono">
                      {formatDateID(tx.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-bold tracking-tight">
                      {tx.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${
                        tx.type === 'income' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      }`}>
                        {tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                      </span>
                      <span className="ml-2 text-neutral-400 uppercase text-[10px] font-semibold tracking-wide border border-neutral-800 px-2 py-0.5 rounded-full bg-neutral-950/40">
                        {tx.method.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-mono font-black ${
                      tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {tx.type === 'income' ? '+' : '-'}{formatRupiah(tx.amount)}
                    </td>
                    <td className="px-6 py-4 text-xs sm:text-sm text-neutral-300 max-w-xs truncate">
                      {tx.notes || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleOpenModal(tx)} className="text-neutral-400 hover:text-indigo-400 p-1.5 rounded-lg hover:bg-neutral-800 transition-colors mx-1 cursor-pointer" title="Edit">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(tx.id)} className="text-neutral-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-neutral-800 transition-colors mx-1 cursor-pointer" title="Hapus">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Rows Info Bar */}
        {filteredTransactions.length > 0 && (
          <div className="px-4 py-3 sm:px-6 sm:py-4 bg-neutral-950/50 border-t border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-neutral-400">
              <span>Halaman <strong className="text-white">{currentPage}</strong> dari <strong className="text-white">{totalPages}</strong></span>
              <span className="text-neutral-600">•</span>
              <span>
                (Menampilkan baris {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredTransactions.length)} dari {filteredTransactions.length})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 mr-2">
                <span className="text-neutral-500 text-[11px]">Tampilkan:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs rounded-lg px-2 py-1 outline-none cursor-pointer"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed border border-neutral-800 rounded-xl text-neutral-300 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Sebelumnya</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed border border-neutral-800 rounded-xl text-neutral-300 transition-colors cursor-pointer"
              >
                <span>Berikutnya</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Add / Edit Modal (Portal to body to prevent navbar overlay) */}
      {isModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm transition-opacity" aria-hidden="true" onClick={handleCloseModal}></div>
          
          <div className="relative w-full sm:max-w-lg bg-neutral-900 border-t sm:border border-neutral-800 rounded-t-[2rem] sm:rounded-3xl shadow-2xl transform transition-all flex flex-col max-h-[92vh] sm:max-h-[90vh] z-10">
            {/* Drag handle for mobile */}
            <div className="w-full flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-12 h-1.5 bg-neutral-800 rounded-full"></div>
            </div>

            <div className="px-6 pt-3 pb-6 sm:p-7 overflow-y-auto">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-xl sm:text-lg font-bold text-white tracking-tight" id="modal-title">
                  {editingId ? 'Edit Transaksi' : 'Tambah Transaksi'}
                </h3>
                <button onClick={handleCloseModal} className="text-neutral-400 hover:text-white bg-neutral-800/60 hover:bg-neutral-800 p-2 rounded-full transition-colors cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Segmented Control for Tipe */}
                <div className="grid grid-cols-2 gap-2 bg-neutral-950 p-1.5 rounded-2xl border border-neutral-800">
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
                    className={`py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                      formData.type === 'income' 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm' 
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    Pemasukan
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ 
                        ...formData, 
                        type: 'outcome', 
                        method: 'cash',
                        category: combinedCashCategories[0]
                      });
                    }}
                    className={`py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                      formData.type === 'outcome' 
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm' 
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    Pengeluaran
                  </button>
                </div>

                {/* Jumlah Amount */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">Jumlah (Rp)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-neutral-500 font-bold">Rp</span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formData.amount || ''}
                      onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                      className="block w-full pl-12 pr-4 py-3 bg-neutral-950 border border-neutral-800 text-white rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-lg font-bold font-mono outline-none transition-all"
                      placeholder="0"
                      autoFocus
                    />
                  </div>
                  {formData.amount > 0 && (
                    <p className="text-xs text-neutral-400 mt-1 font-mono">
                      Nominal: <strong className="text-indigo-300">{formatRupiah(formData.amount)}</strong>
                    </p>
                  )}
                </div>

                <div className={`grid grid-cols-1 ${formData.type === 'outcome' ? 'sm:grid-cols-2' : ''} gap-4`}>
                  {/* Metode */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                      {formData.type === 'income' ? 'Metode / Kategori' : 'Metode Pembayaran'}
                    </label>
                    <select
                      value={formData.method}
                      onChange={(e) => {
                        const method = e.target.value as any;
                        let category = formData.category;
                        if (formData.type === 'outcome') {
                          category = method === 'tf' ? combinedTfCategories[0] : combinedCashCategories[0];
                        } else {
                          category = combinedIncomeCategories.find(c => c.method === method)?.label || 'Cash';
                        }
                        setFormData({ ...formData, method, category });
                      }}
                      className="block w-full px-3.5 py-2.5 text-xs sm:text-sm bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-indigo-500 rounded-xl transition-colors cursor-pointer"
                    >
                      {formData.type === 'income' ? (
                        <>
                          {combinedIncomeCategories.map((c, i) => (
                            <option key={i} value={c.method}>{c.label}</option>
                          ))}
                        </>
                      ) : (
                        <>
                          <option value="cash">Cash / Tunai</option>
                          <option value="tf">Transfer</option>
                        </>
                      )}
                    </select>
                  </div>

                  {/* Kategori - Only for Outcome */}
                  {formData.type === 'outcome' && (
                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">Kategori Pengeluaran</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="block w-full px-3.5 py-2.5 text-xs sm:text-sm bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-indigo-500 rounded-xl transition-colors cursor-pointer"
                      >
                        {availableCategories.map((c, i) => (
                          <option key={i} value={c.label}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Tanggal */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="block w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl shadow-sm focus:border-indigo-500 py-2.5 px-3.5 text-xs sm:text-sm outline-none transition-colors"
                  />
                </div>

                {/* Keterangan */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">Keterangan / Catatan</label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="block w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl shadow-sm focus:border-indigo-500 py-2.5 px-3.5 text-xs sm:text-sm outline-none transition-colors placeholder-neutral-500"
                    placeholder="Contoh: Pembayaran tempo faktur Enseval, beli token listrik..."
                  />
                </div>
                
                <div className="pt-3 pb-2 sm:pb-0 flex flex-col sm:flex-row justify-end gap-3 sticky bottom-0 bg-neutral-900 border-t border-neutral-800 sm:border-0 sm:static">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="w-full sm:w-auto px-5 py-2.5 text-xs sm:text-sm font-semibold text-neutral-300 bg-neutral-800 border border-neutral-700 rounded-xl shadow-sm hover:bg-neutral-700 transition-all cursor-pointer order-2 sm:order-1"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/25 hover:bg-indigo-500 transition-all cursor-pointer order-1 sm:order-2"
                  >
                    Simpan Transaksi
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
