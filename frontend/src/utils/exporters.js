import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate, formatMoney, TYPE_LABEL } from './format';

const rowsOf = (items) =>
  items.map((t) => ({
    Fecha: formatDate(t.date),
    Tipo: TYPE_LABEL[t.type],
    Categoría: t.categoryName,
    Cuenta: t.accountName,
    Descripción: t.description || '',
    'Monto (S/)': t.type === 'expense' ? -t.amount : t.amount,
  }));

/** Excel con SheetJS: una columna por campo del movimiento + hoja de resumen. */
export function exportExcel({ items, totals, fileName, periodLabel, userName }) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rowsOf(items));
  ws['!cols'] = [{ wch: 12 }, { wch: 10 }, { wch: 18 }, { wch: 18 }, { wch: 32 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Movimientos');
  const summary = XLSX.utils.aoa_to_sheet([
    ['Reporte de finanzas personales'],
    ['Usuario', userName],
    ['Periodo', periodLabel],
    ['Movimientos', items.length],
    ['Total ingresos (S/)', totals.income],
    ['Total gastos (S/)', totals.expense],
    ['Balance (S/)', totals.net],
  ]);
  summary['!cols'] = [{ wch: 22 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, summary, 'Resumen');
  XLSX.writeFile(wb, fileName);
}

/** PDF con jsPDF + autotable: encabezado con usuario y periodo, tabla y totales. */
export function exportPdf({ items, totals, fileName, periodLabel, userName }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  doc.setFontSize(16);
  doc.setTextColor(29, 78, 216);
  doc.text('Reporte de finanzas personales', 40, 50);
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(`Usuario: ${userName}`, 40, 70);
  doc.text(`Periodo: ${periodLabel}`, 40, 84);
  doc.text(`Generado: ${new Date().toLocaleString('es-PE')}`, 40, 98);

  autoTable(doc, {
    startY: 115,
    head: [['Fecha', 'Tipo', 'Categoría', 'Cuenta', 'Descripción', 'Monto']],
    body: items.map((t) => [
      formatDate(t.date),
      TYPE_LABEL[t.type],
      t.categoryName,
      t.accountName,
      t.description || '',
      (t.type === 'expense' ? '-' : '') + formatMoney(t.amount),
    ]),
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [37, 99, 235] },
    columnStyles: { 5: { halign: 'right' } },
  });

  const y = doc.lastAutoTable.finalY + 20;
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`Total ingresos: ${formatMoney(totals.income)}`, 40, y);
  doc.text(`Total gastos: ${formatMoney(totals.expense)}`, 40, y + 14);
  doc.text(`Balance: ${formatMoney(totals.net)}`, 40, y + 28);
  doc.save(fileName);
}
