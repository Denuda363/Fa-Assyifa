import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Transaction, CompanyProfile, formatRupiah } from '../types';
import { format } from 'date-fns';

interface ExportData {
  transactions: Transaction[];
  profile: CompanyProfile;
  monthYear: string;
  summary: {
    incomeBruto: number;
    outcomeTotal: number;
    profitPerusahaan: number;
    profitOwner: number;
    incomeNeto: number;
  };
}

export const exportToPDF = (data: ExportData) => {
  const doc = new jsPDF();
  const { profile, transactions, monthYear, summary } = data;

  // Header / Kop Surat
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(profile.name, 14, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(profile.address, 14, 26);
  if (profile.whatsapp) {
    doc.text(`WhatsApp: ${profile.whatsapp}`, 14, 32);
  }
  
  doc.line(14, 36, 196, 36);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`Laporan Keuangan - ${monthYear}`, 14, 46);

  // Summary section
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  let yPos = 54;
  doc.text(`Income Bruto: ${formatRupiah(summary.incomeBruto)}`, 14, yPos); yPos += 6;
  doc.text(`Total Pengeluaran: ${formatRupiah(summary.outcomeTotal)}`, 14, yPos); yPos += 6;
  doc.text(`Profit Perusahaan (15%): ${formatRupiah(summary.profitPerusahaan)}`, 14, yPos); yPos += 6;
  doc.text(`Profit Owner (20% dari Profit Perusahaan): ${formatRupiah(summary.profitOwner)}`, 14, yPos); yPos += 6;
  doc.setFont('helvetica', 'bold');
  doc.text(`Income Neto: ${formatRupiah(summary.incomeNeto)}`, 14, yPos); yPos += 10;

  // Transactions Table
  const tableData = transactions.map((t, index) => [
    index + 1,
    format(new Date(t.date), 'dd/MM/yyyy'),
    t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
    t.category,
    t.method.toUpperCase(),
    t.type === 'income' ? formatRupiah(t.amount) : '-',
    t.type === 'outcome' ? formatRupiah(t.amount) : '-',
    t.notes || '-'
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['No', 'Tanggal', 'Tipe', 'Kategori', 'Metode', 'Pemasukan', 'Pengeluaran', 'Keterangan']],
    body: tableData,
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [41, 128, 185] },
  });

  doc.save(`Laporan_Keuangan_${profile.name.replace(/\\s+/g, '_')}_${monthYear}.pdf`);
};

export const exportToExcel = (data: ExportData) => {
  const { profile, transactions, monthYear, summary } = data;

  const wb = XLSX.utils.book_new();

  // Create summary sheet
  const summaryData = [
    [profile.name],
    [profile.address],
    [`WhatsApp: ${profile.whatsapp}`],
    [],
    [`Laporan Keuangan - ${monthYear}`],
    [],
    ['Ringkasan', 'Nilai'],
    ['Income Bruto', formatRupiah(summary.incomeBruto)],
    ['Total Pengeluaran', formatRupiah(summary.outcomeTotal)],
    ['Profit Perusahaan (15%)', formatRupiah(summary.profitPerusahaan)],
    ['Profit Owner (20% dari Profit)', formatRupiah(summary.profitOwner)],
    ['Income Neto', formatRupiah(summary.incomeNeto)],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan');

  // Create transactions sheet
  const txHeader = ['No', 'Tanggal', 'Tipe', 'Kategori', 'Metode', 'Pemasukan', 'Pengeluaran', 'Keterangan'];
  const txData = transactions.map((t, index) => [
    index + 1,
    format(new Date(t.date), 'dd/MM/yyyy'),
    t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
    t.category,
    t.method.toUpperCase(),
    t.type === 'income' ? formatRupiah(t.amount) : '-',
    t.type === 'outcome' ? formatRupiah(t.amount) : '-',
    t.notes || '-'
  ]);

  const wsTx = XLSX.utils.aoa_to_sheet([txHeader, ...txData]);
  
  // Auto-size columns (rough approximation)
  const cols = txHeader.map(h => ({ wch: Math.max(h.length, 12) }));
  wsTx['!cols'] = cols;

  XLSX.utils.book_append_sheet(wb, wsTx, 'Transaksi');

  XLSX.writeFile(wb, `Laporan_Keuangan_${profile.name.replace(/\\s+/g, '_')}_${monthYear}.xlsx`);
};
