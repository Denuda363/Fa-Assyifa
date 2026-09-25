export interface Transaction {
  id: string;
  type: 'income' | 'outcome';
  method: string; 
  category: string;
  amount: number;
  date: string;
  notes: string;
  timestamp: number;
}

export interface LoanPayment {
  id: string;
  amount: number;
  date: string;
  method: string; // 'cash' | 'tf_bjb' | 'tf_bri' | 'tf'
  notes?: string;
  timestamp: number;
  transactionId?: string; // ID transaksi kas terkait jika disinkronkan
}

export interface Loan {
  id: string;
  type: 'employee' | 'owner'; // Karyawan atau Owner
  borrowerName: string; // Nama peminjam
  amount: number; // Jumlah pinjaman awal
  date: string; // Tanggal pinjaman
  notes?: string; // Keperluan / catatan
  status: 'active' | 'paid'; // Belum lunas atau Lunas
  payments: LoanPayment[]; // Riwayat cicilan / pelunasan
  transactionId?: string; // ID transaksi pengeluaran kas saat pencairan
  disbursementMethod?: string; // 'cash' | 'tf_bjb' | 'tf_bri'
  timestamp: number;
}

export interface CompanyProfile {
  name: string;
  address: string;
  whatsapp: string;
  customOutcomeCategories?: string[];
  customIncomeCategories?: string[];
  customOutcomeTfCategories?: string[];
}

export const DEFAULT_PROFILE: CompanyProfile = {
  name: "Apotek Assyifa Farma Cideres",
  address: "Jl. Raya Cideres-Kadipaten No. 45, Cideres, Majalengka",
  whatsapp: "",
  customOutcomeCategories: ['Air', 'Sampah', 'Keamanan', 'Pajak', 'Mes Perum', 'Pinjaman Karyawan', 'Pinjaman Owner'],
  customIncomeCategories: ['Pelunasan Pinjaman Karyawan', 'Pelunasan Pinjaman Owner'],
  customOutcomeTfCategories: ['TF Pinjaman Karyawan', 'TF Pinjaman Owner']
};

export const INCOME_CATEGORIES = [
  { label: 'Cash', method: 'cash' },
  { label: 'TF BJB', method: 'tf_bjb' },
  { label: 'TF BRI', method: 'tf_bri' }
];

export const OUTCOME_CASH_CATEGORIES = [
  'ATK',
  'Wifi',
  'Token',
  'Bensin Pengiriman',
  'Bayar Distributor',
  'Gajih Karyawan',
  'Permintaan Owner',
  'Pinjaman Karyawan',
  'Pinjaman Owner',
  'Lainnya'
];

export const OUTCOME_TF_CATEGORIES = [
  'TF Distributor',
  'TF Gajih',
  'TF Pinjaman Karyawan',
  'TF Pinjaman Owner',
  'TF Lain2'
];

export function getLoanTotalPaid(loan: Loan): number {
  if (!loan.payments || !Array.isArray(loan.payments)) return 0;
  return loan.payments.reduce((sum, p) => sum + (p.amount || 0), 0);
}

export function getLoanRemaining(loan: Loan): number {
  return Math.max(0, loan.amount - getLoanTotalPaid(loan));
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

