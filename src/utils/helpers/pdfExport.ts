import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface PDFExportOptions {
  title: string;
  subtitle?: string;
  columns: string[];
  data: any[][];
  filename: string;
}

export const exportTableToPDF = ({ title, subtitle, columns, data, filename }: PDFExportOptions) => {
  const doc = new jsPDF();
  
  doc.setFontSize(16);
  doc.text(title, 14, 15);
  
  let startY = 22;
  if (subtitle) {
    doc.setFontSize(10);
    doc.text(subtitle, 14, 22);
    startY = 28;
  }

  autoTable(doc, {
    head: [columns],
    body: data,
    startY,
    styles: { cellPadding: 2, fontSize: 8 },
  });

  doc.save(filename);
};
