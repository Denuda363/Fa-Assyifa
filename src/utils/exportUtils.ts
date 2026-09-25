import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx-js-style';
import { Transaction, CompanyProfile, formatRupiah, OUTCOME_CASH_CATEGORIES, OUTCOME_TF_CATEGORIES, Loan } from '../types';
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
  loans?: Loan[];
}

export const MONTH_NAMES_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember'
];

const ACCOUNTING_FMT = '_("Rp"* #,##0.00_);_("Rp"* \\(#,##0.00\\);_("Rp"* "-"_);_(@_)';
const ACCOUNTING_NO_DEC = '_("Rp"* #,##0_);_("Rp"* \\(#,##0\\);_("Rp"* "-"_);_(@_)';

// Common border definitions
const borderBlack = {
  top: { style: 'thin', color: { rgb: '000000' } },
  bottom: { style: 'thin', color: { rgb: '000000' } },
  left: { style: 'thin', color: { rgb: '000000' } },
  right: { style: 'thin', color: { rgb: '000000' } }
};

const borderThin = {
  top: { style: 'thin', color: { rgb: 'D9D9D9' } },
  bottom: { style: 'thin', color: { rgb: 'D9D9D9' } },
  left: { style: 'thin', color: { rgb: 'D9D9D9' } },
  right: { style: 'thin', color: { rgb: 'D9D9D9' } }
};

const borderSubtotal = {
  top: { style: 'thin', color: { rgb: '000000' } },
  bottom: { style: 'double', color: { rgb: '000000' } },
  left: { style: 'thin', color: { rgb: '000000' } },
  right: { style: 'thin', color: { rgb: '000000' } }
};

const borderSection = {
  top: { style: 'thin', color: { rgb: 'B0C4DE' } },
  bottom: { style: 'thin', color: { rgb: 'B0C4DE' } },
  left: { style: 'thin', color: { rgb: 'B0C4DE' } },
  right: { style: 'thin', color: { rgb: 'B0C4DE' } }
};

// ==========================================
// 1. PDF EXPORT
// ==========================================
export const exportToPDF = (data: ExportData) => {
  const doc = new jsPDF();
  const { profile, transactions, monthYear, summary } = data;

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

  doc.save(`Laporan_Keuangan_${profile.name.replace(/\s+/g, '_')}_${monthYear}.pdf`);
};

// ==========================================
// 2. CLOSING MONTHLY SHEET BUILDER (Image Format)
// ==========================================
export interface ClosingMonthlyStats {
  incomeBruto: number;
  opsExpenses: number;
  ownerExpenses: number;
  totalExpenses: number;
  shareProfitOwner: number;
  gajiTotal: number;
}

export const buildClosingMonthlySheet = (
  profile: CompanyProfile,
  year: number,
  monthIndex: number, // 0 to 11
  transactions: Transaction[],
  startingBalance: number,
  loans: Loan[] = []
): { ws: XLSX.WorkSheet; endingBalance: number; stats: ClosingMonthlyStats } => {
  const ws: XLSX.WorkSheet = {};
  const merges: XLSX.Range[] = [];
  const yy = String(year).slice(-2);
  const currentMonthName = MONTH_NAMES_ID[monthIndex];
  const prevMonthName = monthIndex === 0 
    ? `Desember ${parseInt(yy) - 1}` 
    : MONTH_NAMES_ID[monthIndex - 1];

  const setCell = (r: number, c: number, cell: any) => {
    const ref = XLSX.utils.encode_cell({ r, c });
    ws[ref] = cell;
  };

  // Helper for empty bordered cell
  const emptyCell = () => ({
    v: '',
    t: 's',
    s: { border: borderBlack }
  });

  // Calculate transaction categories
  const getCatSum = (keywords: string[]) => {
    return transactions
      .filter(t => t.type === 'outcome' && keywords.some(k => (t.category || '').toLowerCase().includes(k.toLowerCase())))
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const incomeBruto = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalRawOutcomes = transactions
    .filter(t => t.type === 'outcome')
    .reduce((sum, t) => sum + t.amount, 0);

  const netIncome = Math.max(0, incomeBruto - totalRawOutcomes);
  const shareProfitOwner = Math.round(netIncome * 0.15 * 0.20) || Math.round(netIncome * 0.03) || getCatSum(['share profit', 'profit owner']);

  const gajiAmount = getCatSum(['gaji', 'gajih']);
  const uangMakanAmount = getCatSum(['uang makan', 'makan']);
  const distributorAmount = getCatSum(['distributor']);
  const dinkesAmount = getCatSum(['dinkes']);
  const bpomAmount = getCatSum(['bpom']);

  const listrikAmount = getCatSum(['listrik', 'token']);
  const airAmount = getCatSum(['air']);
  const perumAmount = getCatSum(['perum', 'mes']);
  const sampahAmount = getCatSum(['sampah']);
  const keamananAmount = getCatSum(['keamanan']);
  const rtAmount = getCatSum(['kebutuhan rt', 'rt', 'sabun']);
  const atkAmount = getCatSum(['atk']);
  const propertyAmount = getCatSum(['property', 'printer', 'lemari', 'inventaris']);
  const bensinAmount = getCatSum(['bensin']);

  // Owner loans in this month
  const ownerLoanDisbursed = loans
    .filter(l => l.type === 'owner')
    .filter(l => {
      const d = new Date(l.date);
      return d.getFullYear() === year && d.getMonth() === monthIndex;
    })
    .reduce((sum, l) => sum + l.amount, 0);

  const ownerPaymentsInMonth = loans
    .filter(l => l.type === 'owner')
    .flatMap(l => l.payments || [])
    .filter(p => {
      const d = new Date(p.date);
      return d.getFullYear() === year && d.getMonth() === monthIndex;
    })
    .reduce((sum, p) => sum + p.amount, 0);

  const pinjamanOwner = Math.max(ownerLoanDisbursed, getCatSum(['pinjaman owner', 'permintaan owner', 'prive']));
  const pelunasanOwner = Math.max(ownerPaymentsInMonth, getCatSum(['pelunasan owner', 'pelunasan pinjaman owner']));

  // Styles
  const headerStyle = {
    font: { bold: true, sz: 10, color: { rgb: '000000' } },
    fill: { fgColor: { rgb: '7F7F7F' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: borderBlack
  };

  const yellowAmountStyle = {
    font: { sz: 10, color: { rgb: '000000' } },
    fill: { fgColor: { rgb: 'FFC000' } },
    alignment: { horizontal: 'right', vertical: 'center' },
    border: borderBlack
  };

  const greenSubtotalStyle = {
    font: { bold: true, sz: 10, color: { rgb: '000000' } },
    fill: { fgColor: { rgb: '92D050' } },
    alignment: { horizontal: 'right', vertical: 'center' },
    border: borderBlack
  };

  const boldLabelStyle = {
    font: { bold: true, sz: 10, color: { rgb: '000000' } },
    alignment: { horizontal: 'left', vertical: 'center' },
    border: borderBlack
  };

  const normalLabelStyle = {
    font: { sz: 10, color: { rgb: '000000' } },
    alignment: { horizontal: 'left', vertical: 'center' },
    border: borderBlack
  };

  const centerNumStyle = {
    font: { bold: true, sz: 10, color: { rgb: '000000' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: borderBlack
  };

  let curRow = 0;

  // Title: CLOSING MONTHLY
  setCell(curRow, 0, {
    v: 'CLOSING MONTHLY',
    t: 's',
    s: { font: { bold: true, sz: 12 }, alignment: { horizontal: 'center', vertical: 'center' } }
  });
  merges.push({ s: { r: curRow, c: 0 }, e: { r: curRow, c: 4 } });
  curRow++;

  // Subtitle: BULAN  : [MONTH] [YY]
  setCell(curRow, 0, {
    v: `BULAN  : ${currentMonthName.toUpperCase()} ${yy}`,
    t: 's',
    s: { font: { bold: true, sz: 11 }, alignment: { horizontal: 'center', vertical: 'center' } }
  });
  merges.push({ s: { r: curRow, c: 0 }, e: { r: curRow, c: 4 } });
  curRow++;

  // Row 2 (Excel row 3): Headers
  const colHeaders = ['NO', 'KETERANGAN', 'MASUK', 'KELUAR', 'SALDO'];
  colHeaders.forEach((h, c) => {
    setCell(curRow, c, { v: h, t: 's', s: headerStyle });
  });
  curRow++;

  // Row 4: 1 | SALDO AKHIR [PREV MONTH] | MASUK (yellow)
  setCell(curRow, 0, { v: 1, t: 'n', s: centerNumStyle });
  setCell(curRow, 1, { v: `SALDO AKHIR ${prevMonthName.toUpperCase()}`, t: 's', s: boldLabelStyle });
  setCell(curRow, 2, { v: startingBalance, t: 'n', z: ACCOUNTING_FMT, s: yellowAmountStyle });
  setCell(curRow, 3, emptyCell());
  setCell(curRow, 4, emptyCell());
  curRow++;

  // Row 5: 2 | INCOME BRUTO PERUSAHAAN | MASUK (yellow)
  setCell(curRow, 0, { v: 2, t: 'n', s: centerNumStyle });
  setCell(curRow, 1, { v: 'INCOME BRUTO PERUSAHAAN', t: 's', s: boldLabelStyle });
  setCell(curRow, 2, { v: incomeBruto, t: 'n', z: ACCOUNTING_FMT, s: yellowAmountStyle });
  setCell(curRow, 3, emptyCell());
  setCell(curRow, 4, emptyCell());
  curRow++;

  // Row 6: 3 | SHARE PROFIT TO OWNER | KELUAR (yellow)
  setCell(curRow, 0, { v: 3, t: 'n', s: centerNumStyle });
  setCell(curRow, 1, { v: 'SHARE PROFIT TO OWNER', t: 's', s: boldLabelStyle });
  setCell(curRow, 2, emptyCell());
  setCell(curRow, 3, { v: shareProfitOwner, t: 'n', z: ACCOUNTING_FMT, s: yellowAmountStyle });
  setCell(curRow, 4, emptyCell());
  const rowShareProfit = curRow + 1; // 1-indexed
  curRow++;

  // Row 7: 4 | GAJI KARYAWAN | KELUAR (yellow)
  setCell(curRow, 0, { v: 4, t: 'n', s: centerNumStyle });
  setCell(curRow, 1, { v: 'GAJI KARYAWAN', t: 's', s: boldLabelStyle });
  setCell(curRow, 2, emptyCell());
  setCell(curRow, 3, { v: gajiAmount, t: 'n', z: ACCOUNTING_FMT, s: yellowAmountStyle });
  setCell(curRow, 4, emptyCell());
  const rowGaji = curRow + 1;
  curRow++;

  // Row 8: 5 | UANG MAKAN KARYAWAN | KELUAR (yellow)
  setCell(curRow, 0, { v: 5, t: 'n', s: centerNumStyle });
  setCell(curRow, 1, { v: 'UANG MAKAN KARYAWAN', t: 's', s: boldLabelStyle });
  setCell(curRow, 2, emptyCell());
  setCell(curRow, 3, { v: uangMakanAmount, t: 'n', z: ACCOUNTING_FMT, s: yellowAmountStyle });
  setCell(curRow, 4, emptyCell());
  const rowUangMakan = curRow + 1;
  curRow++;

  // Row 9: 6 | PEMBAYARAN DISTRIBUTOR | KELUAR (yellow)
  setCell(curRow, 0, { v: 6, t: 'n', s: centerNumStyle });
  setCell(curRow, 1, { v: 'PEMBAYARAN DISTRIBUTOR', t: 's', s: boldLabelStyle });
  setCell(curRow, 2, emptyCell());
  setCell(curRow, 3, { v: distributorAmount, t: 'n', z: ACCOUNTING_FMT, s: yellowAmountStyle });
  setCell(curRow, 4, emptyCell());
  const rowDistributor = curRow + 1;
  curRow++;

  // Row 10: 7 | PENGELUARAN DINAS
  setCell(curRow, 0, { v: 7, t: 'n', s: centerNumStyle });
  setCell(curRow, 1, { v: 'PENGELUARAN DINAS', t: 's', s: boldLabelStyle });
  setCell(curRow, 2, emptyCell());
  setCell(curRow, 3, emptyCell());
  setCell(curRow, 4, emptyCell());
  curRow++;

  // Row 11: ^ DINKES
  setCell(curRow, 0, emptyCell());
  setCell(curRow, 1, { v: '^ DINKES', t: 's', s: normalLabelStyle });
  setCell(curRow, 2, emptyCell());
  setCell(curRow, 3, { v: dinkesAmount, t: 'n', z: ACCOUNTING_FMT, s: yellowAmountStyle });
  setCell(curRow, 4, emptyCell());
  const rowDinkes = curRow + 1;
  curRow++;

  // Row 12: ^ BPOM
  setCell(curRow, 0, emptyCell());
  setCell(curRow, 1, { v: '^ BPOM', t: 's', s: normalLabelStyle });
  setCell(curRow, 2, emptyCell());
  setCell(curRow, 3, { v: bpomAmount, t: 'n', z: ACCOUNTING_FMT, s: yellowAmountStyle });
  setCell(curRow, 4, emptyCell());
  const rowBpom = curRow + 1;
  curRow++;

  // Row 13: ^ (empty placeholder)
  setCell(curRow, 0, emptyCell());
  setCell(curRow, 1, { v: '^', t: 's', s: normalLabelStyle });
  setCell(curRow, 2, emptyCell());
  setCell(curRow, 3, emptyCell());
  setCell(curRow, 4, emptyCell());
  curRow++;

  // Row 14: ^ (empty placeholder)
  setCell(curRow, 0, emptyCell());
  setCell(curRow, 1, { v: '^', t: 's', s: normalLabelStyle });
  setCell(curRow, 2, emptyCell());
  setCell(curRow, 3, emptyCell());
  setCell(curRow, 4, emptyCell());
  curRow++;

  // Row 15: 8 | PENGELUARAN BULANAN
  setCell(curRow, 0, { v: 8, t: 'n', s: centerNumStyle });
  setCell(curRow, 1, { v: 'PENGELUARAN BULANAN', t: 's', s: boldLabelStyle });
  setCell(curRow, 2, emptyCell());
  setCell(curRow, 3, emptyCell());
  setCell(curRow, 4, emptyCell());
  curRow++;

  // Operational items
  const opsRows = [
    { label: '^ LISTRIK', amount: listrikAmount },
    { label: '^ AIR', amount: airAmount },
    { label: '^ PERUM PERUSAHAAN', amount: perumAmount },
    { label: '^ SAMPAH', amount: sampahAmount },
    { label: '^ KEAMANAN', amount: keamananAmount },
    { label: '^ KEBUTUHAN RT (sabun dll)', amount: rtAmount },
    { label: '^ ATK', amount: atkAmount },
    { label: '^ PROPERTY (lemari, printer, dll)', amount: propertyAmount },
    { label: '^ ISI BENSIN MOTOR OPS', amount: bensinAmount }
  ];

  const opsStart1 = curRow + 1;
  opsRows.forEach(item => {
    setCell(curRow, 0, emptyCell());
    setCell(curRow, 1, { v: item.label, t: 's', s: normalLabelStyle });
    setCell(curRow, 2, emptyCell());
    setCell(curRow, 3, { v: item.amount, t: 'n', z: ACCOUNTING_FMT, s: yellowAmountStyle });
    setCell(curRow, 4, emptyCell());
    curRow++;
  });
  const opsEnd1 = curRow;

  // Subtotal Pengeluaran Bulanan: TOTAL (Green Highlight)
  const opsSubtotalAmount = opsRows.reduce((sum, item) => sum + item.amount, 0);
  setCell(curRow, 0, emptyCell());
  setCell(curRow, 1, { v: 'TOTAL', t: 's', s: { font: { bold: true, sz: 10 }, alignment: { horizontal: 'right', vertical: 'center' }, border: borderBlack } });
  setCell(curRow, 2, emptyCell());
  setCell(curRow, 3, {
    f: `SUM(D${opsStart1}:D${opsEnd1})`,
    v: opsSubtotalAmount,
    t: 'n',
    z: ACCOUNTING_FMT,
    s: greenSubtotalStyle
  });
  setCell(curRow, 4, emptyCell());
  const rowOpsSubtotal = curRow + 1;
  curRow++;

  // Row: 9 | KEBUTUHAN OWNER
  setCell(curRow, 0, { v: 9, t: 'n', s: centerNumStyle });
  setCell(curRow, 1, { v: 'KEBUTUHAN OWNER', t: 's', s: boldLabelStyle });
  setCell(curRow, 2, emptyCell());
  setCell(curRow, 3, emptyCell());
  setCell(curRow, 4, emptyCell());
  curRow++;

  const ownerStart1 = curRow + 1;
  setCell(curRow, 0, emptyCell());
  setCell(curRow, 1, { v: '^ PINJAMAN', t: 's', s: normalLabelStyle });
  setCell(curRow, 2, emptyCell());
  setCell(curRow, 3, { v: pinjamanOwner, t: 'n', z: ACCOUNTING_FMT, s: yellowAmountStyle });
  setCell(curRow, 4, emptyCell());
  curRow++;

  setCell(curRow, 0, emptyCell());
  setCell(curRow, 1, { v: '^ PELUNASAN', t: 's', s: normalLabelStyle });
  setCell(curRow, 2, emptyCell());
  setCell(curRow, 3, { v: pelunasanOwner, t: 'n', z: ACCOUNTING_FMT, s: yellowAmountStyle });
  setCell(curRow, 4, emptyCell());
  curRow++;
  const ownerEnd1 = curRow;

  // Subtotal Kebutuhan Owner (Green Highlight)
  const ownerSubtotalAmount = pinjamanOwner + pelunasanOwner;
  setCell(curRow, 0, emptyCell());
  setCell(curRow, 1, emptyCell());
  setCell(curRow, 2, emptyCell());
  setCell(curRow, 3, {
    f: `SUM(D${ownerStart1}:D${ownerEnd1})`,
    v: ownerSubtotalAmount,
    t: 'n',
    z: ACCOUNTING_FMT,
    s: greenSubtotalStyle
  });
  setCell(curRow, 4, emptyCell());
  const rowOwnerSubtotal = curRow + 1;
  curRow++;

  // Row: 10 | PINJAMAN KARYAWAN
  setCell(curRow, 0, { v: 10, t: 'n', s: centerNumStyle });
  setCell(curRow, 1, { v: 'PINJAMAN KARYAWAN', t: 's', s: boldLabelStyle });
  setCell(curRow, 2, emptyCell());
  setCell(curRow, 3, emptyCell());
  setCell(curRow, 4, emptyCell());
  curRow++;

  // Process employee loans data
  const employeeLoans = loans.filter(l => l.type === 'employee');
  const employeeDataMap = new Map<string, { pinjamanInMonth: number; pelunasanInMonth: number; totalLoan: number; totalPaid: number }>();

  employeeLoans.forEach(l => {
    const name = (l.borrowerName || '').trim() || 'Karyawan';
    if (!employeeDataMap.has(name)) {
      employeeDataMap.set(name, { pinjamanInMonth: 0, pelunasanInMonth: 0, totalLoan: 0, totalPaid: 0 });
    }
    const data = employeeDataMap.get(name)!;

    const loanDate = new Date(l.date);
    const isThisMonth = loanDate.getFullYear() === year && loanDate.getMonth() === monthIndex;
    const isUpToThisMonth = loanDate.getFullYear() < year || (loanDate.getFullYear() === year && loanDate.getMonth() <= monthIndex);

    if (isThisMonth) {
      data.pinjamanInMonth += l.amount;
    }
    if (isUpToThisMonth) {
      data.totalLoan += l.amount;
    }

    (l.payments || []).forEach(p => {
      const payDate = new Date(p.date);
      const isPayThisMonth = payDate.getFullYear() === year && payDate.getMonth() === monthIndex;
      const isPayUpToThisMonth = payDate.getFullYear() < year || (payDate.getFullYear() === year && payDate.getMonth() <= monthIndex);

      if (isPayThisMonth) {
        data.pelunasanInMonth += p.amount;
      }
      if (isPayUpToThisMonth) {
        data.totalPaid += p.amount;
      }
    });
  });

  const employeeList = Array.from(employeeDataMap.entries()).map(([name, d]) => {
    const remaining = Math.max(0, d.totalLoan - d.totalPaid);
    const isLunas = d.totalLoan > 0 && remaining <= 0;
    return {
      name,
      pinjamanInMonth: d.pinjamanInMonth,
      pelunasanInMonth: d.pelunasanInMonth,
      remaining,
      isLunas
    };
  });

  // Always show at least 3 blocks to preserve the image format
  const blocksToRender = Math.max(3, employeeList.length);

  for (let k = 0; k < blocksToRender; k++) {
    const emp = employeeList[k];

    setCell(curRow, 0, emptyCell());
    setCell(curRow, 1, { 
      v: emp ? `NAMA : ${emp.name.toUpperCase()}` : 'NAMA : ', 
      t: 's', 
      s: emp ? boldLabelStyle : normalLabelStyle 
    });
    setCell(curRow, 2, emptyCell());
    setCell(curRow, 3, emptyCell());
    setCell(curRow, 4, emptyCell());
    curRow++;

    setCell(curRow, 0, emptyCell());
    setCell(curRow, 1, { v: '^ PINJAMAN', t: 's', s: normalLabelStyle });
    setCell(curRow, 2, emptyCell());
    if (emp && emp.pinjamanInMonth > 0) {
      setCell(curRow, 3, { v: emp.pinjamanInMonth, t: 'n', z: ACCOUNTING_FMT, s: yellowAmountStyle });
    } else {
      setCell(curRow, 3, emptyCell());
    }
    setCell(curRow, 4, emptyCell());
    curRow++;

    setCell(curRow, 0, emptyCell());
    setCell(curRow, 1, { v: '^ PELUNASAN', t: 's', s: normalLabelStyle });
    setCell(curRow, 2, emptyCell());
    if (emp && emp.pelunasanInMonth > 0) {
      setCell(curRow, 3, { v: emp.pelunasanInMonth, t: 'n', z: ACCOUNTING_FMT, s: yellowAmountStyle });
    } else {
      setCell(curRow, 3, emptyCell());
    }
    setCell(curRow, 4, emptyCell());
    curRow++;

    setCell(curRow, 0, emptyCell());
    setCell(curRow, 1, { v: 'KURANG / LUNAS', t: 's', s: { font: { sz: 9, bold: true }, alignment: { horizontal: 'right', vertical: 'center' }, border: borderBlack } });
    setCell(curRow, 2, emptyCell());
    setCell(curRow, 3, emptyCell());
    if (emp) {
      if (emp.isLunas) {
        setCell(curRow, 4, { 
          v: 'LUNAS', 
          t: 's', 
          s: { font: { bold: true, sz: 10, color: { rgb: '006100' } }, alignment: { horizontal: 'center', vertical: 'center' }, border: borderBlack } 
        });
      } else if (emp.remaining > 0) {
        setCell(curRow, 4, { 
          v: emp.remaining, 
          t: 'n', 
          z: ACCOUNTING_FMT, 
          s: { font: { bold: true, sz: 10, color: { rgb: 'C00000' } }, alignment: { horizontal: 'right', vertical: 'center' }, border: borderBlack } 
        });
      } else {
        setCell(curRow, 4, emptyCell());
      }
    } else {
      setCell(curRow, 4, emptyCell());
    }
    curRow++;
  }

  // BOTTOM ROW: TOTAL
  const totalRow1 = curRow + 1; // 1-indexed
  const totalExpensesComputed = shareProfitOwner + gajiAmount + uangMakanAmount + distributorAmount + dinkesAmount + bpomAmount + opsSubtotalAmount + ownerSubtotalAmount;
  const endingBalanceComputed = (startingBalance + incomeBruto) - totalExpensesComputed;

  setCell(curRow, 0, emptyCell());
  setCell(curRow, 1, {
    v: 'TOTAL',
    t: 's',
    s: { font: { bold: true, sz: 11, color: { rgb: '000000' } }, alignment: { horizontal: 'center', vertical: 'center' }, border: borderBlack }
  });
  setCell(curRow, 2, {
    f: `SUM(C4:C5)`,
    v: startingBalance + incomeBruto,
    t: 'n',
    z: ACCOUNTING_FMT,
    s: { font: { bold: true, sz: 10, color: { rgb: '000000' } }, alignment: { horizontal: 'right', vertical: 'center' }, border: borderBlack }
  });
  setCell(curRow, 3, {
    f: `D${rowShareProfit}+D${rowGaji}+D${rowUangMakan}+D${rowDistributor}+D${rowDinkes}+D${rowBpom}+D${rowOpsSubtotal}+D${rowOwnerSubtotal}`,
    v: totalExpensesComputed,
    t: 'n',
    z: ACCOUNTING_FMT,
    s: { font: { bold: true, sz: 10, color: { rgb: '000000' } }, alignment: { horizontal: 'right', vertical: 'center' }, border: borderBlack }
  });
  setCell(curRow, 4, {
    f: `C${totalRow1}-D${totalRow1}`,
    v: endingBalanceComputed,
    t: 'n',
    z: ACCOUNTING_FMT,
    s: { font: { bold: true, sz: 10, color: { rgb: '000000' } }, alignment: { horizontal: 'right', vertical: 'center' }, border: borderBlack }
  });
  curRow++;

  // Metadata
  ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: curRow - 1, c: 4 } });
  ws['!cols'] = [
    { wch: 6 },  // NO
    { wch: 38 }, // KETERANGAN
    { wch: 19 }, // MASUK
    { wch: 19 }, // KELUAR
    { wch: 19 }  // SALDO
  ];
  ws['!merges'] = merges;

  return {
    ws,
    endingBalance: endingBalanceComputed,
    stats: {
      incomeBruto,
      opsExpenses: opsSubtotalAmount,
      ownerExpenses: ownerSubtotalAmount,
      totalExpenses: totalExpensesComputed,
      shareProfitOwner,
      gajiTotal: gajiAmount
    }
  };
};

// ==========================================
// 3. ANNUAL RECAP SHEET (e.g. '2026')
// ==========================================
export const buildAnnualRecapSheet = (
  profile: CompanyProfile,
  year: number,
  monthlyData: {
    monthName: string;
    sheetName: string;
    startingBalance: number;
    incomeBruto: number;
    opsExpenses: number;
    ownerExpenses: number;
    totalExpenses: number;
    endingBalance: number;
  }[]
): XLSX.WorkSheet => {
  const ws: XLSX.WorkSheet = {};
  const merges: XLSX.Range[] = [];
  let curRow = 0;

  const setCell = (r: number, c: number, cell: any) => {
    const ref = XLSX.utils.encode_cell({ r, c });
    ws[ref] = cell;
  };

  // Header Title
  setCell(curRow, 0, {
    v: `REKAPITULASI LAPORAN KEUANGAN TAHUN ${year}`,
    t: 's',
    s: { font: { bold: true, sz: 14, color: { rgb: '1F4E79' } }, alignment: { horizontal: 'left', vertical: 'center' } }
  });
  merges.push({ s: { r: curRow, c: 0 }, e: { r: curRow, c: 7 } });
  curRow++;

  setCell(curRow, 0, {
    v: profile.name.toUpperCase(),
    t: 's',
    s: { font: { bold: true, sz: 11, color: { rgb: '262626' } }, alignment: { horizontal: 'left', vertical: 'center' } }
  });
  merges.push({ s: { r: curRow, c: 0 }, e: { r: curRow, c: 7 } });
  curRow++;

  setCell(curRow, 0, {
    v: `${profile.address}${profile.whatsapp ? ' | WA: ' + profile.whatsapp : ''}`,
    t: 's',
    s: { font: { italic: true, sz: 9, color: { rgb: '555555' } }, alignment: { horizontal: 'left', vertical: 'center' } }
  });
  merges.push({ s: { r: curRow, c: 0 }, e: { r: curRow, c: 7 } });
  curRow++;

  // Empty row
  curRow++;

  // Table Headers
  const headers = [
    'NO',
    'BULAN',
    'SALDO AWAL',
    'INCOME BRUTO',
    'BIAYA BULANAN',
    'KEBUTUHAN OWNER',
    'TOTAL KELUAR',
    'SALDO AKHIR'
  ];

  headers.forEach((h, c) => {
    setCell(curRow, c, {
      v: h,
      t: 's',
      s: {
        font: { bold: true, sz: 10, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '1F4E79' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: borderThin
      }
    });
  });
  curRow++;

  const startRow1 = curRow + 1; // 1-indexed for sum formulas
  monthlyData.forEach((m, idx) => {
    const isAlt = idx % 2 === 1;
    const rowBg = isAlt ? { fgColor: { rgb: 'F9FAFB' } } : undefined;

    setCell(curRow, 0, {
      v: idx + 1,
      t: 'n',
      s: { font: { sz: 10 }, fill: rowBg, alignment: { horizontal: 'center', vertical: 'center' }, border: borderThin }
    });
    setCell(curRow, 1, {
      v: m.monthName,
      t: 's',
      s: { font: { bold: true, sz: 10, color: { rgb: '1F4E79' } }, fill: rowBg, alignment: { horizontal: 'left', vertical: 'center' }, border: borderThin }
    });
    setCell(curRow, 2, {
      v: m.startingBalance,
      t: 'n',
      z: ACCOUNTING_NO_DEC,
      s: { font: { sz: 10 }, fill: rowBg, alignment: { horizontal: 'right', vertical: 'center' }, border: borderThin }
    });
    setCell(curRow, 3, {
      v: m.incomeBruto,
      t: 'n',
      z: ACCOUNTING_NO_DEC,
      s: { font: { sz: 10 }, fill: rowBg, alignment: { horizontal: 'right', vertical: 'center' }, border: borderThin }
    });
    setCell(curRow, 4, {
      v: m.opsExpenses,
      t: 'n',
      z: ACCOUNTING_NO_DEC,
      s: { font: { sz: 10 }, fill: rowBg, alignment: { horizontal: 'right', vertical: 'center' }, border: borderThin }
    });
    setCell(curRow, 5, {
      v: m.ownerExpenses,
      t: 'n',
      z: ACCOUNTING_NO_DEC,
      s: { font: { sz: 10 }, fill: rowBg, alignment: { horizontal: 'right', vertical: 'center' }, border: borderThin }
    });
    setCell(curRow, 6, {
      v: m.totalExpenses,
      t: 'n',
      z: ACCOUNTING_NO_DEC,
      s: { font: { sz: 10 }, fill: rowBg, alignment: { horizontal: 'right', vertical: 'center' }, border: borderThin }
    });
    setCell(curRow, 7, {
      v: m.endingBalance,
      t: 'n',
      z: ACCOUNTING_NO_DEC,
      s: { font: { bold: true, sz: 10, color: { rgb: '006100' } }, fill: rowBg, alignment: { horizontal: 'right', vertical: 'center' }, border: borderThin }
    });
    curRow++;
  });
  const endRow1 = curRow;

  // Annual Totals Row
  setCell(curRow, 0, { v: '', t: 's', s: { fill: { fgColor: { rgb: 'C6EFCE' } }, border: borderSubtotal } });
  setCell(curRow, 1, {
    v: `TOTAL TAHUN ${year}`,
    t: 's',
    s: { font: { bold: true, sz: 10, color: { rgb: '006100' } }, fill: { fgColor: { rgb: 'C6EFCE' } }, alignment: { horizontal: 'right', vertical: 'center' }, border: borderSubtotal }
  });
  setCell(curRow, 2, {
    v: monthlyData[0]?.startingBalance || 0,
    t: 'n',
    z: ACCOUNTING_NO_DEC,
    s: { font: { bold: true, sz: 10, color: { rgb: '006100' } }, fill: { fgColor: { rgb: 'C6EFCE' } }, alignment: { horizontal: 'right', vertical: 'center' }, border: borderSubtotal }
  });
  setCell(curRow, 3, {
    f: `SUM(D${startRow1}:D${endRow1})`,
    t: 'n',
    z: ACCOUNTING_NO_DEC,
    s: { font: { bold: true, sz: 10, color: { rgb: '006100' } }, fill: { fgColor: { rgb: 'C6EFCE' } }, alignment: { horizontal: 'right', vertical: 'center' }, border: borderSubtotal }
  });
  setCell(curRow, 4, {
    f: `SUM(E${startRow1}:E${endRow1})`,
    t: 'n',
    z: ACCOUNTING_NO_DEC,
    s: { font: { bold: true, sz: 10, color: { rgb: '006100' } }, fill: { fgColor: { rgb: 'C6EFCE' } }, alignment: { horizontal: 'right', vertical: 'center' }, border: borderSubtotal }
  });
  setCell(curRow, 5, {
    f: `SUM(F${startRow1}:F${endRow1})`,
    t: 'n',
    z: ACCOUNTING_NO_DEC,
    s: { font: { bold: true, sz: 10, color: { rgb: '006100' } }, fill: { fgColor: { rgb: 'C6EFCE' } }, alignment: { horizontal: 'right', vertical: 'center' }, border: borderSubtotal }
  });
  setCell(curRow, 6, {
    f: `SUM(G${startRow1}:G${endRow1})`,
    t: 'n',
    z: ACCOUNTING_NO_DEC,
    s: { font: { bold: true, sz: 10, color: { rgb: '006100' } }, fill: { fgColor: { rgb: 'C6EFCE' } }, alignment: { horizontal: 'right', vertical: 'center' }, border: borderSubtotal }
  });
  setCell(curRow, 7, {
    v: monthlyData[monthlyData.length - 1]?.endingBalance || 0,
    t: 'n',
    z: ACCOUNTING_NO_DEC,
    s: { font: { bold: true, sz: 10, color: { rgb: '006100' } }, fill: { fgColor: { rgb: 'C6EFCE' } }, alignment: { horizontal: 'right', vertical: 'center' }, border: borderSubtotal }
  });
  curRow++;

  ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: curRow - 1, c: 7 } });
  ws['!cols'] = [
    { wch: 6 },  // NO
    { wch: 18 }, // BULAN
    { wch: 18 }, // SALDO AWAL
    { wch: 19 }, // INCOME BRUTO
    { wch: 18 }, // BIAYA BULANAN
    { wch: 19 }, // KEBUTUHAN OWNER
    { wch: 19 }, // TOTAL KELUAR
    { wch: 19 }  // SALDO AKHIR
  ];
  ws['!merges'] = merges;

  return ws;
};

// ==========================================
// 4. CATEGORY BREAKDOWN SHEET (Report Bulanan)
// ==========================================
export const buildMonthlyReportSheet = (
  profile: CompanyProfile,
  monthYear: string,
  transactions: Transaction[],
  summary: DetailedSummary
): XLSX.WorkSheet => {
  const ws: XLSX.WorkSheet = {};
  const merges: XLSX.Range[] = [];
  let curRow = 0;

  const setCell = (r: number, c: number, cell: any) => {
    const ref = XLSX.utils.encode_cell({ r, c });
    ws[ref] = cell;
  };

  const isOwnerCategory = (cat: string) => {
    const c = (cat || '').toLowerCase();
    return c.includes('owner') || c.includes('prive');
  };

  setCell(curRow, 0, {
    v: 'LAPORAN KEUANGAN BULANAN',
    t: 's',
    s: { font: { bold: true, sz: 15, color: { rgb: '1F4E79' } }, alignment: { horizontal: 'left', vertical: 'center' } }
  });
  merges.push({ s: { r: curRow, c: 0 }, e: { r: curRow, c: 3 } });
  curRow++;

  setCell(curRow, 0, {
    v: profile.name.toUpperCase(),
    t: 's',
    s: { font: { bold: true, sz: 12, color: { rgb: '262626' } }, alignment: { horizontal: 'left', vertical: 'center' } }
  });
  merges.push({ s: { r: curRow, c: 0 }, e: { r: curRow, c: 3 } });
  curRow++;

  setCell(curRow, 0, {
    v: `${profile.address}${profile.whatsapp ? ' | WA: ' + profile.whatsapp : ''}`,
    t: 's',
    s: { font: { italic: true, sz: 9, color: { rgb: '595959' } }, alignment: { horizontal: 'left', vertical: 'center' } }
  });
  merges.push({ s: { r: curRow, c: 0 }, e: { r: curRow, c: 3 } });
  curRow++;

  setCell(curRow, 0, {
    v: `Periode: ${monthYear}`,
    t: 's',
    s: { font: { bold: true, sz: 11, color: { rgb: '1F4E79' } }, alignment: { horizontal: 'left', vertical: 'center' } }
  });
  merges.push({ s: { r: curRow, c: 0 }, e: { r: curRow, c: 3 } });
  curRow++;

  curRow++; // empty divider

  const tableHeaders = ['NO', 'URAIAN / POS PENGELUARAN', 'KETERANGAN / METODE', 'JUMLAH (RP)'];
  tableHeaders.forEach((h, colIdx) => {
    setCell(curRow, colIdx, {
      v: h,
      t: 's',
      s: {
        font: { bold: true, sz: 10, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '1F4E79' } },
        alignment: { horizontal: colIdx === 0 ? 'center' : (colIdx === 3 ? 'right' : 'left'), vertical: 'center' },
        border: borderThin
      }
    });
  });
  curRow++;

  // Section 1: Pengeluaran Bulanan
  const opsHeaderRow = curRow;
  setCell(opsHeaderRow, 0, {
    v: 'A. PENGELUARAN BULANAN (OPERASIONAL)',
    t: 's',
    s: {
      font: { bold: true, sz: 10, color: { rgb: '1F4E79' } },
      fill: { fgColor: { rgb: 'D9E1F2' } },
      alignment: { horizontal: 'left', vertical: 'center' },
      border: borderSection
    }
  });
  for (let c = 1; c <= 3; c++) {
    setCell(opsHeaderRow, c, {
      v: '',
      t: 's',
      s: { fill: { fgColor: { rgb: 'D9E1F2' } }, border: borderSection }
    });
  }
  merges.push({ s: { r: opsHeaderRow, c: 0 }, e: { r: opsHeaderRow, c: 3 } });
  curRow++;

  const opsTransactions = transactions.filter(t => t.type === 'outcome' && !isOwnerCategory(t.category));
  const opsMap = new Map<string, { total: number; methods: Set<string>; notes: string[] }>();

  opsTransactions.forEach(t => {
    const cat = t.category || 'Lainnya';
    if (!opsMap.has(cat)) {
      opsMap.set(cat, { total: 0, methods: new Set(), notes: [] });
    }
    const item = opsMap.get(cat)!;
    item.total += t.amount;
    item.methods.add(t.method === 'cash' ? 'Tunai' : (t.method.startsWith('tf') ? 'Transfer' : t.method.toUpperCase()));
    if (t.notes && t.notes.trim() && item.notes.length < 2) {
      item.notes.push(t.notes.trim());
    }
  });

  const allPossibleOpsCategories = Array.from(new Set([
    ...OUTCOME_CASH_CATEGORIES.filter(c => !isOwnerCategory(c)),
    ...OUTCOME_TF_CATEGORIES.filter(c => !isOwnerCategory(c)),
    ...(profile.customOutcomeCategories || []).filter(c => !isOwnerCategory(c)),
    ...(profile.customOutcomeTfCategories || []).filter(c => !isOwnerCategory(c)),
    ...Array.from(opsMap.keys())
  ]));

  const activeOpsCategories: { name: string; desc: string; amount: number }[] = [];
  allPossibleOpsCategories.forEach(catName => {
    if (opsMap.has(catName)) {
      const data = opsMap.get(catName)!;
      const methodStr = Array.from(data.methods).join(', ');
      const descStr = data.notes.length > 0 ? `${methodStr} (${data.notes.join('; ')})` : methodStr;
      activeOpsCategories.push({
        name: catName,
        desc: descStr,
        amount: data.total
      });
    }
  });

  if (activeOpsCategories.length === 0) {
    activeOpsCategories.push({
      name: 'Pengeluaran Operasional Bulanan',
      desc: 'Tidak ada catatan pengeluaran',
      amount: 0
    });
  }

  const opsStartRow1 = curRow + 1;
  activeOpsCategories.forEach((item, idx) => {
    setCell(curRow, 0, {
      v: idx + 1,
      t: 'n',
      s: { font: { sz: 10 }, alignment: { horizontal: 'center', vertical: 'center' }, border: borderThin }
    });
    setCell(curRow, 1, {
      v: item.name,
      t: 's',
      s: { font: { sz: 10 }, alignment: { horizontal: 'left', vertical: 'center' }, border: borderThin }
    });
    setCell(curRow, 2, {
      v: item.desc,
      t: 's',
      s: { font: { sz: 9, italic: true, color: { rgb: '555555' } }, alignment: { horizontal: 'left', vertical: 'center' }, border: borderThin }
    });
    setCell(curRow, 3, {
      v: item.amount,
      t: 'n',
      z: ACCOUNTING_NO_DEC,
      s: { font: { sz: 10 }, alignment: { horizontal: 'right', vertical: 'center' }, border: borderThin }
    });
    curRow++;
  });
  const opsEndRow1 = curRow;

  // Subtotal Ops (Light Green)
  const opsSubtotalRow1 = curRow + 1;
  const totalOpsAmount = activeOpsCategories.reduce((acc, curr) => acc + curr.amount, 0);

  setCell(curRow, 0, { v: '', t: 's', s: { fill: { fgColor: { rgb: 'C6EFCE' } }, border: borderSubtotal } });
  setCell(curRow, 1, {
    v: 'TOTAL PENGELUARAN BULANAN',
    t: 's',
    s: { font: { bold: true, sz: 10, color: { rgb: '006100' } }, fill: { fgColor: { rgb: 'C6EFCE' } }, alignment: { horizontal: 'right', vertical: 'center' }, border: borderSubtotal }
  });
  setCell(curRow, 2, { v: '', t: 's', s: { fill: { fgColor: { rgb: 'C6EFCE' } }, border: borderSubtotal } });
  merges.push({ s: { r: curRow, c: 1 }, e: { r: curRow, c: 2 } });

  setCell(curRow, 3, {
    f: `SUM(D${opsStartRow1}:D${opsEndRow1})`,
    v: totalOpsAmount,
    t: 'n',
    z: ACCOUNTING_NO_DEC,
    s: { font: { bold: true, sz: 10, color: { rgb: '006100' } }, fill: { fgColor: { rgb: 'C6EFCE' } }, alignment: { horizontal: 'right', vertical: 'center' }, border: borderSubtotal }
  });
  curRow++;

  curRow++; // divider

  // Section 2: Kebutuhan Owner
  const ownerHeaderRow = curRow;
  setCell(ownerHeaderRow, 0, {
    v: 'B. KEBUTUHAN OWNER',
    t: 's',
    s: { font: { bold: true, sz: 10, color: { rgb: '833C0C' } }, fill: { fgColor: { rgb: 'FCE4D6' } }, alignment: { horizontal: 'left', vertical: 'center' }, border: borderSection }
  });
  for (let c = 1; c <= 3; c++) {
    setCell(ownerHeaderRow, c, { v: '', t: 's', s: { fill: { fgColor: { rgb: 'FCE4D6' } }, border: borderSection } });
  }
  merges.push({ s: { r: ownerHeaderRow, c: 0 }, e: { r: ownerHeaderRow, c: 3 } });
  curRow++;

  const ownerTransactions = transactions.filter(t => t.type === 'outcome' && isOwnerCategory(t.category));
  const ownerItems: { name: string; desc: string; amount: number }[] = [];

  if (ownerTransactions.length > 0) {
    if (ownerTransactions.length <= 8) {
      ownerTransactions.forEach(t => {
        const dateFormatted = format(new Date(t.date), 'dd/MM/yyyy');
        const methodLabel = t.method === 'cash' ? 'Tunai' : 'Transfer';
        const noteStr = t.notes ? ` - ${t.notes}` : '';
        ownerItems.push({
          name: `Permintaan Owner (${dateFormatted})`,
          desc: `${methodLabel}${noteStr}`,
          amount: t.amount
        });
      });
    } else {
      let ownerCash = 0, ownerTf = 0;
      ownerTransactions.forEach(t => {
        if (t.method === 'cash') ownerCash += t.amount;
        else ownerTf += t.amount;
      });
      if (ownerCash > 0) {
        ownerItems.push({
          name: 'Permintaan Owner (Tunai)',
          desc: `${ownerTransactions.filter(t => t.method === 'cash').length} Transaksi`,
          amount: ownerCash
        });
      }
      if (ownerTf > 0) {
        ownerItems.push({
          name: 'Permintaan Owner (Transfer)',
          desc: `${ownerTransactions.filter(t => t.method !== 'cash').length} Transaksi`,
          amount: ownerTf
        });
      }
    }
  } else {
    ownerItems.push({
      name: 'Permintaan Owner / Prive',
      desc: 'Tidak ada penarikan bulan ini',
      amount: 0
    });
  }

  if (summary.profitOwner > 0) {
    ownerItems.push({
      name: 'Alokasi Profit Owner (20%)',
      desc: 'Hak Bagi Hasil Pemilik dari Laba Bersih',
      amount: summary.profitOwner
    });
  }

  const ownerStartRow1 = curRow + 1;
  ownerItems.forEach((item, idx) => {
    setCell(curRow, 0, {
      v: idx + 1,
      t: 'n',
      s: { font: { sz: 10 }, alignment: { horizontal: 'center', vertical: 'center' }, border: borderThin }
    });
    setCell(curRow, 1, {
      v: item.name,
      t: 's',
      s: { font: { sz: 10 }, alignment: { horizontal: 'left', vertical: 'center' }, border: borderThin }
    });
    setCell(curRow, 2, {
      v: item.desc,
      t: 's',
      s: { font: { sz: 9, italic: true, color: { rgb: '555555' } }, alignment: { horizontal: 'left', vertical: 'center' }, border: borderThin }
    });
    setCell(curRow, 3, {
      v: item.amount,
      t: 'n',
      z: ACCOUNTING_NO_DEC,
      s: { font: { sz: 10 }, alignment: { horizontal: 'right', vertical: 'center' }, border: borderThin }
    });
    curRow++;
  });
  const ownerEndRow1 = curRow;

  // Subtotal Owner (Light Green)
  const ownerSubtotalRow1 = curRow + 1;
  const totalOwnerAmount = ownerItems.reduce((acc, curr) => acc + curr.amount, 0);

  setCell(curRow, 0, { v: '', t: 's', s: { fill: { fgColor: { rgb: 'C6EFCE' } }, border: borderSubtotal } });
  setCell(curRow, 1, {
    v: 'TOTAL KEBUTUHAN OWNER',
    t: 's',
    s: { font: { bold: true, sz: 10, color: { rgb: '006100' } }, fill: { fgColor: { rgb: 'C6EFCE' } }, alignment: { horizontal: 'right', vertical: 'center' }, border: borderSubtotal }
  });
  setCell(curRow, 2, { v: '', t: 's', s: { fill: { fgColor: { rgb: 'C6EFCE' } }, border: borderSubtotal } });
  merges.push({ s: { r: curRow, c: 1 }, e: { r: curRow, c: 2 } });

  setCell(curRow, 3, {
    f: `SUM(D${ownerStartRow1}:D${ownerEndRow1})`,
    v: totalOwnerAmount,
    t: 'n',
    z: ACCOUNTING_NO_DEC,
    s: { font: { bold: true, sz: 10, color: { rgb: '006100' } }, fill: { fgColor: { rgb: 'C6EFCE' } }, alignment: { horizontal: 'right', vertical: 'center' }, border: borderSubtotal }
  });
  curRow++;

  curRow++; // divider

  // Combined Total (A + B) (Light Green)
  setCell(curRow, 0, { v: '', t: 's', s: { fill: { fgColor: { rgb: 'C6EFCE' } }, border: borderSubtotal } });
  setCell(curRow, 1, {
    v: 'TOTAL SELURUH PENGELUARAN (A + B)',
    t: 's',
    s: { font: { bold: true, sz: 10, color: { rgb: '006100' } }, fill: { fgColor: { rgb: 'C6EFCE' } }, alignment: { horizontal: 'right', vertical: 'center' }, border: borderSubtotal }
  });
  setCell(curRow, 2, { v: '', t: 's', s: { fill: { fgColor: { rgb: 'C6EFCE' } }, border: borderSubtotal } });
  merges.push({ s: { r: curRow, c: 1 }, e: { r: curRow, c: 2 } });

  setCell(curRow, 3, {
    f: `D${opsSubtotalRow1}+D${ownerSubtotalRow1}`,
    v: totalOpsAmount + totalOwnerAmount,
    t: 'n',
    z: ACCOUNTING_NO_DEC,
    s: { font: { bold: true, sz: 10, color: { rgb: '006100' } }, fill: { fgColor: { rgb: 'C6EFCE' } }, alignment: { horizontal: 'right', vertical: 'center' }, border: borderSubtotal }
  });
  curRow++;

  curRow++; // divider

  // Section 3: Rekapitulasi Pemasukan & Kas
  const incHeaderRow = curRow;
  setCell(incHeaderRow, 0, {
    v: 'C. REKAPITULASI PEMASUKAN & SISA KAS',
    t: 's',
    s: { font: { bold: true, sz: 10, color: { rgb: '274E13' } }, fill: { fgColor: { rgb: 'E2EFDA' } }, alignment: { horizontal: 'left', vertical: 'center' }, border: borderSection }
  });
  for (let c = 1; c <= 3; c++) {
    setCell(incHeaderRow, c, { v: '', t: 's', s: { fill: { fgColor: { rgb: 'E2EFDA' } }, border: borderSection } });
  }
  merges.push({ s: { r: incHeaderRow, c: 0 }, e: { r: incHeaderRow, c: 3 } });
  curRow++;

  const incomeItems = summary.incomeBreakdown.length > 0 
    ? summary.incomeBreakdown 
    : [{ name: 'Pemasukan Kas', amount: 0 }];

  const incStartRow1 = curRow + 1;
  incomeItems.forEach((item, idx) => {
    setCell(curRow, 0, {
      v: idx + 1,
      t: 'n',
      s: { font: { sz: 10 }, alignment: { horizontal: 'center', vertical: 'center' }, border: borderThin }
    });
    setCell(curRow, 1, {
      v: `Pemasukan - ${item.name}`,
      t: 's',
      s: { font: { sz: 10 }, alignment: { horizontal: 'left', vertical: 'center' }, border: borderThin }
    });
    setCell(curRow, 2, {
      v: 'Omset Penjualan Apotek',
      t: 's',
      s: { font: { sz: 9, italic: true, color: { rgb: '555555' } }, alignment: { horizontal: 'left', vertical: 'center' }, border: borderThin }
    });
    setCell(curRow, 3, {
      v: item.amount,
      t: 'n',
      z: ACCOUNTING_NO_DEC,
      s: { font: { sz: 10 }, alignment: { horizontal: 'right', vertical: 'center' }, border: borderThin }
    });
    curRow++;
  });
  const incEndRow1 = curRow;

  // Subtotal Pemasukan (Light Green)
  const incSubtotalRow1 = curRow + 1;
  setCell(curRow, 0, { v: '', t: 's', s: { fill: { fgColor: { rgb: 'C6EFCE' } }, border: borderSubtotal } });
  setCell(curRow, 1, {
    v: 'TOTAL PEMASUKAN BRUTO',
    t: 's',
    s: { font: { bold: true, sz: 10, color: { rgb: '006100' } }, fill: { fgColor: { rgb: 'C6EFCE' } }, alignment: { horizontal: 'right', vertical: 'center' }, border: borderSubtotal }
  });
  setCell(curRow, 2, { v: '', t: 's', s: { fill: { fgColor: { rgb: 'C6EFCE' } }, border: borderSubtotal } });
  merges.push({ s: { r: curRow, c: 1 }, e: { r: curRow, c: 2 } });

  setCell(curRow, 3, {
    f: `SUM(D${incStartRow1}:D${incEndRow1})`,
    v: summary.incomeBruto,
    t: 'n',
    z: ACCOUNTING_NO_DEC,
    s: { font: { bold: true, sz: 10, color: { rgb: '006100' } }, fill: { fgColor: { rgb: 'C6EFCE' } }, alignment: { horizontal: 'right', vertical: 'center' }, border: borderSubtotal }
  });
  curRow++;

  const summaryCalcRows = [
    {
      title: 'Total Pengeluaran Operasional Bulanan',
      desc: 'Beban Operasional Apotek',
      formula: `D${opsSubtotalRow1}`,
      val: totalOpsAmount,
      isGreen: false
    },
    {
      title: 'Total Kebutuhan Owner',
      desc: 'Penarikan & Alokasi Pemilik',
      formula: `D${ownerSubtotalRow1}`,
      val: totalOwnerAmount,
      isGreen: false
    },
    {
      title: 'SISA PENGHASILAN BERSIH (NETO)',
      desc: 'Pemasukan - Pengeluaran Bulanan',
      formula: `D${incSubtotalRow1}-D${opsSubtotalRow1}`,
      val: summary.incomeNeto,
      isGreen: true
    },
    {
      title: 'Alokasi Profit Perusahaan (15%)',
      desc: 'Dana Cadangan & Pengembangan',
      formula: undefined,
      val: summary.profitPerusahaan,
      isGreen: false
    },
    {
      title: 'Alokasi Profit Owner (20%)',
      desc: 'Bagi Hasil Pemilik Apotek',
      formula: undefined,
      val: summary.profitOwner,
      isGreen: false
    },
    {
      title: 'SISA SALDO KAS BERSIH',
      desc: 'Setelah Pengeluaran & Pembagian',
      formula: undefined,
      val: Math.max(0, summary.incomeNeto - (summary.profitPerusahaan + summary.profitOwner)),
      isGreen: true,
      isDoubleBorder: true
    }
  ];

  summaryCalcRows.forEach(item => {
    const bgFill = item.isGreen ? { fgColor: { rgb: 'C6EFCE' } } : undefined;
    const fontColor = item.isGreen ? { rgb: '006100' } : { rgb: '262626' };
    const borderStyle = item.isDoubleBorder ? borderSubtotal : borderThin;

    setCell(curRow, 0, { v: '', t: 's', s: { fill: bgFill, border: borderStyle } });
    setCell(curRow, 1, {
      v: item.title,
      t: 's',
      s: { font: { bold: item.isGreen, sz: item.isDoubleBorder ? 11 : 10, color: fontColor }, fill: bgFill, alignment: { horizontal: 'left', vertical: 'center' }, border: borderStyle }
    });
    setCell(curRow, 2, {
      v: item.desc,
      t: 's',
      s: { font: { italic: true, sz: 9, color: { rgb: '666666' } }, fill: bgFill, alignment: { horizontal: 'left', vertical: 'center' }, border: borderStyle }
    });
    setCell(curRow, 3, {
      ...(item.formula ? { f: item.formula } : {}),
      v: item.val,
      t: 'n',
      z: ACCOUNTING_NO_DEC,
      s: { font: { bold: item.isGreen, sz: item.isDoubleBorder ? 11 : 10, color: fontColor }, fill: bgFill, alignment: { horizontal: 'right', vertical: 'center' }, border: borderStyle }
    });
    curRow++;
  });

  curRow++; // divider

  // Signature Block
  setCell(curRow, 1, {
    v: 'Mengetahui / Menyetujui:',
    t: 's',
    s: { font: { sz: 10, color: { rgb: '555555' } }, alignment: { horizontal: 'center' } }
  });
  setCell(curRow, 3, {
    v: `Majalengka, ${format(new Date(), 'dd MMMM yyyy')}`,
    t: 's',
    s: { font: { sz: 10, color: { rgb: '555555' } }, alignment: { horizontal: 'center' } }
  });
  curRow++;

  setCell(curRow, 1, {
    v: 'Pimpinan / Owner',
    t: 's',
    s: { font: { bold: true, sz: 10 }, alignment: { horizontal: 'center' } }
  });
  setCell(curRow, 3, {
    v: 'Bagian Keuangan / Kasir',
    t: 's',
    s: { font: { bold: true, sz: 10 }, alignment: { horizontal: 'center' } }
  });
  curRow += 3;

  setCell(curRow, 1, {
    v: '( ________________________ )',
    t: 's',
    s: { font: { bold: true, sz: 10 }, alignment: { horizontal: 'center' } }
  });
  setCell(curRow, 3, {
    v: '( ________________________ )',
    t: 's',
    s: { font: { bold: true, sz: 10 }, alignment: { horizontal: 'center' } }
  });
  curRow++;

  ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: curRow - 1, c: 3 } });
  ws['!cols'] = [
    { wch: 8 },  // NO
    { wch: 42 }, // URAIAN
    { wch: 34 }, // KETERANGAN
    { wch: 25 }  // JUMLAH
  ];
  ws['!merges'] = merges;

  return ws;
};

// ==========================================
// 5. DETAIL TRANSACTIONS SHEET
// ==========================================
export const buildDetailTransactionsSheet = (transactions: Transaction[]): XLSX.WorkSheet => {
  const txHeader = ['No', 'Tanggal', 'Tipe', 'Kategori', 'Metode', 'Pemasukan', 'Pengeluaran', 'Keterangan'];
  
  const txData: any[][] = transactions.map((t, index) => {
    return [
      index + 1,
      format(new Date(t.date), 'dd/MM/yyyy'),
      t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
      t.category,
      t.method.toUpperCase(),
      t.type === 'income' ? t.amount : 0,
      t.type === 'outcome' ? t.amount : 0,
      t.notes || '-'
    ];
  });

  const lastDataRow = transactions.length + 1;
  txData.push([
    '', '', '', '', 'TOTAL',
    { t: 'n', f: `SUBTOTAL(109,F2:F${lastDataRow})` },
    { t: 'n', f: `SUBTOTAL(109,G2:G${lastDataRow})` },
    ''
  ]);

  const wsTx = XLSX.utils.aoa_to_sheet([txHeader, ...txData]);

  const maxColsLength = txHeader.map(h => h.length);
  txData.forEach(row => {
    row.forEach((cell, i) => {
      let valStr = '';
      if (cell !== null && cell !== undefined) {
        if (typeof cell === 'object' && cell.f) {
          valStr = 'Rp 99.999.999';
        } else if (typeof cell === 'number') {
          valStr = formatRupiah(cell);
        } else {
          valStr = cell.toString();
        }
      }
      if (valStr.length > maxColsLength[i]) {
        maxColsLength[i] = valStr.length;
      }
    });
  });
  wsTx['!cols'] = maxColsLength.map(w => ({ wch: Math.max(w + 2, 10) }));

  for (const cell in wsTx) {
    if (cell[0] === '!') continue;
    const rowNumber = parseInt(cell.match(/[0-9]+/)?.[0] || "0");
    const colStr = cell.replace(/[0-9]/g, '');
    
    if (!wsTx[cell].s) wsTx[cell].s = {};
    wsTx[cell].s.border = borderThin;
    
    if (rowNumber === 1) {
      wsTx[cell].s.font = { bold: true, color: { rgb: "FFFFFF" } };
      wsTx[cell].s.fill = { fgColor: { rgb: "1F4E79" } };
      wsTx[cell].s.alignment = { horizontal: 'center' };
    }
    
    if ((colStr === 'F' || colStr === 'G') && rowNumber > 1) {
      wsTx[cell].z = ACCOUNTING_NO_DEC;
    }

    if (rowNumber === txData.length + 1) {
      wsTx[cell].s.font = { bold: true };
      wsTx[cell].s.fill = { fgColor: { rgb: "C6EFCE" } };
      if (wsTx[cell].v === 'TOTAL') {
        wsTx[cell].s.alignment = { horizontal: 'right' };
      }
    }
  }

  wsTx['!autofilter'] = { ref: `A1:H${lastDataRow}` };
  return wsTx;
};

// ==========================================
// 6. SUMMARY SHEET
// ==========================================
export const buildSummarySheet = (profile: CompanyProfile, title: string, s: DetailedSummary): XLSX.WorkSheet => {
  const summaryData: any[][] = [
    [profile.name],
    [profile.address],
    [`WhatsApp: ${profile.whatsapp}`],
    [],
    [title],
    [],
    ['Ringkasan', 'Nilai'],
    ['Income Bruto', s.incomeBruto]
  ];

  s.incomeBreakdown.forEach(item => {
    summaryData.push([` - ${item.name}`, item.amount]);
  });

  summaryData.push(['Pengeluaran Cash', s.pengeluaranCashTotal]);
  s.pengeluaranCashBreakdown.forEach(item => {
    summaryData.push([` - ${item.name}`, item.amount]);
  });

  summaryData.push(['Pengeluaran TF', s.pengeluaranTfTotal]);
  s.pengeluaranTfBreakdown.forEach(item => {
    summaryData.push([` - ${item.name}`, item.amount]);
  });

  summaryData.push(['Profit Perusahaan 15%', s.profitPerusahaan]);
  summaryData.push(['Profit Owner', s.profitOwner]);
  summaryData.push(['Income Neto', s.incomeNeto]);

  const ws = XLSX.utils.aoa_to_sheet(summaryData);

  for (const cell in ws) {
    if (cell[0] === '!') continue;
    const val = ws[cell].v;
    if (!ws[cell].s) ws[cell].s = {};
    if (val === 'Ringkasan' || val === 'Nilai') {
      ws[cell].s.font = { bold: true };
      ws[cell].s.fill = { fgColor: { rgb: "D9E1F2" } };
    }
    if (val === profile.name) {
      ws[cell].s.font = { bold: true, sz: 14, color: { rgb: "1F4E79" } };
    }
    if (val === title) {
      ws[cell].s.font = { bold: true, sz: 12 };
    }
    if (typeof val === 'number') {
      ws[cell].z = ACCOUNTING_NO_DEC;
    }
  }
  ws['!cols'] = [{ wch: 30 }, { wch: 25 }];
  return ws;
};

// ==========================================
// 7. EXPORT REPORT TAHUNAN (12 Bulan Closing Monthly)
// ==========================================
export const exportYearlyReportExcel = (
  allTransactions: Transaction[],
  profile: CompanyProfile,
  year: number,
  loans: Loan[] = []
) => {
  const wb = XLSX.utils.book_new();
  const yy = String(year).slice(-2);

  let runningBalance = 0;
  const monthlySummaries: any[] = [];
  const monthlySheets: { sheetName: string; ws: XLSX.WorkSheet }[] = [];

  for (let m = 0; m < 12; m++) {
    const monthTxs = allTransactions.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === year && d.getMonth() === m;
    });

    const monthName = MONTH_NAMES_ID[m];
    const sheetName = `${monthName} ${yy}`;

    const { ws, endingBalance, stats } = buildClosingMonthlySheet(
      profile,
      year,
      m,
      monthTxs,
      runningBalance,
      loans
    );

    monthlySummaries.push({
      monthName: `${monthName} ${yy}`,
      sheetName,
      startingBalance: runningBalance,
      incomeBruto: stats.incomeBruto,
      opsExpenses: stats.opsExpenses,
      ownerExpenses: stats.ownerExpenses,
      totalExpenses: stats.totalExpenses,
      endingBalance
    });

    monthlySheets.push({ sheetName, ws });
    runningBalance = endingBalance;
  }

  // 1. Sheet 1: Master Year Recap (e.g. '2026')
  const wsYear = buildAnnualRecapSheet(profile, year, monthlySummaries);
  XLSX.utils.book_append_sheet(wb, wsYear, `${year}`);

  // 2. Sheets 2-13: Januari 26, Februari 26, ... Desember 26
  monthlySheets.forEach(({ sheetName, ws }) => {
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });

  const fileName = `Report_Tahunan_${year}_${profile.name.replace(/\s+/g, '_')}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

// ==========================================
// 8. EXPORT REPORT BULANAN
// ==========================================
export const exportMonthlyReportExcel = (data: ExportData) => {
  const { profile, transactions, monthYear, summary } = data;
  const wb = XLSX.utils.book_new();

  let year = new Date().getFullYear();
  let monthIdx = new Date().getMonth();
  if (transactions.length > 0) {
    const d = new Date(transactions[0].date);
    year = d.getFullYear();
    monthIdx = d.getMonth();
  }

  const yy = String(year).slice(-2);
  const currentMonthName = MONTH_NAMES_ID[monthIdx];

  // 1. Sheet 1: Closing Monthly (Exact Screenshot format)
  const { ws: wsClosing } = buildClosingMonthlySheet(profile, year, monthIdx, transactions, 0, data.loans || []);
  XLSX.utils.book_append_sheet(wb, wsClosing, `${currentMonthName} ${yy}`);

  // 2. Sheet 2: Report Bulanan (Category breakdown format)
  const wsReport = buildMonthlyReportSheet(profile, monthYear, transactions, summary);
  XLSX.utils.book_append_sheet(wb, wsReport, 'Report Bulanan');

  // 3. Sheet 3: Detail Transaksi
  const wsTx = buildDetailTransactionsSheet(transactions);
  XLSX.utils.book_append_sheet(wb, wsTx, 'Detail Transaksi');

  const fileName = `Report_Bulanan_${profile.name.replace(/\s+/g, '_')}_${monthYear.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

// ==========================================
// 9. FULL MULTI-SHEET EXPORT
// ==========================================
export const exportToExcel = (data: ExportData) => {
  const { profile, transactions, monthYear, summary } = data;
  const wb = XLSX.utils.book_new();

  let year = new Date().getFullYear();
  let monthIdx = new Date().getMonth();
  if (transactions.length > 0) {
    const d = new Date(transactions[0].date);
    year = d.getFullYear();
    monthIdx = d.getMonth();
  }
  const yy = String(year).slice(-2);
  const currentMonthName = MONTH_NAMES_ID[monthIdx];

  // 1. Sheet 1: Closing Monthly
  const { ws: wsClosing } = buildClosingMonthlySheet(profile, year, monthIdx, transactions, 0, data.loans || []);
  XLSX.utils.book_append_sheet(wb, wsClosing, `Closing ${currentMonthName} ${yy}`);

  // 2. Sheet 2: Report Bulanan
  const wsReport = buildMonthlyReportSheet(profile, monthYear, transactions, summary);
  XLSX.utils.book_append_sheet(wb, wsReport, 'Report Bulanan');

  // 3. Sheet 3: Ringkasan
  const mainTitle = `Laporan Keuangan - ${monthYear}`;
  const wsSummary = buildSummarySheet(profile, mainTitle, summary);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan');

  // 4. Sheet 4: Transaksi
  const wsTx = buildDetailTransactionsSheet(transactions);
  XLSX.utils.book_append_sheet(wb, wsTx, 'Transaksi');

  // 5. Per-day sheets
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
    const profitPerusahaan = incomeNeto > 0 ? incomeNeto * 0.15 : 0;
    const profitOwner = profitPerusahaan * 0.20;

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
  const usedSheetNames = new Set<string>([`Closing ${currentMonthName} ${yy}`, 'Report Bulanan', 'Ringkasan', 'Transaksi', 'Detail Transaksi']);

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
    const wsDay = buildSummarySheet(profile, title, daySummary);
    XLSX.utils.book_append_sheet(wb, wsDay, sheetName);
  });

  XLSX.writeFile(wb, `Laporan_Keuangan_${profile.name.replace(/\s+/g, '_')}_${monthYear.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
};
