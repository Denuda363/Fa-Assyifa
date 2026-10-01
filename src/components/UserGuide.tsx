import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Search, 
  ReceiptText, 
  HandCoins, 
  BarChart3, 
  FileSpreadsheet, 
  Download, 
  Smartphone, 
  HelpCircle, 
  ChevronDown, 
  ChevronRight, 
  Lightbulb, 
  CheckCircle2, 
  AlertCircle, 
  Sliders, 
  Printer, 
  X,
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface GuideSection {
  id: string;
  category: 'quickstart' | 'transaction' | 'loan' | 'dashboard' | 'export' | 'settings' | 'backup' | 'pwa' | 'faq';
  categoryLabel: string;
  title: string;
  icon: React.ElementType;
  badge?: string;
  summary: string;
  steps?: { title: string; desc: string; tip?: string }[];
  content?: string[];
  tips?: string[];
  warnings?: string[];
  faqs?: { q: string; a: string }[];
}

export default function UserGuide() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'quickstart': true,
    'transaction': true,
    'loan': true
  });

  const categories = [
    { id: 'all', label: 'Semua Bab' },
    { id: 'quickstart', label: '⚡ Alur Cepat' },
    { id: 'transaction', label: '💳 Transaksi' },
    { id: 'loan', label: '🤝 Pinjaman' },
    { id: 'dashboard', label: '📊 Dashboard' },
    { id: 'export', label: '📑 Ekspor Laporan' },
    { id: 'settings', label: '⚙️ Kategori & Profil' },
    { id: 'backup', label: '💾 Backup Data' },
    { id: 'pwa', label: '📱 Install Ponsel' },
    { id: 'faq', label: '❓ Tanya Jawab (FAQ)' },
  ];

  const guideData: GuideSection[] = [
    {
      id: 'quickstart',
      category: 'quickstart',
      categoryLabel: 'Alur Cepat Operasional',
      title: '1. Panduan Cepat Operasional Harian (SOP Apotek)',
      icon: Sparkles,
      badge: 'Wajib Dibaca',
      summary: 'Alur ringkas 3 langkah operasional harian kasir & pembukuan Apotek Assyifa Farma.',
      steps: [
        {
          title: 'Langkah 1: Pembukaan Shift Pagi',
          desc: 'Buka menu Dashboard untuk melihat sisa saldo kas tunai dan saldo bank hari sebelumnya. Pastikan uang fisik di laci kasir sesuai dengan saldo awal.',
          tip: 'Bila ada selisih saldo awal, catat penyesuaian di menu Transaksi.'
        },
        {
          title: 'Langkah 2: Catat Transaksi Real-Time Sepanjang Hari',
          desc: 'Setiap kali ada penjualan (tunai/transfer) atau pengeluaran operasional (ATK, listrik, bensin, bayar distributor), langsung masukkan ke menu Transaksi.',
          tip: 'Jika ada kasbon atau pinjaman karyawan/owner, masukkan di menu Pinjaman agar otomatis tersinkronisasi ke kas.'
        },
        {
          title: 'Langkah 3: Tutup Buku Shift & Rekonsiliasi Sore/Malam',
          desc: 'Cek Laba Bersih dan Sisa Saldo Kas di Dashboard. Hitung uang fisik di laci dan pastikan cocok dengan kartu "Sisa Saldo Kas (Tunai)".',
          tip: 'Ekspor Excel Laporan Bulanan secara berkala (misal akhir minggu atau akhir bulan) untuk dokumentasi akuntansi.'
        }
      ],
      tips: [
        'Disiplin mencatat setiap pengeluaran sekecil apapun (seperti parkir Rp 2.000 atau air galon) agar saldo di aplikasi selalu akurat 100% dengan fisik uang.',
        'Gunakan fitur kategori yang sudah disediakan agar laporan bulanan tersusun rapi per pos biaya.'
      ]
    },
    {
      id: 'transaction',
      category: 'transaction',
      categoryLabel: 'Pencatatan Kas',
      title: '2. Cara Mencatat Pemasukan & Pengeluaran Kas',
      icon: ReceiptText,
      badge: 'Menu Transaksi',
      summary: 'Langkah lengkap mencatat arus kas masuk dan arus kas keluar baik metode Tunai maupun Transfer Bank.',
      steps: [
        {
          title: 'Mencatat Pemasukan (Omzet Penjualan)',
          desc: '1. Masuk ke menu "Transaksi" -> Klik tombol "+ Tambah Transaksi".\n2. Pada jenis transaksi, pilih tab hijau "Pemasukan".\n3. Pilih Metode Pemasukan:\n   - Cash (Tunai)\n   - TF BJB (Transfer Bank BJB)\n   - TF BRI (Transfer Bank BRI)\n4. Pilih Kategori Pemasukan (misal: Penjualan Umum, Resep, dll).\n5. Masukkan Nominal (Rp) dan Catatan (contoh: "Omzet Shift Pagi").\n6. Klik "Simpan Transaksi".'
        },
        {
          title: 'Mencatat Pengeluaran Tunai (Cash Out)',
          desc: '1. Klik "+ Tambah Transaksi" -> Pilih tab merah "Pengeluaran".\n2. Pilih Metode: "Cash (Tunai)".\n3. Pilih Kategori Pengeluaran yang sesuai:\n   - ATK (Alat Tulis Kantor)\n   - Wifi & Internet\n   - Token Listrik\n   - Bensin Pengiriman\n   - Bayar Distributor Obat\n   - Gajih Karyawan\n   - Permintaan Owner / Keperluan Lainnya\n4. Masukkan Nominal dan Keterangan rinci.\n5. Klik "Simpan Transaksi".'
        },
        {
          title: 'Mencatat Pengeluaran Transfer Bank (Bank Out)',
          desc: '1. Klik "+ Tambah Transaksi" -> Tab "Pengeluaran" -> Pilih Metode: "Transfer".\n2. Pilih Kategori Transfer: TF Distributor, TF Gajih, TF Pinjaman, atau TF Lain2.\n3. Masukkan Nominal dan Catatan (misal: "Transfer Tempo Faktur PT Enseval").\n4. Klik "Simpan Transaksi".'
        },
        {
          title: 'Mengedit atau Menghapus Transaksi',
          desc: 'Cari transaksi yang ingin diperbaiki di tabel transaksi. Klik ikon Pensil (Edit) untuk mengubah tanggal, nominal, atau catatan. Klik ikon Tempat Sampah (Hapus) jika transaksi dobel/keliru.'
        }
      ],
      tips: [
        'Gunakan kolom pencarian di menu Transaksi untuk mencari riwayat berdasarkan catatan, nama distributor, atau kategori.',
        'Gunakan filter metode (Semua, Tunai, TF BJB, TF BRI) untuk mencocokkan mutasi rekening bank dengan pencatatan aplikasi.'
      ]
    },
    {
      id: 'loan',
      category: 'loan',
      categoryLabel: 'Modul Pinjaman & Kasbon',
      title: '3. Pengelolaan Pinjaman & Pembayaran Cicilan',
      icon: HandCoins,
      badge: 'Fitur Baru',
      summary: 'Cara mencatat pinjaman karyawan/owner, mencatat cicilan/pelunasan, serta sinkronisasi otomatis ke kas apotek.',
      steps: [
        {
          title: 'A. Mencatat Pinjaman Baru (Pencairan Dana)',
          desc: '1. Buka menu "Pinjaman" -> Klik tombol "+ Pinjaman Baru".\n2. Pilih Tipe Peminjam:\n   - Karyawan (Kasbon / pinjaman staf apotek)\n   - Owner (Pengambilan dana pemilik usaha)\n3. Masukkan Nama Peminjam (Anda bisa memilih cepat dari saran nama yang sudah ada).\n4. Tentukan Tanggal Pinjaman.\n5. Masukkan Jumlah Pinjaman (Gunakan tombol preset nominal cepat: Rp 50rb, 100rb, 200rb, 500rb, 1jt, dll).\n6. Masukkan Keperluan / Catatan.\n7. Opsi "Sinkronkan ke Pengeluaran Kas":\n   - Jika dicentang (direkomendasikan), dana pinjaman akan otomatis tercatat sebagai pengeluaran kas apotek (Tunai/Transfer).\n   - Saldo kas akan otomatis berkurang sesuai nominal pinjaman.\n8. Klik "Simpan Pinjaman".'
        },
        {
          title: 'B. Mencatat Pembayaran / Angsuran Cicilan',
          desc: '1. Buka menu "Pinjaman" -> Klik tombol "Bayar / Cicil" (atau klik tombol Bayar pada baris pinjaman terkait).\n2. Pilih target pinjaman yang ingin dibayar.\n3. Masukkan Tanggal Pembayaran cicilan.\n4. Tentukan Metode Pembayaran (Tunai / Transfer BJB / Transfer BRI).\n5. Masukkan Nominal Cicilan:\n   - Ingin melunasi langsung? Klik tombol cepat "Lunasi Seluruh Sisa".\n   - Atau ketik nominal angsuran tertentu.\n6. Opsi "Sinkronkan ke Pemasukan Kas":\n   - Jika dicentang, uang cicilan yang diterima akan otomatis tercatat sebagai pemasukan kas apotek.\n7. Klik "Simpan Pembayaran". Status pinjaman akan otomatis berubah menjadi "Lunas" bila sisa hutang telah Rp 0.'
        },
        {
          title: 'C. Melihat Riwayat & Menghapus Pembayaran Keliru',
          desc: 'Pada daftar pinjaman, klik tombol "Riwayat" pada pinjaman yang diinginkan. Anda akan melihat tanggal dan nominal seluruh cicilan yang telah dibayar. Jika ada cicilan yang salah input, klik ikon Hapus pada baris cicilan tersebut.'
        }
      ],
      tips: [
        'Badge merah di menu "Pinjaman" menunjukkan berapa banyak pinjaman yang statusnya masih belum lunas (aktif).',
        'Gunakan filter status "Belum Lunas" dan "Lunas" serta filter "Karyawan" atau "Owner" untuk mempermudah audit piutang.',
        'Pada mode mobile, form pinjaman dan pembayaran dilengkapi tombol simpan di bagian bawah (sticky footer) yang tidak akan terhalang navbar.'
      ]
    },
    {
      id: 'dashboard',
      category: 'dashboard',
      categoryLabel: 'Analisis & Laporan',
      title: '4. Membaca Dashboard & Analisis Finansial',
      icon: BarChart3,
      badge: 'Overview',
      summary: 'Panduan memahami metrik laba rugi, posisi kas, saldo bank, dan grafik arus kas harian.',
      steps: [
        {
          title: 'Memahami Kartu Ringkasan (KPIs)',
          desc: '• Saldo Bulan Kemarin (Saldo Awal): Saldo kas fisik & rekening bank sisa bulan lalu (dapat diinput manual).\n• Pemasukan Bruto: Total seluruh omzet penjualan (Cash + TF BJB + TF BRI).\n• Pengeluaran Tunai: Total biaya yang dibayar menggunakan uang cash di laci kasir.\n• Pengeluaran Transfer: Total biaya yang dibayar melalui transfer rekening bank.\n• Laba Bersih Bulan Ini: (Pemasukan Bruto - Total Pengeluaran Tunai - Total Pengeluaran Transfer).\n• Total Saldo Akhir Kas Kumulatif: (Saldo Bulan Kemarin + Laba Bersih Bulan Ini).'
        },
        {
          title: 'Fitur Input Saldo Bulan Kemarin Secara Manual',
          desc: '1. Pada kartu "Saldo Bulan Kemarin" di Dashboard, klik tombol "Input Saldo Manual".\n2. Anda juga dapat mengaturnya di menu "Pengaturan" -> tab "Saldo Kemarin".\n3. Masukkan total saldo akhir bulan lalu (tersedia tombol cepat +1jt, +5jt, +10jt, dll).\n4. Klik "Simpan Saldo". Saldo ini otomatis masuk ke perhitungan saldo kas berjalan dan langsung tercantum di Laporan Excel Closing & PDF.',
          tip: 'Jika tidak diisi manual, sistem akan otomatis menghitung dari mutasi kas bulan sebelumnya bila ada riwayat transaksi.'
        },
        {
          title: 'Kartu Ringkasan Pinjaman & Piutang',
          desc: 'Menampilkan total pinjaman aktif yang masih beredar pada karyawan dan owner. Memudahkan pengelola melihat berapa modal usaha yang sedang dipinjam.'
        },
        {
          title: 'Grafik Arus Kas Harian',
          desc: 'Grafik batang interaktif yang memvisualisasikan pemasukan (warna emerald) vs pengeluaran (warna rose) per tanggal dalam bulan/rentang waktu terpilih.'
        },
        {
          title: 'Filter Periode: Bulanan, Semua Waktu, & Spesifik',
          desc: '• Mode Bulanan: Memilih bulan dan tahun tertentu (misal: September 2026).\n• Mode Semua Waktu: Menampilkan total seluruh transaksi sejak awal operasional.\n• Mode Spesifik: Memilih rentang tanggal spesifik (misal dari tanggal 1 s/d 15).'
        }
      ]
    },
    {
      id: 'export',
      category: 'export',
      categoryLabel: 'Laporan Akuntansi',
      title: '5. Panduan Ekspor Laporan Excel & PDF',
      icon: FileSpreadsheet,
      badge: 'Laporan Resmi',
      summary: 'Cara mengunduh berkas laporan bulanan terstruktur, rekap tahunan, dan PDF bertanda tangan resmi.',
      steps: [
        {
          title: 'Ekspor Excel Rekap Bulanan Terstruktur (SOP Apotek)',
          desc: '1. Buka menu "Dashboard" -> Pastikan Anda memilih bulan yang diinginkan.\n2. Klik tombol "Report Bulanan".\n3. File spreadsheet rapi akan terunduh dengan format standar pembukuan apotek:\n   - Sheet 1 (Closing Monthly): Baris ke-4 mencantumkan SALDO AKHIR BULAN LALU (kuning) yang masuk ke perhitungan total kas masuk dan saldo akhir.\n   - Sheet 2 (Report Bulanan): Rincian pengeluaran pos operasional, kebutuhan owner, pemasukan, serta Rekapitulasi Sisa Kas Bersih dan Total Saldo Akhir Kumulatif.\n   - Sheet 3 (Detail Transaksi): Rekap seluruh transaksi per baris.'
        },
        {
          title: 'Ekspor Excel Rekap Tahunan (Komparasi 12 Bulan)',
          desc: '1. Pada menu "Dashboard", klik tombol "Report Tahunan".\n2. Pilih tahun yang ingin diunduh (misal: 2026).\n3. Klik "Download Excel".\n4. File Excel akan menyajikan perbandingan kinerja keuangan bulan Januari hingga Desember lengkap dengan saldo awal yang berkesinambungan dan akumulasi tahunan.'
        },
        {
          title: 'Ekspor PDF Ringkasan Keuangan',
          desc: 'Klik tombol "PDF" di menu Dashboard. Dokumen PDF siap cetak akan dibuat otomatis lengkap dengan kop Apotek Assyifa Farma Cideres, baris Saldo Bulan Kemarin, Income Bruto, Rincian Biaya, dan TOTAL SALDO AKHIR KAS (KUMULATIF).'
        },
        {
          title: 'Ekspor Data Transaksi Harian (Excel Detail)',
          desc: 'Klik tombol "Excel" untuk mengunduh seluruh baris transaksi satu per satu beserta jam, kategori, dan catatannya.'
        }
      ],
      tips: [
        'Saldo bulan kemarin yang Anda input manual otomatis tercantum di lembar Closing Excel (baris ke-4) dan PDF, sehingga pembukuan fisik dan laporan bank selalu sinkron.'
      ]
    },
    {
      id: 'settings',
      category: 'settings',
      categoryLabel: 'Kustomisasi Sistem',
      title: '6. Kustomisasi Kategori Kas & Profil Usaha',
      icon: Sliders,
      badge: 'Fleksibilitas',
      summary: 'Cara menyesuaikan pos-pos pengeluaran, kategori pemasukan, dan identitas perusahaan.',
      steps: [
        {
          title: 'Mengubah Identitas Perusahaan / Apotek',
          desc: '1. Buka menu "Profil Perusahaan".\n2. Anda dapat mengubah Nama Apotek, Alamat Lengkap, dan Nomor WhatsApp.\n3. Perubahan profil ini akan langsung tercetak otomatis pada kop laporan PDF dan Excel.'
        },
        {
          title: 'Menambah Kategori Pengeluaran Tunai Kustom',
          desc: '1. Buka menu "Pengaturan" -> Lihat bagian "Kategori Pengeluaran (Tunai)".\n2. Ketik nama kategori baru pada kolom (contoh: "Iuran Kebersihan", "Servis Motor", "Pajak Usaha").\n3. Klik tanda (+) atau tekan Enter. Kategori baru akan langsung muncul di pilihan menu transaksi tunai.'
        },
        {
          title: 'Mengedit Nama Kategori yang Ada',
          desc: '1. Klik ikon Pensil (Edit) pada chip kategori yang ingin diubah.\n2. Ketik nama baru, lalu klik tanda centang (✓) hijau untuk menyimpan.'
        },
        {
          title: 'Menghapus Kategori yang Tidak Dipakai',
          desc: 'Klik tanda silang (✕) merah pada kategori yang ingin dihilangkan.'
        },
        {
          title: 'Menyesuaikan Kategori Pengeluaran Transfer & Pemasukan',
          desc: 'Langkah yang sama berlaku untuk kotak "Kategori Pengeluaran (Transfer)" dan "Kategori Pemasukan".'
        }
      ]
    },
    {
      id: 'backup',
      category: 'backup',
      categoryLabel: 'Keamanan Data',
      title: '7. Backup & Restore Cadangan Data',
      icon: Download,
      badge: 'Pencegahan',
      summary: 'Menjaga keamanan data pembukuan dengan mengunduh file cadangan offline secara berkala.',
      steps: [
        {
          title: 'Cara Backup Data (Unduh Cadangan)',
          desc: '1. Buka menu "Pengaturan" -> Cari bagian "Backup & Restore".\n2. Klik tombol "Backup Data".\n3. Sebuah file dengan format `backup_profitflow_YYYY-MM-DD.json` akan otomatis terunduh ke perangkat Anda.\n4. Simpan file ini di tempat yang aman (misalnya di Google Drive, flashdisk, atau email pribadi).'
        },
        {
          title: 'Cara Restore Data (Memulihkan Cadangan)',
          desc: '1. Klik tombol "Restore Data".\n2. Pilih file `.json` cadangan yang sebelumnya pernah Anda unduh.\n3. Sistem akan memvalidasi dan memulihkan seluruh data transaksi ke database.'
        }
      ],
      warnings: [
        'Disarankan melakukan backup minimal seminggu sekali atau setiap akhir bulan setelah tutup buku.',
        'Saat melakukan restore data, transaksi dari file cadangan akan disinkronkan ke database.'
      ]
    },
    {
      id: 'pwa',
      category: 'pwa',
      categoryLabel: 'Aplikasi Ponsel',
      title: '8. Pasang Aplikasi di Ponsel & Komputer (PWA)',
      icon: Smartphone,
      badge: 'Mudah Diakses',
      summary: 'Menjadikan ProfitFlow seperti aplikasi bawaan (APK/App) tanpa perlu membuka browser berulang kali.',
      steps: [
        {
          title: 'Di Ponsel Android (Google Chrome)',
          desc: '1. Buka web aplikasi di Google Chrome.\n2. Klik tombol "Install Aplikasi" yang muncul di pojok atas atau klik menu titik tiga (⋮) di kanan atas browser Chrome.\n3. Pilih "Tambahkan ke Layar Utama" (Add to Home screen) atau "Install Aplikasi".\n4. Ikon ProfitFlow akan muncul di layar utama ponsel dan dapat dibuka cepat layaknya aplikasi native.'
        },
        {
          title: 'Di iPhone / iPad (Safari)',
          desc: '1. Buka web aplikasi menggunakan browser Safari.\n2. Klik tombol "Bagikan" (ikon kotak dengan panah ke atas) di bilah bawah Safari.\n3. Gulir ke bawah dan pilih "Tambahkan ke Layar Utama" (Add to Home Screen).\n4. Beri nama dan klik "Tambah" (Add) di kanan atas.'
        },
        {
          title: 'Di Komputer / Laptop (Chrome / Edge)',
          desc: 'Klik ikon install (layar monitor dengan panah ke bawah) di bagian bilah URL browser Chrome/Edge, lalu klik "Install".'
        }
      ],
      tips: [
        'Aplikasi PWA bekerja lebih cepat, tidak memiliki bilah URL browser yang memakan layar, dan otomatis menyesuaikan tampilan ponsel secara optimal.'
      ]
    },
    {
      id: 'faq',
      category: 'faq',
      categoryLabel: 'Tanya Jawab',
      title: '9. Tanya Jawab & Solusi Kendala (FAQ)',
      icon: HelpCircle,
      badge: 'Solusi Cepat',
      summary: 'Jawaban atas kendala yang paling sering dihadapi oleh staf dan pengelola apotek.',
      faqs: [
        {
          q: 'Mengapa saldo kas tunai di aplikasi berbeda dengan uang fisik di laci?',
          a: 'Periksa beberapa hal berikut: (1) Apakah ada pengeluaran kecil tunai (seperti parkir, bensin, konsumsi, plastik) yang lupa dicatat? (2) Apakah ada kasbon karyawan yang uangnya diambil dari kas tapi belum dicatat di menu Pinjaman? (3) Apakah ada pembayaran piutang/pinjaman dari karyawan yang uangnya sudah masuk laci tapi belum diinput di menu Pinjaman?'
        },
        {
          q: 'Apa bedanya input transaksi pengeluaran biasa dengan input pinjaman?',
          a: 'Transaksi pengeluaran biasa (seperti listrik/ATK) adalah biaya habis pakai yang langsung mengurangi laba bersih. Sedangkan Pinjaman adalah piutang (uang apotek yang dipinjam dan akan dikembalikan). Jika memilih opsi sinkronisasi kas, uang kas tetap berkurang namun tercatat sebagai piutang di kartu Pinjaman.'
        },
        {
          q: 'Bagaimana jika tombol Simpan di layar HP tertutup navbar atau keyboard?',
          a: 'Form modal pinjaman dan transaksi ProfitFlow telah dirancang khusus untuk mobile: tombol aksi (Batal & Simpan) selalu menempel tetap di bagian bawah layar (sticky footer) dengan ruang aman di atas navbar navigasi. Form juga dapat di-scroll dengan leluasa.'
        },
        {
          q: 'Apakah data pembukuan hilang jika saya ganti HP atau komputer?',
          a: 'Tidak hilang! Seluruh data transaksi, pinjaman, dan profil tersimpan secara otomatis dan aman di cloud server (Google Firebase Firestore). Anda cukup membuka link aplikasi di HP atau komputer baru dengan akun yang sama.'
        },
        {
          q: 'Apakah saya bisa mencetak laporan bulanan untuk arsip fisik?',
          a: 'Ya, Anda bisa mengunduh berkas "Rekap Bulanan (Excel)" atau "Ekspor PDF". Keduanya sudah diformat dengan tata letak siap cetak ukuran kertas A4/Folio lengkap dengan identitas apotek dan kolom tanda tangan pengelola.'
        }
      ]
    }
  ];

  const filteredGuides = useMemo(() => {
    return guideData.filter(item => {
      const matchCategory = selectedCategory === 'all' || item.category === selectedCategory;
      if (!matchCategory) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const inTitle = item.title.toLowerCase().includes(q);
      const inSummary = item.summary.toLowerCase().includes(q);
      const inSteps = item.steps?.some(s => s.title.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q) || (s.tip && s.tip.toLowerCase().includes(q)));
      const inTips = item.tips?.some(t => t.toLowerCase().includes(q));
      const inFaqs = item.faqs?.some(f => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q));

      return inTitle || inSummary || inSteps || inTips || inFaqs;
    });
  }, [selectedCategory, searchQuery]);

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const expandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    guideData.forEach(item => {
      allExpanded[item.id] = true;
    });
    setExpandedSections(allExpanded);
  };

  const collapseAll = () => {
    setExpandedSections({});
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-indigo-950/70 via-neutral-900/90 to-neutral-900/90 backdrop-blur-2xl border border-indigo-500/20 shadow-2xl p-6 sm:p-8 rounded-[2rem] relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-xl shadow-indigo-500/25 shrink-0">
              <BookOpen className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                  Buku Petunjuk Resmi
                </span>
                <span className="text-xs text-neutral-400">Versi 2.0 • Apotek Assyifa Farma</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1.5">
                Panduan Lengkap Penggunaan
              </h2>
              <p className="mt-1 text-sm text-neutral-300 max-w-2xl leading-relaxed">
                Panduan terstruktur dan SOP operasional aplikasi ProfitFlow untuk kasir, staf apoteker, dan pemilik usaha. Dilengkapi langkah demi langkah, tips akuntansi, serta tanya jawab.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-neutral-800/80 hover:bg-neutral-800 text-neutral-200 hover:text-white rounded-xl text-xs font-semibold border border-neutral-700/80 shadow-sm transition-all focus:outline-none"
              title="Cetak panduan ini untuk SOP cetak kasir"
            >
              <Printer className="w-4 h-4 text-sky-400" />
              <span>Cetak Panduan</span>
            </button>
          </div>
        </div>

        {/* Quick Search & Filter Controls */}
        <div className="mt-6 pt-6 border-t border-neutral-800/80 grid grid-cols-1 md:grid-cols-12 gap-3 relative z-10">
          <div className="md:col-span-8 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari panduan... (contoh: pinjaman, cicilan, excel, backup, kas, owner)"
              className="w-full pl-10 pr-10 py-2.5 bg-neutral-950/60 border border-neutral-700/80 focus:border-indigo-500 rounded-xl text-sm text-white placeholder-neutral-500 outline-none transition-all shadow-inner focus:ring-2 focus:ring-indigo-500/20"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="md:col-span-4 flex items-center justify-end gap-2">
            <button
              onClick={expandAll}
              className="px-3 py-2 bg-neutral-800/60 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-xl text-xs font-medium border border-neutral-700/60 transition-colors"
            >
              Buka Semua
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-2 bg-neutral-800/60 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-xl text-xs font-medium border border-neutral-700/60 transition-colors"
            >
              Tutup Semua
            </button>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="mt-4 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none relative z-10">
          {categories.map(cat => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-neutral-900/60 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/80 border border-neutral-800'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Guide List Accordion */}
      <div className="space-y-4">
        {filteredGuides.length === 0 ? (
          <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-12 text-center">
            <AlertCircle className="w-12 h-12 text-amber-400/80 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">Tidak Ditemukan Panduan</h3>
            <p className="text-sm text-neutral-400 mt-1 max-w-md mx-auto">
              Tidak ada topik panduan yang sesuai dengan kata kunci "{searchQuery}". Coba kata kunci lain atau pilih "Semua Bab".
            </p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
              className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/20"
            >
              Reset Pencarian
            </button>
          </div>
        ) : (
          filteredGuides.map((section, idx) => {
            const Icon = section.icon;
            const isExpanded = !!expandedSections[section.id];

            return (
              <div
                key={section.id}
                id={`guide-${section.id}`}
                className="bg-neutral-900/50 backdrop-blur-xl border border-neutral-800/80 rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg transition-all hover:border-neutral-700/80"
              >
                {/* Header (Accordion Trigger) */}
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  className="w-full p-5 sm:p-6 text-left flex items-start sm:items-center justify-between gap-4 transition-colors hover:bg-neutral-800/30"
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-neutral-800/90 border border-neutral-700/70 flex items-center justify-center text-indigo-400 shrink-0 shadow-sm mt-0.5 sm:mt-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
                          {section.categoryLabel}
                        </span>
                        {section.badge && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">
                            {section.badge}
                          </span>
                        )}
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-white tracking-tight mt-0.5">
                        {section.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-neutral-400 mt-1 line-clamp-1 sm:line-clamp-none">
                        {section.summary}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 p-2 rounded-xl bg-neutral-800/60 text-neutral-400 hover:text-white transition-colors">
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-indigo-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5" />
                    )}
                  </div>
                </button>

                {/* Content Body */}
                {isExpanded && (
                  <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-neutral-800/70 space-y-6">
                    {/* Steps List */}
                    {section.steps && section.steps.length > 0 && (
                      <div className="space-y-4 pt-2">
                        {section.steps.map((step, sIdx) => (
                          <div
                            key={sIdx}
                            className="bg-neutral-950/50 border border-neutral-800/80 rounded-2xl p-4 sm:p-5 relative"
                          >
                            <div className="flex items-start gap-3">
                              <span className="w-6 h-6 rounded-lg bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                                {sIdx + 1}
                              </span>
                              <div className="flex-1 space-y-2">
                                <h4 className="text-sm font-bold text-white tracking-tight">
                                  {step.title}
                                </h4>
                                <div className="text-xs sm:text-sm text-neutral-300 whitespace-pre-line leading-relaxed font-sans">
                                  {step.desc}
                                </div>
                                {step.tip && (
                                  <div className="mt-2.5 p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-start gap-2.5 text-xs text-sky-300">
                                    <Lightbulb className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                                    <span><strong>Tips:</strong> {step.tip}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Pro Tips Section */}
                    {section.tips && section.tips.length > 0 && (
                      <div className="p-4 sm:p-5 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 space-y-2.5">
                        <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
                          <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                          <span>Tips Tambahan & Praktik Terbaik</span>
                        </div>
                        <ul className="space-y-2">
                          {section.tips.map((tip, tIdx) => (
                            <li key={tIdx} className="text-xs sm:text-sm text-neutral-300 flex items-start gap-2">
                              <span className="text-indigo-400 font-bold">•</span>
                              <span className="leading-relaxed">{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Warnings Section */}
                    {section.warnings && section.warnings.length > 0 && (
                      <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                        <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                          <AlertCircle className="w-4 h-4 text-amber-400" />
                          <span>Perhatian Penting</span>
                        </div>
                        <ul className="space-y-1.5">
                          {section.warnings.map((warn, wIdx) => (
                            <li key={wIdx} className="text-xs sm:text-sm text-amber-300/90 flex items-start gap-2">
                              <span className="text-amber-400 font-bold">•</span>
                              <span className="leading-relaxed">{warn}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* FAQ Items */}
                    {section.faqs && section.faqs.length > 0 && (
                      <div className="space-y-3 pt-2">
                        {section.faqs.map((faq, fIdx) => (
                          <div
                            key={fIdx}
                            className="bg-neutral-950/60 border border-neutral-800/80 rounded-2xl p-4 sm:p-5 space-y-2"
                          >
                            <h4 className="text-sm font-bold text-white flex items-start gap-2">
                              <span className="text-indigo-400 font-bold">Q:</span>
                              <span>{faq.q}</span>
                            </h4>
                            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed pl-5 font-sans">
                              <span className="text-emerald-400 font-bold mr-1.5">Jawab:</span>
                              {faq.a}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Support Card */}
      <div className="bg-neutral-900/30 border border-neutral-800/60 rounded-2xl p-6 text-center text-xs text-neutral-400 space-y-1">
        <p className="font-semibold text-neutral-300">
          Apotek Assyifa Farma Cideres — ProfitFlow Management System
        </p>
        <p>
          Butuh penyesuaian pos akuntansi atau bantuan teknis? Hubungi tim pengelola atau administrator sistem.
        </p>
      </div>
    </div>
  );
}
