import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx-js-style';
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

  // Helper for generating summary data
  const createSummarySheetData = (p: CompanyProfile, title: string, s: DetailedSummary) => {
    const summaryData: any[][] = [
      [p.name],
      [p.address],
      [`WhatsApp: ${p.whatsapp}`],
      [],
      [title],
      [],
      ['Ringkasan', 'Nilai'],
      ['Income Bruto', formatRupiah(s.incomeBruto)]
    ];

    s.incomeBreakdown.forEach(item => {
      summaryData.push([` - ${item.name}`, formatRupiah(item.amount)]);
    });

    summaryData.push(['Pengeluaran Cash', formatRupiah(s.pengeluaranCashTotal)]);
    s.pengeluaranCashBreakdown.forEach(item => {
      summaryData.push([` - ${item.name}`, formatRupiah(item.amount)]);
    });

    summaryData.push(['Pengeluaran TF', formatRupiah(s.pengeluaranTfTotal)]);
    s.pengeluaranTfBreakdown.forEach(item => {
      summaryData.push([` - ${item.name}`, formatRupiah(item.amount)]);
    });

    summaryData.push(['Profit Perusahaan 15%', formatRupiah(s.profitPerusahaan)]);
    summaryData.push(['Profit Owner', formatRupiah(s.profitOwner)]);
    summaryData.push(['Income Neto', formatRupiah(s.incomeNeto)]);
    return summaryData;
  };

  const styleSummarySheet = (ws: XLSX.WorkSheet, p: CompanyProfile, title: string) => {
    for (const cell in ws) {
      if (cell[0] === '!') continue;
      const val = ws[cell].v;
      if (!ws[cell].s) ws[cell].s = {};
      if (val === 'Ringkasan' || val === 'Nilai') {
        ws[cell].s.font = { bold: true };
      }
      if (val === p.name) {
        ws[cell].s.font = { bold: true, sz: 14 };
      }
      if (val === title) {
        ws[cell].s.font = { bold: true, sz: 12 };
      }
    }
    ws['!cols'] = [{ wch: 30 }, { wch: 25 }];
  };

  // 1. Create main summary sheet
  const mainTitle = `Laporan Keuangan - ${monthYear}`;
  const wsSummary = XLSX.utils.aoa_to_sheet(createSummarySheetData(profile, mainTitle, summary));
  styleSummarySheet(wsSummary, profile, mainTitle);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan');

  // 2. Create transactions sheet
  const txHeader = ['No', 'Tanggal', 'Tipe', 'Kategori', 'Metode', 'Pemasukan', 'Pengeluaran', 'Keterangan'];
  let totalPemasukan = 0;
  let totalPengeluaran = 0;
  
  const txData = transactions.map((t, index) => {
    if (t.type === 'income') totalPemasukan += t.amount;
    if (t.type === 'outcome') totalPengeluaran += t.amount;
    return [
      index + 1,
      format(new Date(t.date), 'dd/MM/yyyy'),
      t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
      t.category,
      t.method.toUpperCase(),
      t.type === 'income' ? formatRupiah(t.amount) : '-',
      t.type === 'outcome' ? formatRupiah(t.amount) : '-',
      t.notes || '-'
    ];
  });

  // Add total row
  txData.push([
    '', '', '', '', 'TOTAL',
    formatRupiah(totalPemasukan),
    formatRupiah(totalPengeluaran),
    ''
  ]);

  const wsTx = XLSX.utils.aoa_to_sheet([txHeader, ...txData]);
  
  // Auto-size columns based on content
  const maxColsLength = txHeader.map(h => h.length);
  txData.forEach(row => {
    row.forEach((cell, i) => {
      const valStr = cell ? cell.toString() : '';
      if (valStr.length > maxColsLength[i]) {
        maxColsLength[i] = valStr.length;
      }
    });
  });
  wsTx['!cols'] = maxColsLength.map(w => ({ wch: w + 2 }));

  // Style the transactions sheet (borders, bold header, bold totals)
  const borderAll = {
    top: { style: 'thin' },
    bottom: { style: 'thin' },
    left: { style: 'thin' },
    right: { style: 'thin' }
  };

  for (const cell in wsTx) {
    if (cell[0] === '!') continue;
    const rowNumber = parseInt(cell.match(/[0-9]+/)?.[0] || "0");
    
    if (!wsTx[cell].s) wsTx[cell].s = {};
    wsTx[cell].s.border = borderAll;
    
    // Format Header
    if (rowNumber === 1) {
      wsTx[cell].s.font = { bold: true, color: { rgb: "FFFFFF" } };
      wsTx[cell].s.fill = { fgColor: { rgb: "2980B9" } };
      wsTx[cell].s.alignment = { horizontal: 'center' };
    }
    
    // Format Totals Row (Last Row)
    if (rowNumber === txData.length + 1) { // +1 for header
      wsTx[cell].s.font = { bold: true };
      if (wsTx[cell].v === 'TOTAL') {
        wsTx[cell].s.alignment = { horizontal: 'right' };
      }
    }
  }

  XLSX.utils.book_append_sheet(wb, wsTx, 'Transaksi');

  // 3. Create per-day summary sheets
  const calculateDetailedSummary = (txs: Transaction[]): DetailedSummary => {
    let incomeBruto = 0;
    const incomeMap = new Map<string, number>();
    let pengeluaranCashTotal = 0;
    const pengeluaranCashMap = new Map<string, number>();
    let pengeluaranTfTotal = 0;
    const pengeluaranTfMap = new Map<string, number>();

    txs.forEach(t => {
      if (t.type === 'income') {
        incomeBruto += t.amount;
        incomeMap.set(t.category, (incomeMap.get(t.category) || 0) + t.amount);
      } else {
        if (t.method === 'cash') {
          pengeluaranCashTotal += t.amount;
          pengeluaranCashMap.set(t.category, (pengeluaranCashMap.get(t.category) || 0) + t.amount);
        } else {
          pengeluaranTfTotal += t.amount;
          pengeluaranTfMap.set(t.category, (pengeluaranTfMap.get(t.category) || 0) + t.amount);
        }
      }
    });

    const incomeNeto = incomeBruto - (pengeluaranCashTotal + pengeluaranTfTotal);
    const profitPerusahaan = incomeNeto * 0.15;
    const profitOwner = incomeNeto * 0.20;

    return {
      incomeBruto,
      incomeBreakdown: Array.from(incomeMap.entries()).map(([name, amount]) => ({ name, amount })),
      pengeluaranCashTotal,
      pengeluaranCashBreakdown: Array.from(pengeluaranCashMap.entries()).map(([name, amount]) => ({ name, amount })),
      pengeluaranTfTotal,
      pengeluaranTfBreakdown: Array.from(pengeluaranTfMap.entries()).map(([name, amount]) => ({ name, amount })),
      incomeNeto,
      profitPerusahaan,
      profitOwner
    };
  };

  const txsByDay = new Map<string, Transaction[]>();
  transactions.forEach(t => {
    const dateKey = t.date;
    if (!txsByDay.has(dateKey)) {
      txsByDay.set(dateKey, []);
    }
    txsByDay.get(dateKey)!.push(t);
  });

  const sortedDates = Array.from(txsByDay.keys()).sort();
  const usedSheetNames = new Set<string>(['Ringkasan', 'Transaksi']);

  sortedDates.forEach(dateStr => {
    const dayTxs = txsByDay.get(dateStr)!;
    const daySummary = calculateDetailedSummary(dayTxs);
    const dateObj = new Date(dateStr);
    
    let sheetName = format(dateObj, 'd');
    if (usedSheetNames.has(sheetName)) {
       sheetName = format(dateObj, 'd-MMM');
    }
    usedSheetNames.add(sheetName);

    const title = `Laporan Keuangan - Tanggal ${format(dateObj, 'dd/MM/yyyy')}`;
    const daySummaryData = createSummarySheetData(profile, title, daySummary);
    const wsDay = XLSX.utils.aoa_to_sheet(daySummaryData);
    styleSummarySheet(wsDay, profile, title);
    
    XLSX.utils.book_append_sheet(wb, wsDay, sheetName);
  });

  XLSX.writeFile(wb, `Laporan_Keuangan_${profile.name.replace(/\s+/g, '_')}_${monthYear}.xlsx`);
};
