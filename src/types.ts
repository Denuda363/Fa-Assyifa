export interface Transaction {
  id: string;
  type: 'income' | 'outcome';
  method: 'cash' | 'tf_bjb' | 'tf_bri' | 'tf'; 
  category: string;
  amount: number;
  date: string;
  notes: string;
  timestamp: number;
}

export interface CompanyProfile {
  name: string;
  address: string;
  whatsapp: string;
}

export const DEFAULT_PROFILE: CompanyProfile = {
  name: "Apotek Assyifa Farma Cideres",
  address: "Jl. Raya Cideres-Kadipaten No. 45, Cideres, Majalengka",
  whatsapp: ""
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
  'Pajak',
  'Bayar Distributor',
  'Gajih Karyawan',
  'Permintaan Owner',
  'Lainnya'
];

export const OUTCOME_TF_CATEGORIES = [
  'TF Distributor',
  'TF Gajih',
  'TF Lain2'
];

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}
