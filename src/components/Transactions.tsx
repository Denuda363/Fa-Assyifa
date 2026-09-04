import React, { useState, useMemo } from 'react';
import { Transaction, INCOME_CATEGORIES, OUTCOME_CASH_CATEGORIES, OUTCOME_TF_CATEGORIES, formatRupiah } from '../types';
import { Edit2, Trash2, Plus, X, Filter } from 'lucide-react';
import { format, isWithinInterval, startOfDay, endOfDay, parseISO } from 'date-fns';

interface TransactionsProps {
  transactions: Transaction[];
  onAdd: (tx: Omit<Transaction, 'id' | 'timestamp'>) => Promise<void>;
  onUpdate: (id: string, tx: Partial<Transaction>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function Transactions({ transactions, onAdd, onUpdate, onDelete }: TransactionsProps) {
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

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (!startDate && !endDate) return true;
      const txDate = parseISO(tx.date);
      const start = startDate ? startOfDay(parseISO(startDate)) : null;
      const end = endDate ? endOfDay(parseISO(endDate)) : null;
      
      if (start && end) {
        return isWithinInterval(txDate, { start, end });
      } else if (start) {
        return txDate >= start;
      } else if (end) {
        return txDate <= end;
      }
      return true;
    });
  }, [transactions, startDate, endDate]);

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

  const availableCategories = formData.type === 'income' 
    ? INCOME_CATEGORIES 
    : (formData.method === 'tf' ? OUTCOME_TF_CATEGORIES.map(c => ({label: c, method: 'tf'})) : OUTCOME_CASH_CATEGORIES.map(c => ({label: c, method: 'cash'})));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-white">Riwayat Transaksi</h2>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 bg-neutral-900/60 backdrop-blur-md border border-neutral-800/60 rounded-xl p-1.5 flex-1 sm:flex-none min-w-[200px] transition-all focus-within:border-indigo-500">
            <Filter className="h-4 w-4 text-neutral-500 ml-2" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent border-none text-neutral-300 text-sm focus:ring-0 w-full sm:w-auto px-2 outline-none"
              title="Dari Tanggal"
            />
            <span className="text-neutral-500">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent border-none text-neutral-300 text-sm focus:ring-0 w-full sm:w-auto px-2 outline-none"
              title="Sampai Tanggal"
            />
            {(startDate || endDate) && (
              <button 
                onClick={() => { setStartDate(''); setEndDate(''); }}
                className="text-neutral-400 hover:text-rose-400 mr-2 transition-colors"
                title="Hapus Filter"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center justify-center px-4 py-2.5 border border-transparent shadow-lg shadow-indigo-500/20 text-sm font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-500 transition-colors w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" /> Tambah Transaksi
          </button>
        </div>
      </div>

      <div className="bg-neutral-900/30 backdrop-blur-xl border-y sm:border border-neutral-800/50 sm:rounded-[2rem] shadow-sm sm:shadow-xl overflow-hidden -mx-4 md:mx-0">
        {/* Mobile View (Cards) */}
        <div className="block md:hidden">
          {filteredTransactions.length === 0 ? (
            <div className="p-8 text-center text-sm text-neutral-500 font-medium">
              Belum ada transaksi.
            </div>
          ) : (
            <div className="divide-y divide-neutral-800/40">
              {filteredTransactions.map((tx) => (
                <div key={tx.id} className="p-4 hover:bg-neutral-800/40 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="text-sm font-semibold text-white tracking-tight">{tx.category}</h4>
                      <div className="text-xs text-neutral-400 mt-1">{format(new Date(tx.date), 'dd MMM yyyy')}</div>
                    </div>
                    <div className={`text-sm font-mono font-semibold ${
                      tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {tx.type === 'income' ? '+' : '-'}{formatRupiah(tx.amount)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${
                        tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                      </span>
                      <span className="text-neutral-400 uppercase text-[10px] font-semibold tracking-wide border border-neutral-800 px-2 py-0.5 rounded-full">
                        {tx.method.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <button onClick={() => handleOpenModal(tx)} className="text-neutral-500 hover:text-indigo-400 transition-colors" title="Edit">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(tx.id)} className="text-neutral-500 hover:text-rose-400 transition-colors" title="Hapus">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {tx.notes && (
                    <div className="mt-3 text-xs text-neutral-400 truncate bg-neutral-950/30 px-3 py-2 rounded-lg border border-neutral-800/30">
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
                <th scope="col" className="px-6 py-4 text-left text-[11px] font-bold text-neutral-500 uppercase tracking-widest">Tanggal</th>
                <th scope="col" className="px-6 py-4 text-left text-[11px] font-bold text-neutral-500 uppercase tracking-widest">Kategori</th>
                <th scope="col" className="px-6 py-4 text-left text-[11px] font-bold text-neutral-500 uppercase tracking-widest">Tipe/Metode</th>
                <th scope="col" className="px-6 py-4 text-left text-[11px] font-bold text-neutral-500 uppercase tracking-widest">Jumlah</th>
                <th scope="col" className="px-6 py-4 text-left text-[11px] font-bold text-neutral-500 uppercase tracking-widest">Keterangan</th>
                <th scope="col" className="px-6 py-4 text-right text-[11px] font-bold text-neutral-500 uppercase tracking-widest">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-transparent divide-y divide-neutral-800/60">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-sm text-neutral-500 font-medium">
                    Belum ada transaksi.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-neutral-800/40 transition-colors">
                    <td className="px-6 py-5 whitespace-nowrap text-sm text-neutral-400">
                      {format(new Date(tx.date), 'dd MMM yyyy')}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm text-white font-semibold tracking-tight">
                      {tx.category}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${
                        tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                      </span>
                      <span className="ml-2 text-neutral-400 uppercase text-[10px] font-semibold tracking-wide border border-neutral-700/50 px-2.5 py-0.5 rounded-full">
                        {tx.method.replace('_', ' ')}
                      </span>
                    </td>
                    <td className={`px-6 py-5 whitespace-nowrap text-sm font-mono font-bold ${
                      tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {tx.type === 'income' ? '+' : '-'}{formatRupiah(tx.amount)}
                    </td>
                    <td className="px-6 py-5 text-sm text-neutral-400 max-w-xs truncate">
                      {tx.notes || '-'}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleOpenModal(tx)} className="text-neutral-500 hover:text-indigo-400 mx-2 transition-colors" title="Edit">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(tx.id)} className="text-neutral-500 hover:text-rose-500 mx-2 transition-colors" title="Cancel/Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm transition-opacity" aria-hidden="true" onClick={handleCloseModal}></div>
          
          <div className="relative w-full sm:max-w-lg bg-neutral-900 border-t sm:border border-neutral-800 rounded-t-3xl sm:rounded-3xl shadow-2xl transform transition-all flex flex-col max-h-[95vh] sm:max-h-[90vh]">
            {/* Drag handle for mobile */}
            <div className="w-full flex justify-center pt-4 pb-2 sm:hidden">
              <div className="w-12 h-1.5 bg-neutral-800 rounded-full"></div>
            </div>

            <div className="px-6 pt-2 pb-8 sm:p-8 sm:pb-8 overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl sm:text-lg font-bold text-white tracking-tight" id="modal-title">
                  {editingId ? 'Edit Transaksi' : 'Tambah Transaksi'}
                </h3>
                <button onClick={handleCloseModal} className="text-neutral-500 hover:text-white bg-neutral-800/50 hover:bg-neutral-800 p-2 rounded-full sm:bg-transparent sm:p-0 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Segmented Control for Tipe */}
                <div className="grid grid-cols-2 gap-2 bg-neutral-950 p-1.5 rounded-2xl border border-neutral-800/60">
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
                    className={`py-3 text-sm font-semibold rounded-xl transition-all ${
                      formData.type === 'income' 
                        ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-sm' 
                        : 'text-neutral-500 hover:text-neutral-300'
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
                        category: OUTCOME_CASH_CATEGORIES[0]
                      });
                    }}
                    className={`py-3 text-sm font-semibold rounded-xl transition-all ${
                      formData.type === 'outcome' 
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-sm' 
                        : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    Pengeluaran
                  </button>
                </div>

                {/* Jumlah Amount */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-400 mb-2">Jumlah (Rp)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                      <span className="text-neutral-500 font-bold">Rp</span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formData.amount || ''}
                      onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                      className="block w-full pl-14 pr-4 py-4 sm:py-3 bg-neutral-950 border-neutral-800 text-white rounded-2xl shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-xl font-bold font-mono border outline-none transition-all"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className={`grid grid-cols-1 ${formData.type === 'outcome' ? 'sm:grid-cols-2' : ''} gap-5 sm:gap-4`}>
                  {/* Metode */}
                  <div>
                    <label className="block text-sm font-semibold text-neutral-400 mb-2">
                      {formData.type === 'income' ? 'Metode / Kategori' : 'Metode Pembayaran'}
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
                      className="block w-full pl-4 pr-10 py-4 sm:py-3 text-base sm:text-sm bg-neutral-950 border-neutral-800 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-2xl border appearance-none transition-colors"
                    >
                      {formData.type === 'income' ? (
                        <>
                          <option value="cash">Cash / Tunai</option>
                          <option value="tf_bjb">Transfer BJB</option>
                          <option value="tf_bri">Transfer BRI</option>
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
                      <label className="block text-sm font-semibold text-neutral-400 mb-2">Kategori</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="block w-full pl-4 pr-10 py-4 sm:py-3 text-base sm:text-sm bg-neutral-950 border-neutral-800 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-2xl border appearance-none transition-colors"
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
                  <label className="block text-sm font-semibold text-neutral-400 mb-2">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="block w-full bg-neutral-950 border-neutral-800 text-white rounded-2xl shadow-sm focus:ring-indigo-500 focus:border-indigo-500 py-4 sm:py-3 px-4 text-base sm:text-sm border outline-none appearance-none transition-colors"
                  />
                </div>

                {/* Keterangan */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-400 mb-2">Keterangan (Opsional)</label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="block w-full bg-neutral-950 border-neutral-800 text-white rounded-2xl shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border py-4 sm:py-3 px-4 text-base outline-none transition-colors"
                    placeholder="Contoh: Beli token listrik"
                  />
                </div>
                
                <div className="pt-4 flex flex-col sm:flex-row justify-end gap-3">
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-6 py-4 sm:py-3 text-base sm:text-sm font-bold text-white bg-indigo-600 border border-transparent rounded-2xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-neutral-900 transition-all order-1 sm:order-2"
                  >
                    Simpan Transaksi
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="w-full sm:w-auto px-6 py-4 sm:py-3 text-base sm:text-sm font-semibold text-neutral-300 bg-neutral-800 border border-neutral-700 rounded-2xl shadow-sm hover:bg-neutral-700 focus:outline-none transition-all order-2 sm:order-1"
                  >
                    Batal
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
