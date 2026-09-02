import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Transaction, CompanyProfile, formatRupiah } from '../types';
import { format } from 'date-fns';

export interface BreakdownItem {
  name: string;
  amount: number;
}

export interface DetailedSummary {
  incomeBruto: number;
  incomeBreakdown: BreakdownItem[];
  pengeluaranCashTotal: number;
  pengeluaranCashBreakdown: BreakdownItem[];
  pengeluaranTfTotal: number;
  pengeluaranTfBreakdown: BreakdownItem[];
  profitPerusahaan: number;
  profitOwner: number;
  incomeNeto: number;
}

export interface ExportData {
  transactions: Transaction[];
  profile: CompanyProfile;
  monthYear: string;
  summary: DetailedSummary;
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
  
  let yPos = 54;
  
  doc.setFont('helvetica', 'bold');
  doc.text(`Income Bruto`, 14, yPos); 
  doc.text(formatRupiah(summary.incomeBruto), 100, yPos);
  yPos += 6;
  
  doc.setFont('helvetica', 'normal');
  summary.incomeBreakdown.forEach(item => {
    doc.text(`- ${item.name}`, 18, yPos);
    doc.text(formatRupiah(item.amount), 100, yPos);
    yPos += 6;
  });

  doc.setFont('helvetica', 'bold');
  doc.text(`Pengeluaran Cash`, 14, yPos);
  doc.text(formatRupiah(summary.pengeluaranCashTotal), 100, yPos);
  yPos += 6;

  doc.setFont('helvetica', 'normal');
  summary.pengeluaranCashBreakdown.forEach(item => {
    doc.text(`- ${item.name}`, 18, yPos);
    doc.text(formatRupiah(item.amount), 100, yPos);
    yPos += 6;
  });

  doc.setFont('helvetica', 'bold');
  doc.text(`Pengeluaran TF`, 14, yPos);
  doc.text(formatRupiah(summary.pengeluaranTfTotal), 100, yPos);
  yPos += 6;

  doc.setFont('helvetica', 'normal');
  summary.pengeluaranTfBreakdown.forEach(item => {
    doc.text(`- ${item.name}`, 18, yPos);
    doc.text(formatRupiah(item.amount), 100, yPos);
    yPos += 6;
  });

  doc.setFont('helvetica', 'bold');
  doc.text(`Profit Perusahaan 15%`, 14, yPos);
  doc.text(formatRupiah(summary.profitPerusahaan), 100, yPos);
  yPos += 6;

  doc.text(`Profit Owner`, 14, yPos);
  doc.text(formatRupiah(summary.profitOwner), 100, yPos);
  yPos += 6;

  doc.text(`Income Neto`, 14, yPos);
  doc.text(formatRupiah(summary.incomeNeto), 100, yPos);
  yPos += 10;

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
  const summaryData: any[][] = [
    [profile.name],
    [profile.address],
    [`WhatsApp: ${profile.whatsapp}`],
    [],
    [`Laporan Keuangan - ${monthYear}`],
    [],
    ['Ringkasan', 'Nilai'],
    ['Income Bruto', formatRupiah(summary.incomeBruto)]
  ];

  summary.incomeBreakdown.forEach(item => {
    summaryData.push([` - ${item.name}`, formatRupiah(item.amount)]);
  });

  summaryData.push(['Pengeluaran Cash', formatRupiah(summary.pengeluaranCashTotal)]);
  summary.pengeluaranCashBreakdown.forEach(item => {
    summaryData.push([` - ${item.name}`, formatRupiah(item.amount)]);
  });

  summaryData.push(['Pengeluaran TF', formatRupiah(summary.pengeluaranTfTotal)]);
  summary.pengeluaranTfBreakdown.forEach(item => {
    summaryData.push([` - ${item.name}`, formatRupiah(item.amount)]);
  });

  summaryData.push(['Profit Perusahaan 15%', formatRupiah(summary.profitPerusahaan)]);
  summaryData.push(['Profit Owner', formatRupiah(summary.profitOwner)]);
  summaryData.push(['Income Neto', formatRupiah(summary.incomeNeto)]);

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
