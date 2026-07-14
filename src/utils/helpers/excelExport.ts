/**
 * exportTransactionsToExcel.ts
 * -----------------------------------------------------------------------
 * Recreates the official Nepal VAT "Sales Book" (बिक्री खाता) and
 * "Purchase Book" (खरिद खाता) layouts EXACTLY using exceljs.
 * -----------------------------------------------------------------------
 */

import ExcelJS from "exceljs";

interface Transaction {
  transaction_id: string;
  client_id: string;
  transaction_type: string;
  transaction_date: string;
  invoice_no: number | string;
  pan_no: number | string;
  party: string;
  amount: number;
  taxable: number;
  non_taxable: number;
  vat: number;
  vat_amount: number;
  grand_total: number;
  client_name: string;
  import: boolean;
  capital: boolean;
  debit_invoice_no?: number | string;
  credit_invoice_no?: number | string;
}

interface ClientData {
  name: string;
  pan: string;
  year?: string;
  vatPeriod?: string;
}

interface ExportExcelParams {
  transactions: Transaction[];
  clientData?: ClientData;
  filename?: string;
}

const GRAY_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE7E6E6" } };
const WHITE_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } };
const THIN_BOX: Partial<ExcelJS.Borders> = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
const DOUBLE_BOTTOM_BOX: Partial<ExcelJS.Borders> = { top: { style: "thin" }, bottom: { style: "double" }, left: { style: "thin" }, right: { style: "thin" } };

const FONT_TITLE: Partial<ExcelJS.Font> = { name: "Noto Sans Devanagari", size: 18, bold: true, color: { argb: "FF000000" } };
const FONT_SUBTITLE: Partial<ExcelJS.Font> = { name: "Calibri", size: 11, bold: false, color: { argb: "FF000000" } };
const FONT_INFO_LINE: Partial<ExcelJS.Font> = { name: "Noto Sans Devanagari", size: 10, bold: true, color: { argb: "FF000000" } };
const FONT_HEADER_BOLD: Partial<ExcelJS.Font> = { name: "Noto Sans Devanagari", size: 10, bold: true, color: { argb: "FF000000" } };
const FONT_HEADER_SMALL: Partial<ExcelJS.Font> = { name: "Noto Sans Devanagari", size: 9, bold: false, color: { argb: "FF000000" } };
const FONT_DATA: Partial<ExcelJS.Font> = { name: "Calibri", size: 10, bold: false, color: { argb: "FF000000" } };
const FONT_TOTALS: Partial<ExcelJS.Font> = { name: "Noto Sans Devanagari", size: 10, bold: true, color: { argb: "FF000000" } };

const CENTER_WRAP: Partial<ExcelJS.Alignment> = { horizontal: "center", vertical: "middle", wrapText: true };

function toExcelDate(value: string): Date | string {
  if (!value) return "";
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? value : parsed;
}

function styledMerge(ws: ExcelJS.Worksheet, range: string, value: any, opts: any) {
  const [startRef, endRef] = range.split(":");
  ws.getCell(startRef).value = value;
  const startCell = ws.getCell(startRef);
  const endCell = ws.getCell(endRef);
  for (let r : any = startCell.row; r <= endCell.row; r++) {
    for (let c : any = startCell.col; c <= endCell.col; c++) {
      const cell = ws.getCell(r, c);
      cell.font = opts.font;
      if (opts.fill) cell.fill = opts.fill;
      cell.alignment = opts.align ?? CENTER_WRAP;
      cell.border = opts.border ?? THIN_BOX;
    }
  }
  ws.mergeCells(range);
}

function styledCell(ws: ExcelJS.Worksheet, ref: string, value: any, opts: any) {
  const cell = ws.getCell(ref);
  cell.value = value;
  cell.font = opts.font;
  if (opts.fill) cell.fill = opts.fill;
  cell.alignment = opts.align ?? CENTER_WRAP;
  cell.border = opts.border ?? THIN_BOX;
}

function writeDataCell(ws: ExcelJS.Worksheet, row: number, col: number, value: any, isNumeric = false) {
  const cell = ws.getCell(row, col);
  cell.value = value;
  cell.font = FONT_DATA;
  cell.border = THIN_BOX;
  cell.alignment = {
    vertical: "middle",
    horizontal: isNumeric ? "right" : "left",
    wrapText: !isNumeric,
  };
  if (isNumeric) {
    cell.numFmt = "#,##0.00";
  }
}

function buildSalesSheet(wb: ExcelJS.Workbook, salesTransactions: Transaction[], clientPan: string, clientName: string, year: string, vatPeriod: string) {
  const ws = wb.addWorksheet("Sales Book");
  const widths = [16, 18, 32, 18, 18, 18, 18, 16, 18, 18, 18, 16];
  widths.forEach((w, i) => (ws.getColumn(i + 1).width = w));

  ws.getRow(1).height = 30; ws.getRow(2).height = 20; ws.getRow(3).height = 12;
  ws.getRow(4).height = 24; ws.getRow(5).height = 26; ws.getRow(6).height = 36;

  styledMerge(ws, "A1:L1", "बिक्री खाता", { font: FONT_TITLE, fill: GRAY_FILL });
  styledMerge(ws, "A2:L2", "(नियम २३ को उपनियम (१) को खण्ड  (ज) संग सम्बन्धित ) ", { font: FONT_SUBTITLE });
  styledMerge(ws, "A3:L3", "", { font: FONT_SUBTITLE, fill: GRAY_FILL });
  styledMerge(ws, "A4:L4", `करदाता दर्ता नं (PAN) : ${clientPan}          करदाताको नाम: ${clientName}          साल: ${year}         कर अवधि: ${vatPeriod}`, { font: FONT_INFO_LINE, fill: GRAY_FILL });

  styledMerge(ws, "A5:D5", "बीजक", { font: FONT_HEADER_BOLD, fill: WHITE_FILL });
  styledMerge(ws, "E5:E6", "जम्मा बिक्री / निकासी (रु)", { font: FONT_HEADER_SMALL, fill: WHITE_FILL });
  styledMerge(ws, "F5:F6", "स्थानीय कर छुटको बिक्री  मूल्य (रु)", { font: FONT_HEADER_SMALL, fill: WHITE_FILL });
  styledMerge(ws, "G5:H5", "करयोग्य बिक्री", { font: FONT_HEADER_BOLD, fill: WHITE_FILL });
  styledMerge(ws, "I5:L5", "निकासी", { font: FONT_HEADER_BOLD, fill: WHITE_FILL });

  const headers = [["A6", "मिति"], ["B6", "बीजक नम्बर"], ["C6", "खरिदकर्ताको नाम"], ["D6", "खरिदकर्ताको स्थायी लेखा नम्बर"], ["G6", "मूल्य (रु)"], ["H6", "कर (रु)"], ["I6", "निकासी गरेको वस्तु वा सेवाको मूल्य (रु)"], ["J6", "निकासी गरेको देश"], ["K6", "निकासी प्रज्ञापनपत्र नम्बर"], ["L6", "निकासी प्रज्ञापनपत्र मिति"]];
  headers.forEach(([ref, text]) => styledCell(ws, ref, text, { font: FONT_HEADER_SMALL, fill: WHITE_FILL }));

  let currentRow = 7;
  salesTransactions.forEach((tx) => {
    const isReturn = tx.transaction_type?.toUpperCase().includes("RETURN");
    let rowTaxable = tx.taxable ?? 0;
    let rowNonTaxable = tx.non_taxable ?? 0;
    let rowTax = tx.vat_amount ?? 0;

    if (isReturn) {
      rowTaxable = -Math.abs(rowTaxable);
      rowNonTaxable = -Math.abs(rowNonTaxable);
      rowTax = -Math.abs(rowTax);
    }
    const rowTotal = rowTaxable + rowNonTaxable + rowTax;
    const isExport = tx.import ?? false;

    let finalInvoice = String(tx.invoice_no || "-");
    if (isReturn) {
      finalInvoice = [
        tx.debit_invoice_no && tx.debit_invoice_no !== 0 ? `Dr: ${tx.debit_invoice_no}` : "",
        tx.credit_invoice_no && tx.credit_invoice_no !== 0 ? `Cr: ${tx.credit_invoice_no}` : ""
      ].filter(Boolean).join(" | ") || String(tx.invoice_no || "-");
    }

    writeDataCell(ws, currentRow, 1, toExcelDate(tx.transaction_date));
    ws.getCell(currentRow, 1).numFmt = "yyyy-mm-dd";
    writeDataCell(ws, currentRow, 2, finalInvoice);
    writeDataCell(ws, currentRow, 3, tx.party || "N/A");
    writeDataCell(ws, currentRow, 4, tx.pan_no ? String(tx.pan_no) : "");
    writeDataCell(ws, currentRow, 5, rowTotal, true);
    writeDataCell(ws, currentRow, 6, rowNonTaxable, true);
    writeDataCell(ws, currentRow, 7, isExport ? 0 : rowTaxable, true);
    writeDataCell(ws, currentRow, 8, isExport ? 0 : rowTax, true);
    writeDataCell(ws, currentRow, 9, isExport ? rowTaxable : 0, true);
    writeDataCell(ws, currentRow, 10, "");
    writeDataCell(ws, currentRow, 11, "");
    writeDataCell(ws, currentRow, 12, "");

    ws.getRow(currentRow).height = 20;
    currentRow++;
  });

  ws.mergeCells(`A${currentRow}:D${currentRow}`);
  const lbl = ws.getCell(`A${currentRow}`); lbl.value = "जम्मा (Total)"; lbl.font = FONT_TOTALS; lbl.alignment = { horizontal: "center", vertical: "middle" };

  for (let col = 1; col <= 12; col++) {
    const cell = ws.getCell(currentRow, col); cell.border = DOUBLE_BOTTOM_BOX; cell.fill = GRAY_FILL;
    if (col >= 5 && col <= 9) {
      const letter = ws.getColumn(col).letter;
      cell.value = { formula: `=SUM(${letter}7:${letter}${currentRow - 1})` };
      cell.font = FONT_TOTALS; cell.numFmt = "#,##0.00"; cell.alignment = { horizontal: "right", vertical: "middle" };
    }
  }
  ws.getRow(currentRow).height = 24;
}

function buildPurchaseSheet(wb: ExcelJS.Workbook, purchaseTransactions: Transaction[], clientPan: string, clientName: string, year: string, vatPeriod: string) {
  const ws = wb.addWorksheet("Purchase Book");
  const widths = [16, 16, 18, 32, 18, 18, 18, 16, 16, 16, 16, 16, 16];
  widths.forEach((w, i) => (ws.getColumn(i + 1).width = w));

  ws.getRow(1).height = 30; ws.getRow(2).height = 20; ws.getRow(3).height = 12;
  ws.getRow(4).height = 24; ws.getRow(5).height = 26; ws.getRow(6).height = 36;

  styledMerge(ws, "A1:M1", "खरिद खाता", { font: FONT_TITLE });
  styledMerge(ws, "A2:M2", "(नियम २३ को उपनियम (१) को खण्ड  (छ) संग सम्बन्धित ) ", { font: FONT_SUBTITLE });
  styledMerge(ws, "A3:M3", "", { font: FONT_SUBTITLE });
  styledMerge(ws, "A4:M4", `करदाता दर्ता नं (PAN) : ${clientPan}          करदाताको नाम: ${clientName}          साल: ${year}         कर अवधि: ${vatPeriod}`, { font: FONT_INFO_LINE, fill: GRAY_FILL });

  styledMerge(ws, "A5:E5", "बीजक / प्रज्ञापनपत्र नम्बर", { font: FONT_HEADER_BOLD, fill: WHITE_FILL });
  styledMerge(ws, "F5:F6", "जम्मा खरिद मूल्य (रु)", { font: FONT_HEADER_SMALL, fill: WHITE_FILL });
  styledMerge(ws, "G5:G6", "कर छुट हुने वस्तु वा सेवाको खरिद / पैठारी मूल्य (रु)", { font: FONT_HEADER_SMALL, fill: WHITE_FILL });
  styledMerge(ws, "H5:I5", "करयोग्य खरिद (पूंजीगत बाहेक)", { font: FONT_HEADER_BOLD, fill: WHITE_FILL });
  styledMerge(ws, "J5:K5", "करयोग्य पैठारी (पूंजीगत बाहेक)", { font: FONT_HEADER_BOLD, fill: WHITE_FILL });
  styledMerge(ws, "L5:M5", "पूंजीगत करयोग्य खरिद / पैठारी ", { font: FONT_HEADER_BOLD, fill: WHITE_FILL });

  const headers = [["A6", "मिति"], ["B6", "बीजक नं."], ["C6", "प्रज्ञापनपत्र नं."], ["D6", "आपूर्तिकर्ताको नाम"], ["E6", "आपूर्तिकर्ताको स्थायी लेखा नम्बर"], ["H6", "मूल्य (रु)"], ["I6", "कर (रु)"], ["J6", "मूल्य (रु)"], ["K6", "कर (रु)"], ["L6", "मूल्य (रु)"], ["M6", "कर (रु)"]];
  headers.forEach(([ref, text]) => styledCell(ws, ref, text, { font: FONT_HEADER_SMALL, fill: WHITE_FILL }));

  let currentRow = 7;
  purchaseTransactions.forEach((tx) => {
    const isReturn = tx.transaction_type?.toUpperCase().includes("RETURN");
    let rowTaxable = tx.taxable ?? 0;
    let rowNonTaxable = tx.non_taxable ?? 0;
    let rowTax = tx.vat_amount ?? 0;

    if (isReturn) {
      rowTaxable = -Math.abs(rowTaxable);
      rowNonTaxable = -Math.abs(rowNonTaxable);
      rowTax = -Math.abs(rowTax);
    }
    const rowTotal = rowTaxable + rowNonTaxable + rowTax;
    const isImport = tx.import ?? false;
    const isCapital = tx.capital ?? false;

    let finalInvoice = String(tx.invoice_no || "-");
    if (isReturn) {
      finalInvoice = [
        tx.debit_invoice_no && tx.debit_invoice_no !== 0 ? `Dr: ${tx.debit_invoice_no}` : "",
        tx.credit_invoice_no && tx.credit_invoice_no !== 0 ? `Cr: ${tx.credit_invoice_no}` : ""
      ].filter(Boolean).join(" | ") || String(tx.invoice_no || "-");
    }

    writeDataCell(ws, currentRow, 1, toExcelDate(tx.transaction_date));
    ws.getCell(currentRow, 1).numFmt = "yyyy-mm-dd";
    writeDataCell(ws, currentRow, 2, finalInvoice);
    writeDataCell(ws, currentRow, 3, isImport ? finalInvoice : "");
    writeDataCell(ws, currentRow, 4, tx.party || "N/A");
    writeDataCell(ws, currentRow, 5, tx.pan_no ? String(tx.pan_no) : "");
    writeDataCell(ws, currentRow, 6, rowTotal, true);
    writeDataCell(ws, currentRow, 7, rowNonTaxable, true);
    writeDataCell(ws, currentRow, 8, !isCapital && !isImport ? rowTaxable : 0, true);
    writeDataCell(ws, currentRow, 9, !isCapital && !isImport ? rowTax : 0, true);
    writeDataCell(ws, currentRow, 10, !isCapital && isImport ? rowTaxable : 0, true);
    writeDataCell(ws, currentRow, 11, !isCapital && isImport ? rowTax : 0, true);
    writeDataCell(ws, currentRow, 12, isCapital ? rowTaxable : 0, true);
    writeDataCell(ws, currentRow, 13, isCapital ? rowTax : 0, true);

    ws.getRow(currentRow).height = 20;
    currentRow++;
  });

  ws.mergeCells(`A${currentRow}:E${currentRow}`);
  const lbl = ws.getCell(`A${currentRow}`); lbl.value = "जम्मा (Total)"; lbl.font = FONT_TOTALS; lbl.alignment = { horizontal: "center", vertical: "middle" };

  for (let col = 1; col <= 13; col++) {
    const cell = ws.getCell(currentRow, col); cell.border = DOUBLE_BOTTOM_BOX; cell.fill = GRAY_FILL;
    if (col >= 6 && col <= 13) {
      const letter = ws.getColumn(col).letter;
      cell.value = { formula: `=SUM(${letter}7:${letter}${currentRow - 1})` };
      cell.font = FONT_TOTALS; cell.numFmt = "#,##0.00"; cell.alignment = { horizontal: "right", vertical: "middle" };
    }
  }
  ws.getRow(currentRow).height = 24;
}

export const exportTransactionsToExcel = async ({ transactions, clientData, filename }: ExportExcelParams) => {
  const wb = new ExcelJS.Workbook();

  const salesTransactions = transactions.filter((t) => t.transaction_type?.toUpperCase().includes("SALE"));
  const purchaseTransactions = transactions.filter((t) => t.transaction_type?.toUpperCase().includes("PURCHASE"));

  const firstTx = transactions[0];
  const name = clientData?.name || firstTx?.client_name || "All Clients Consolidated";
  const pan = clientData?.pan || (firstTx?.pan_no ? String(firstTx.pan_no) : "Multiple");
  const year = clientData?.year || "2026/27";
  const period = clientData?.vatPeriod || "Consolidated";

  buildSalesSheet(wb, salesTransactions, pan, name, year, period);
  buildPurchaseSheet(wb, purchaseTransactions, pan, name, year, period);

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || `VAT_Books_${new Date().toISOString().split("T")[0]}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};