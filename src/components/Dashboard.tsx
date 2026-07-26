import type { TripState } from '../types';
import { getCategoryTotals, getGrandTotal, getPersonSummaries, personName } from '../calculations';
import { formatCurrency } from '../format';

interface Props {
  trip: TripState;
}

export function Dashboard({ trip }: Props) {
  const grandTotal = getGrandTotal(trip.receipts);
  const categoryTotals = getCategoryTotals(trip)
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total);
  const personSummaries = getPersonSummaries(trip);

  return (
    <div className="card">
      <h2>Übersicht</h2>
      <div className="total-highlight">
        <span className="total-label">Gesamtausgaben</span>
        <span className="total-value">{formatCurrency(grandTotal)}</span>
      </div>

      <h3>Nach Kategorie</h3>
      {categoryTotals.length === 0 ? (
        <p className="empty-hint">Noch keine Ausgaben erfasst.</p>
      ) : (
        <ul className="bar-list">
          {categoryTotals.map((ct) => {
            const category = trip.categories.find((c) => c.id === ct.categoryId);
            const pct = grandTotal > 0 ? (ct.total / grandTotal) * 100 : 0;
            return (
              <li key={ct.categoryId} className="bar-row">
                <div className="bar-label">
                  <span>
                    {category?.icon ?? '💶'} {category?.name ?? 'Sonstiges'}
                  </span>
                  <span>{formatCurrency(ct.total)}</span>
                </div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${pct}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <h3>Nach Person</h3>
      {personSummaries.length === 0 ? (
        <p className="empty-hint">Noch keine Mitreisenden erfasst.</p>
      ) : (
        <ul className="person-summary-list">
          {personSummaries.map((s) => (
            <li key={s.personId} className="person-summary-row">
              <span className="person-summary-name">{personName(trip.people, s.personId)}</span>
              <span className="person-summary-stats">
                bezahlt {formatCurrency(s.paid)} · Anteil {formatCurrency(s.share)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
