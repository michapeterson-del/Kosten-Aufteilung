import type { TripState } from './types';
import {
  getCategoryTotals,
  getGrandTotal,
  getPersonSummaries,
  getSettlements,
  personName,
} from './calculations';
import { formatCurrency, formatDate } from './format';

function tripFilename(ext: string): string {
  const date = new Date().toISOString().slice(0, 10);
  return `Kosten-Aufteilung_${date}.${ext}`;
}

function categoryName(trip: TripState, categoryId: string): string {
  return trip.categories.find((c) => c.id === categoryId)?.name ?? 'Sonstiges';
}

export async function exportToExcel(trip: TripState): Promise<void> {
  const XLSX = await import('xlsx');

  const categoryTotals = getCategoryTotals(trip).filter((c) => c.total > 0);
  const personSummaries = getPersonSummaries(trip);
  const settlements = getSettlements(personSummaries);
  const sortedReceipts = [...trip.receipts].sort((a, b) => a.date.localeCompare(b.date));

  const summaryAoa: (string | number)[][] = [
    ['Kosten-Aufteilung – Übersicht'],
    [],
    ['Gesamtausgaben', getGrandTotal(trip.receipts)],
    [],
    ['Nach Kategorie'],
    ['Kategorie', 'Summe'],
    ...categoryTotals.map((c) => [categoryName(trip, c.categoryId), c.total]),
    [],
    ['Nach Person'],
    ['Person', 'Bezahlt', 'Anteil', 'Saldo'],
    ...personSummaries.map((s) => [
      personName(trip.people, s.personId),
      s.paid,
      s.share,
      s.balance,
    ]),
  ];

  const receiptsAoa: (string | number)[][] = [
    ['Datum', 'Beschreibung', 'Kategorie', 'Betrag', 'Bezahlt von', 'Aufgeteilt auf'],
    ...sortedReceipts.map((r) => [
      r.date,
      r.description,
      categoryName(trip, r.categoryId),
      r.amount,
      personName(trip.people, r.paidById),
      r.splitBetweenIds.map((id) => personName(trip.people, id)).join(', '),
    ]),
  ];
  if (sortedReceipts.length === 0) receiptsAoa.push(['Keine Kassenzettel erfasst.']);

  const settlementAoa: (string | number)[][] = [
    ['Von', 'An', 'Betrag'],
    ...settlements.map((s) => [
      personName(trip.people, s.fromId),
      personName(trip.people, s.toId),
      s.amount,
    ]),
  ];
  if (settlements.length === 0) settlementAoa.push(['Alle Salden sind ausgeglichen.']);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryAoa), 'Übersicht');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(receiptsAoa), 'Kassenzettel');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(settlementAoa), 'Abrechnung');

  XLSX.writeFile(wb, tripFilename('xlsx'));
}

export async function exportToPdf(trip: TripState): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF();
  const accent: [number, number, number] = [15, 118, 110];

  const grandTotal = getGrandTotal(trip.receipts);
  const categoryTotals = getCategoryTotals(trip).filter((c) => c.total > 0);
  const personSummaries = getPersonSummaries(trip);
  const settlements = getSettlements(personSummaries);
  const sortedReceipts = [...trip.receipts].sort((a, b) => a.date.localeCompare(b.date));

  const lastY = () => (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

  doc.setFontSize(18);
  doc.text('Kosten-Aufteilung', 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(`Erstellt am ${formatDate(new Date().toISOString().slice(0, 10))}`, 14, 24);
  doc.setFontSize(13);
  doc.setTextColor(20);
  doc.text(`Gesamtausgaben: ${formatCurrency(grandTotal)}`, 14, 33);

  autoTable(doc, {
    startY: 39,
    head: [['Kategorie', 'Summe']],
    body: categoryTotals.length
      ? categoryTotals.map((c) => [categoryName(trip, c.categoryId), formatCurrency(c.total)])
      : [['—', 'Keine Ausgaben erfasst.']],
    theme: 'striped',
    headStyles: { fillColor: accent },
    margin: { left: 14, right: 14 },
  });

  autoTable(doc, {
    startY: lastY() + 8,
    head: [['Person', 'Bezahlt', 'Anteil', 'Saldo']],
    body: personSummaries.length
      ? personSummaries.map((s) => [
          personName(trip.people, s.personId),
          formatCurrency(s.paid),
          formatCurrency(s.share),
          formatCurrency(s.balance),
        ])
      : [['—', '', '', '']],
    theme: 'striped',
    headStyles: { fillColor: accent },
    margin: { left: 14, right: 14 },
  });

  autoTable(doc, {
    startY: lastY() + 8,
    head: [['Wer zahlt wem?', '']],
    body: settlements.length
      ? settlements.map((s) => [
          `${personName(trip.people, s.fromId)} → ${personName(trip.people, s.toId)}`,
          formatCurrency(s.amount),
        ])
      : [['Alle Salden sind ausgeglichen.', '']],
    theme: 'striped',
    headStyles: { fillColor: accent },
    margin: { left: 14, right: 14 },
  });

  autoTable(doc, {
    startY: lastY() + 8,
    head: [['Datum', 'Beschreibung', 'Kategorie', 'Betrag', 'Bezahlt von', 'Aufgeteilt auf']],
    body: sortedReceipts.length
      ? sortedReceipts.map((r) => [
          formatDate(r.date),
          r.description,
          categoryName(trip, r.categoryId),
          formatCurrency(r.amount),
          personName(trip.people, r.paidById),
          r.splitBetweenIds.map((id) => personName(trip.people, id)).join(', '),
        ])
      : [['—', 'Keine Kassenzettel erfasst.', '', '', '', '']],
    theme: 'striped',
    headStyles: { fillColor: accent },
    styles: { fontSize: 8 },
    margin: { left: 14, right: 14 },
  });

  doc.save(tripFilename('pdf'));
}
