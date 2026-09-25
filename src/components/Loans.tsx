import React, { useState, useMemo } from 'react';
import { 
  Loan, 
  LoanPayment, 
  formatRupiah, 
  getLoanTotalPaid, 
  getLoanRemaining 
} from '../types';
import { 
  HandCoins, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  Trash2, 
  Edit3, 
  DollarSign, 
  User, 
  Building2, 
  Receipt, 
  X, 
  Calendar,
  CreditCard,
  History
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface LoansProps {
  loans: Loan[];
  onAddLoan: (
    loan: {
      type: 'employee' | 'owner';
      borrowerName: string;
      amount: number;
      date: string;
      notes?: string;
      disbursementMethod?: string;
    },
    syncTransaction?: boolean
  ) => Promise<string | void>;
  onUpdateLoan: (id: string, data: Partial<Loan>) => Promise<void>;
  onDeleteLoan: (id: string) => Promise<void>;
  onAddPayment: (
    loanId: string,
    payment: {
      amount: number;
      date: string;
      method: string;
      notes?: string;
    },
    syncTransaction?: boolean
  ) => Promise<void>;
  onDeletePayment: (loanId: string, paymentId: string) => Promise<void>;
}

export default function Loans({
  loans,
  onAddLoan,
  onUpdateLoan,
  onDeleteLoan,
  onAddPayment,
  onDeletePayment
}: LoansProps) {
  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'employee' | 'owner'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paid'>('all');

  // Modals state
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [editingLoanId, setEditingLoanId] = useState<string | null>(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedLoanForPayment, setSelectedLoanForPayment] = useState<Loan | null>(null);

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedLoanForHistory, setSelectedLoanForHistory] = useState<Loan | null>(null);

  // Form Data for Loan
  const [loanForm, setLoanForm] = useState({
    type: 'employee' as 'employee' | 'owner',
    borrowerName: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    notes: '',
    disbursementMethod: 'cash',
    syncTransaction: true
  });

  // Form Data for Payment
  const [paymentForm, setPaymentForm] = useState({
    loanId: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    method: 'cash',
    notes: '',
    syncTransaction: true
  });

  // Calculate statistics
  const stats = useMemo(() => {
    let totalLoanAmount = 0;
    let totalPaidAmount = 0;
    let totalRemainingAmount = 0;

    let employeeRemaining = 0;
    let ownerRemaining = 0;
    let activeLoanCount = 0;

    loans.forEach(loan => {
      const paid = getLoanTotalPaid(loan);
      const remaining = Math.max(0, loan.amount - paid);
      
      totalLoanAmount += loan.amount;
      totalPaidAmount += paid;
      totalRemainingAmount += remaining;

      if (remaining > 0) {
        activeLoanCount++;
        if (loan.type === 'owner') {
          ownerRemaining += remaining;
        } else {
          employeeRemaining += remaining;
        }
      }
    });

    return {
      totalLoanAmount,
      totalPaidAmount,
      totalRemainingAmount,
      employeeRemaining,
      ownerRemaining,
      activeLoanCount
    };
  }, [loans]);

  // Filtered loans list
  const filteredLoans = useMemo(() => {
    return loans.filter(loan => {
      const matchesSearch = 
        loan.borrowerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (loan.notes && loan.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesType = typeFilter === 'all' || loan.type === typeFilter;
      
      const remaining = getLoanRemaining(loan);
      const isPaid = remaining <= 0;
      const matchesStatus = 
        statusFilter === 'all' || 
        (statusFilter === 'paid' ? isPaid : !isPaid);

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [loans, searchTerm, typeFilter, statusFilter]);

  // Handle open add/edit loan modal
  const handleOpenLoanModal = (loan?: Loan) => {
    if (loan) {
      setEditingLoanId(loan.id);
      setLoanForm({
        type: loan.type,
        borrowerName: loan.borrowerName,
        amount: loan.amount,
        date: loan.date,
        notes: loan.notes || '',
        disbursementMethod: loan.disbursementMethod || 'cash',
        syncTransaction: false // don't duplicate transaction on edit
      });
    } else {
      setEditingLoanId(null);
      setLoanForm({
        type: 'employee',
        borrowerName: '',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        notes: '',
        disbursementMethod: 'cash',
        syncTransaction: true
      });
    }
    setIsLoanModalOpen(true);
  };

  const handleSaveLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loanForm.amount <= 0) {
      alert('Nominal pinjaman harus lebih dari 0');
      return;
    }

    const borrowerName = loanForm.type === 'owner' && !loanForm.borrowerName.trim()
      ? 'Owner'
      : loanForm.borrowerName.trim();

    if (!borrowerName) {
      alert('Nama peminjam wajib diisi');
      return;
    }

    if (editingLoanId) {
      await onUpdateLoan(editingLoanId, {
        type: loanForm.type,
        borrowerName,
        amount: loanForm.amount,
        date: loanForm.date,
        notes: loanForm.notes,
        disbursementMethod: loanForm.disbursementMethod
      });
    } else {
      await onAddLoan(
        {
          type: loanForm.type,
          borrowerName,
          amount: loanForm.amount,
          date: loanForm.date,
          notes: loanForm.notes,
          disbursementMethod: loanForm.disbursementMethod
        },
        loanForm.syncTransaction
      );
    }
    setIsLoanModalOpen(false);
  };

  const handleDeleteLoanClick = async (loan: Loan) => {
    if (window.confirm(`Yakin ingin menghapus pinjaman ${loan.borrowerName} senilai ${formatRupiah(loan.amount)}? Transaksi kas terkait juga akan dihapus.`)) {
      await onDeleteLoan(loan.id);
    }
  };

  // Open Payment modal
  const handleOpenPaymentModal = (loan?: Loan) => {
    const targetLoan = loan || (loans.find(l => getLoanRemaining(l) > 0) || loans[0]);
    if (!targetLoan) {
      alert('Belum ada data pinjaman untuk dibayar. Buat pinjaman terlebih dahulu.');
      return;
    }
    setSelectedLoanForPayment(targetLoan);
    const rem = getLoanRemaining(targetLoan);
    setPaymentForm({
      loanId: targetLoan.id,
      amount: rem > 0 ? rem : 0,
      date: new Date().toISOString().split('T')[0],
      method: 'cash',
      notes: '',
      syncTransaction: true
    });
    setIsPaymentModalOpen(true);
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.loanId) {
      alert('Pilih pinjaman yang akan dibayar');
      return;
    }
    if (paymentForm.amount <= 0) {
      alert('Nominal pembayaran harus lebih dari 0');
      return;
    }

    await onAddPayment(
      paymentForm.loanId,
      {
        amount: paymentForm.amount,
        date: paymentForm.date,
        method: paymentForm.method,
        notes: paymentForm.notes
      },
      paymentForm.syncTransaction
    );

    setIsPaymentModalOpen(false);
    // Refresh history view if open
    if (isHistoryModalOpen && selectedLoanForHistory?.id === paymentForm.loanId) {
      const updated = loans.find(l => l.id === paymentForm.loanId);
      if (updated) setSelectedLoanForHistory(updated);
    }
  };

  // Open History modal
  const handleOpenHistoryModal = (loan: Loan) => {
    setSelectedLoanForHistory(loan);
    setIsHistoryModalOpen(true);
  };

  const handleDeletePaymentClick = async (loanId: string, paymentId: string) => {
    if (window.confirm('Hapus catatan pembayaran ini? Transaksi kas terkait juga akan dihapus.')) {
      await onDeletePayment(loanId, paymentId);
      // update state in history
      const updated = loans.find(l => l.id === loanId);
      if (updated) setSelectedLoanForHistory(updated);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <HandCoins className="h-7 w-7 text-indigo-400" />
            Pinjaman & Pembayaran
          </h2>
          <p className="text-neutral-400 text-sm mt-1">
            Pencatatan pinjaman Karyawan & Owner, cicilan/pelunasan, dan integrasi otomatis ke Buku Kas.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => handleOpenPaymentModal()}
            className="inline-flex items-center justify-center px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 rounded-xl text-sm font-semibold transition-all shadow-sm"
          >
            <Receipt className="mr-2 h-4 w-4 text-emerald-400" />
            + Bayar Pinjaman
          </button>
          <button
            onClick={() => handleOpenLoanModal()}
            className="inline-flex items-center justify-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20"
          >
            <Plus className="mr-2 h-4 w-4" />
            + Pinjaman Baru
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Sisa Pinjaman */}
        <div className="bg-neutral-900/50 backdrop-blur-xl border border-neutral-800/60 p-5 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Total Sisa Tagihan</span>
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl">
              <HandCoins className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white font-mono">{formatRupiah(stats.totalRemainingAmount)}</div>
            <p className="text-xs text-neutral-400 mt-1">
              Dari <span className="text-neutral-300 font-semibold">{stats.activeLoanCount}</span> pinjaman aktif
            </p>
          </div>
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-colors" />
        </div>

        {/* Card 2: Sisa Karyawan */}
        <div className="bg-neutral-900/50 backdrop-blur-xl border border-neutral-800/60 p-5 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Pinjaman Karyawan</span>
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
              <User className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white font-mono">{formatRupiah(stats.employeeRemaining)}</div>
            <p className="text-xs text-neutral-400 mt-1">Sisa belum lunas karyawan</p>
          </div>
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors" />
        </div>

        {/* Card 3: Sisa Owner */}
        <div className="bg-neutral-900/50 backdrop-blur-xl border border-neutral-800/60 p-5 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Pinjaman Owner</span>
            <div className="p-2.5 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-xl">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white font-mono">{formatRupiah(stats.ownerRemaining)}</div>
            <p className="text-xs text-neutral-400 mt-1">Sisa pinjaman / prive owner</p>
          </div>
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-sky-500/5 rounded-full blur-2xl group-hover:bg-sky-500/10 transition-colors" />
        </div>

        {/* Card 4: Total Pelunasan Diterima */}
        <div className="bg-neutral-900/50 backdrop-blur-xl border border-neutral-800/60 p-5 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Pelunasan Diterima</span>
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-400 font-mono">{formatRupiah(stats.totalPaidAmount)}</div>
            <p className="text-xs text-neutral-400 mt-1">
              Total dipulihkan dari {formatRupiah(stats.totalLoanAmount)}
            </p>
          </div>
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-neutral-900/40 backdrop-blur-md p-3 rounded-2xl border border-neutral-800/60">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Cari nama peminjam / catatan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-neutral-950/70 border border-neutral-800 rounded-xl text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {/* Tipe Selector */}
          <div className="flex items-center bg-neutral-950/80 p-1 rounded-xl border border-neutral-800 text-xs shrink-0">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                typeFilter === 'all' ? 'bg-indigo-500/20 text-indigo-300 font-bold' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Semua Tipe
            </button>
            <button
              onClick={() => setTypeFilter('employee')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                typeFilter === 'employee' ? 'bg-indigo-500/20 text-indigo-300 font-bold' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Karyawan
            </button>
            <button
              onClick={() => setTypeFilter('owner')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                typeFilter === 'owner' ? 'bg-indigo-500/20 text-indigo-300 font-bold' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Owner
            </button>
          </div>

          {/* Status Selector */}
          <div className="flex items-center bg-neutral-950/80 p-1 rounded-xl border border-neutral-800 text-xs shrink-0">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                statusFilter === 'all' ? 'bg-indigo-500/20 text-indigo-300 font-bold' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Semua Status
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                statusFilter === 'active' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Belum Lunas
            </button>
            <button
              onClick={() => setStatusFilter('paid')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                statusFilter === 'paid' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Lunas
            </button>
          </div>
        </div>
      </div>

      {/* Table / Cards View */}
      <div className="bg-neutral-900/40 backdrop-blur-xl border border-neutral-800/60 rounded-2xl overflow-hidden shadow-xl">
        {filteredLoans.length === 0 ? (
          <div className="p-12 text-center">
            <HandCoins className="h-12 w-12 text-neutral-600 mx-auto mb-3 stroke-[1.5]" />
            <h3 className="text-base font-semibold text-neutral-300">Belum Ada Data Pinjaman</h3>
            <p className="text-neutral-500 text-sm mt-1 max-w-sm mx-auto">
              Klik tombol "+ Pinjaman Baru" untuk mencatat pinjaman Karyawan atau Owner.
            </p>
            <button
              onClick={() => handleOpenLoanModal()}
              className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all"
            >
              <Plus className="mr-2 h-4 w-4" /> Tambah Pinjaman Sekarang
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-neutral-800/80 bg-neutral-950/40 text-neutral-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-4 px-4 sm:px-6">Peminjam</th>
                  <th className="py-4 px-4 hidden md:table-cell">Tanggal Pinjam</th>
                  <th className="py-4 px-4 text-right">Nominal Pinjaman</th>
                  <th className="py-4 px-4">Pelunasan & Progres</th>
                  <th className="py-4 px-4 text-right">Sisa Tagihan</th>
                  <th className="py-4 px-4 text-center">Status</th>
                  <th className="py-4 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/50">
                {filteredLoans.map((loan) => {
                  const totalPaid = getLoanTotalPaid(loan);
                  const remaining = getLoanRemaining(loan);
                  const isPaid = remaining <= 0;
                  const progressPct = loan.amount > 0 ? Math.min(100, Math.round((totalPaid / loan.amount) * 100)) : 100;
                  const paymentCount = loan.payments ? loan.payments.length : 0;

                  return (
                    <tr key={loan.id} className="hover:bg-neutral-800/30 transition-colors">
                      {/* Borrower info */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            loan.type === 'owner' 
                              ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' 
                              : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                          }`}>
                            {loan.type === 'owner' ? <Building2 className="h-4 w-4" /> : <User className="h-4 w-4" />}
                          </div>
                          <div>
                            <div className="font-semibold text-white flex items-center gap-2">
                              {loan.borrowerName}
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                loan.type === 'owner'
                                  ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                                  : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                              }`}>
                                {loan.type === 'owner' ? 'Owner' : 'Karyawan'}
                              </span>
                            </div>
                            <div className="text-xs text-neutral-400 mt-0.5 md:hidden">
                              {format(parseISO(loan.date), 'dd/MM/yyyy')}
                            </div>
                            {loan.notes && (
                              <div className="text-xs text-neutral-400 italic mt-0.5 truncate max-w-xs">
                                "{loan.notes}"
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-4 px-4 text-neutral-300 font-mono text-xs hidden md:table-cell">
                        {format(parseISO(loan.date), 'dd MMM yyyy')}
                      </td>

                      {/* Loan Amount */}
                      <td className="py-4 px-4 text-right font-mono font-bold text-white">
                        {formatRupiah(loan.amount)}
                      </td>

                      {/* Repayment Progress */}
                      <td className="py-4 px-4 min-w-[150px]">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-emerald-400 font-mono font-semibold">{formatRupiah(totalPaid)}</span>
                          <span className="text-neutral-400 text-[11px] font-mono">{progressPct}%</span>
                        </div>
                        <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              isPaid ? 'bg-emerald-500' : 'bg-indigo-500'
                            }`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        <div className="text-[11px] text-neutral-500 mt-1 flex items-center gap-1">
                          <History className="h-3 w-3" />
                          <span>{paymentCount}x pembayaran</span>
                        </div>
                      </td>

                      {/* Remaining Balance */}
                      <td className="py-4 px-4 text-right font-mono font-bold">
                        {isPaid ? (
                          <span className="text-neutral-500">-</span>
                        ) : (
                          <span className="text-rose-400">{formatRupiah(remaining)}</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="h-3 w-3" /> LUNAS
                          </span>
                        ) : totalPaid > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <Clock className="h-3 w-3" /> SEBAGIAN
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            BELUM BAYAR
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isPaid && (
                            <button
                              onClick={() => handleOpenPaymentModal(loan)}
                              className="px-2.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-semibold transition-all"
                              title="Bayar Cicilan / Pelunasan"
                            >
                              Bayar
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenHistoryModal(loan)}
                            className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition-colors"
                            title="Lihat Riwayat Pembayaran"
                          >
                            <History className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOpenLoanModal(loan)}
                            className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition-colors"
                            title="Edit Data Pinjaman"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteLoanClick(loan)}
                            className="p-1.5 bg-neutral-800 hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400 rounded-lg transition-colors"
                            title="Hapus Pinjaman"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 1. MODAL TAMBAH / EDIT PINJAMAN                           */}
      {/* ======================================================== */}
      {isLoanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
                  <HandCoins className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {editingLoanId ? 'Edit Data Pinjaman' : 'Buat Pinjaman Baru'}
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Pencatatan pinjaman dana untuk karyawan atau owner.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsLoanModalOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLoan} className="p-6 space-y-4">
              {/* Tipe Peminjam */}
              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                  Tipe Peminjam
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setLoanForm({ ...loanForm, type: 'employee', borrowerName: loanForm.borrowerName === 'Owner' ? '' : loanForm.borrowerName })}
                    className={`py-3 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 border transition-all ${
                      loanForm.type === 'employee'
                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-sm'
                        : 'bg-neutral-950/50 text-neutral-400 border-neutral-800 hover:text-white'
                    }`}
                  >
                    <User className="h-4 w-4" /> Karyawan
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoanForm({ ...loanForm, type: 'owner', borrowerName: 'Owner' })}
                    className={`py-3 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 border transition-all ${
                      loanForm.type === 'owner'
                        ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 shadow-sm'
                        : 'bg-neutral-950/50 text-neutral-400 border-neutral-800 hover:text-white'
                    }`}
                  >
                    <Building2 className="h-4 w-4" /> Owner / Prive
                  </button>
                </div>
              </div>

              {/* Nama Peminjam */}
              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                  Nama Peminjam *
                </label>
                <input
                  type="text"
                  required
                  placeholder={loanForm.type === 'owner' ? 'Owner' : 'Contoh: Ahmad, Siti, Rudi'}
                  value={loanForm.borrowerName}
                  onChange={(e) => setLoanForm({ ...loanForm, borrowerName: e.target.value })}
                  className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 text-sm"
                />
              </div>

              {/* Jumlah Pinjaman */}
              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                  Nominal Pinjaman (Rp) *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-bold">Rp</span>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="0"
                    value={loanForm.amount || ''}
                    onChange={(e) => setLoanForm({ ...loanForm, amount: Number(e.target.value) })}
                    className="w-full pl-12 pr-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white font-mono font-bold text-lg focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Tanggal & Metode Pencairan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                    Tanggal Pinjaman *
                  </label>
                  <input
                    type="date"
                    required
                    value={loanForm.date}
                    onChange={(e) => setLoanForm({ ...loanForm, date: e.target.value })}
                    className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                    Metode Pencairan
                  </label>
                  <select
                    value={loanForm.disbursementMethod}
                    onChange={(e) => setLoanForm({ ...loanForm, disbursementMethod: e.target.value })}
                    className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 text-sm"
                  >
                    <option value="cash">Tunai / Cash</option>
                    <option value="tf_bjb">Transfer BJB</option>
                    <option value="tf_bri">Transfer BRI</option>
                  </select>
                </div>
              </div>

              {/* Catatan */}
              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                  Keperluan / Catatan (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Kebutuhan darurat, biaya sekolah, dll"
                  value={loanForm.notes}
                  onChange={(e) => setLoanForm({ ...loanForm, notes: e.target.value })}
                  className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 text-sm"
                />
              </div>

              {/* Sinkronisasi Transaksi Kas */}
              {!editingLoanId && (
                <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="syncTxLoan"
                    checked={loanForm.syncTransaction}
                    onChange={(e) => setLoanForm({ ...loanForm, syncTransaction: e.target.checked })}
                    className="mt-1 h-4 w-4 rounded border-neutral-700 bg-neutral-900 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="syncTxLoan" className="text-xs text-neutral-300 leading-relaxed cursor-pointer">
                    <span className="font-semibold text-indigo-300">Otomatis catat pengeluaran di Buku Transaksi Kas</span>
                    <br />
                    Mencatat pengeluaran kas otomatis dengan kategori{' '}
                    <span className="font-mono text-white">
                      {loanForm.type === 'owner' ? 'Pinjaman Owner' : 'Pinjaman Karyawan'}
                    </span>{' '}
                    sehingga saldo kas tetap akurat.
                  </label>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-neutral-800/80">
                <button
                  type="button"
                  onClick={() => setIsLoanModalOpen(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-neutral-400 hover:text-white rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/25 transition-all"
                >
                  {editingLoanId ? 'Simpan Perubahan' : 'Simpan Pinjaman'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. MODAL BAYAR / CICIL PINJAMAN                          */}
      {/* ======================================================== */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                  <Receipt className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Catat Pembayaran Pinjaman</h3>
                  <p className="text-xs text-neutral-400">
                    Pelunasan atau cicilan pinjaman yang masuk ke kas.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="p-6 space-y-4">
              {/* Target Pinjaman */}
              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                  Pilih Pinjaman *
                </label>
                <select
                  required
                  value={paymentForm.loanId}
                  onChange={(e) => {
                    const id = e.target.value;
                    const found = loans.find(l => l.id === id);
                    setSelectedLoanForPayment(found || null);
                    const rem = found ? getLoanRemaining(found) : 0;
                    setPaymentForm({
                      ...paymentForm,
                      loanId: id,
                      amount: rem > 0 ? rem : paymentForm.amount
                    });
                  }}
                  className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-emerald-500 text-sm"
                >
                  <option value="" disabled>-- Pilih Pinjaman --</option>
                  {loans.map(l => {
                    const rem = getLoanRemaining(l);
                    return (
                      <option key={l.id} value={l.id}>
                        {l.borrowerName} ({l.type === 'owner' ? 'Owner' : 'Karyawan'}) - Sisa: {formatRupiah(rem)} {rem <= 0 ? '(Lunas)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Info Sisa Tagihan */}
              {selectedLoanForPayment && (
                <div className="p-4 bg-neutral-950/70 border border-neutral-800 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-xs text-neutral-400">Total Pinjaman:</span>
                    <div className="text-sm font-mono font-bold text-white">
                      {formatRupiah(selectedLoanForPayment.amount)}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-neutral-400">Sudah Dibayar:</span>
                    <div className="text-sm font-mono font-bold text-emerald-400">
                      {formatRupiah(getLoanTotalPaid(selectedLoanForPayment))}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-neutral-400">Sisa Tagihan:</span>
                    <div className="text-sm font-mono font-bold text-rose-400">
                      {formatRupiah(getLoanRemaining(selectedLoanForPayment))}
                    </div>
                  </div>
                </div>
              )}

              {/* Jumlah Pembayaran */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    Jumlah Bayar (Rp) *
                  </label>
                  {selectedLoanForPayment && getLoanRemaining(selectedLoanForPayment) > 0 && (
                    <button
                      type="button"
                      onClick={() => setPaymentForm({ ...paymentForm, amount: getLoanRemaining(selectedLoanForPayment) })}
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold underline"
                    >
                      Lunasi Seluruh Sisa ({formatRupiah(getLoanRemaining(selectedLoanForPayment))})
                    </button>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-bold">Rp</span>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="0"
                    value={paymentForm.amount || ''}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                    className="w-full pl-12 pr-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white font-mono font-bold text-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Tanggal & Metode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                    Tanggal Pembayaran *
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentForm.date}
                    onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                    className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-emerald-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                    Metode Pembayaran
                  </label>
                  <select
                    value={paymentForm.method}
                    onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                    className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-emerald-500 text-sm"
                  >
                    <option value="cash">Cash / Tunai</option>
                    <option value="tf_bjb">Transfer BJB</option>
                    <option value="tf_bri">Transfer BRI</option>
                  </select>
                </div>
              </div>

              {/* Catatan / Keterangan */}
              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                  Catatan / Keterangan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Potong gaji bulan Maret, transfer langsung"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>

              {/* Sinkronisasi Transaksi Kas */}
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3">
                <input
                  type="checkbox"
                  id="syncTxPayment"
                  checked={paymentForm.syncTransaction}
                  onChange={(e) => setPaymentForm({ ...paymentForm, syncTransaction: e.target.checked })}
                  className="mt-1 h-4 w-4 rounded border-neutral-700 bg-neutral-900 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="syncTxPayment" className="text-xs text-neutral-300 leading-relaxed cursor-pointer">
                  <span className="font-semibold text-emerald-300">Otomatis catat pemasukan di Buku Transaksi Kas</span>
                  <br />
                  Mencatat kas masuk otomatis dengan kategori{' '}
                  <span className="font-mono text-white">Pelunasan Pinjaman</span> agar masuk ke perhitungan laporan bulanan.
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-neutral-800/80">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-neutral-400 hover:text-white rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-600/25 transition-all"
                >
                  Simpan Pembayaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. MODAL RIWAYAT PEMBAYARAN                              */}
      {/* ======================================================== */}
      {isHistoryModalOpen && selectedLoanForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
                  <History className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Riwayat Pembayaran: {selectedLoanForHistory.borrowerName}
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Daftar cicilan dan pelunasan pinjaman ini.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Summary Card */}
              <div className="grid grid-cols-3 gap-3 p-4 bg-neutral-950 rounded-2xl border border-neutral-800 text-center">
                <div>
                  <span className="text-[11px] text-neutral-400 uppercase font-semibold">Total Pinjaman</span>
                  <div className="text-sm sm:text-base font-bold text-white font-mono mt-1">
                    {formatRupiah(selectedLoanForHistory.amount)}
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-neutral-400 uppercase font-semibold">Total Terbayar</span>
                  <div className="text-sm sm:text-base font-bold text-emerald-400 font-mono mt-1">
                    {formatRupiah(getLoanTotalPaid(selectedLoanForHistory))}
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-neutral-400 uppercase font-semibold">Sisa Tagihan</span>
                  <div className="text-sm sm:text-base font-bold text-rose-400 font-mono mt-1">
                    {formatRupiah(getLoanRemaining(selectedLoanForHistory))}
                  </div>
                </div>
              </div>

              {/* Payments List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    Daftar Pembayaran ({selectedLoanForHistory.payments?.length || 0})
                  </h4>
                  {getLoanRemaining(selectedLoanForHistory) > 0 && (
                    <button
                      onClick={() => {
                        handleOpenPaymentModal(selectedLoanForHistory);
                      }}
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" /> Bayar Sekarang
                    </button>
                  )}
                </div>

                {!selectedLoanForHistory.payments || selectedLoanForHistory.payments.length === 0 ? (
                  <div className="p-8 text-center text-sm text-neutral-500 bg-neutral-950/40 rounded-2xl border border-neutral-800/40">
                    Belum ada pembayaran yang dicatat untuk pinjaman ini.
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-800/60 max-h-64 overflow-y-auto border border-neutral-800/60 rounded-2xl bg-neutral-950/30">
                    {selectedLoanForHistory.payments.map((p, idx) => (
                      <div key={p.id || idx} className="p-3.5 flex items-center justify-between hover:bg-neutral-800/30 transition-colors">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-mono font-bold text-emerald-400">
                              {formatRupiah(p.amount)}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 font-medium">
                              {p.method === 'cash' ? 'Tunai' : p.method.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                          <div className="text-xs text-neutral-400 mt-0.5 flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-neutral-500" />
                            <span>{format(parseISO(p.date), 'dd MMMM yyyy')}</span>
                            {p.notes && <span>• {p.notes}</span>}
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeletePaymentClick(selectedLoanForHistory.id, p.id)}
                          className="p-1.5 text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                          title="Hapus Pembayaran Ini"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsHistoryModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-neutral-300 bg-neutral-800 hover:bg-neutral-700 rounded-xl"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
