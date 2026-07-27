import { useState } from 'react';
import type { TripState } from '../types';
import {
  getCategoryTotals,
  getGrandTotal,
  getPersonReceiptShares,
  getPersonSummaries,
  personName,
} from '../calculations';
import { formatCurrency, formatDate } from '../format';

interface Props {
  trip: TripState;
}

export function Dashboard({ trip }: Props) {
  const grandTotal = getGrandTotal(trip.receipts);
  const categoryTotals = getCategoryTotals(trip)
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total);
  const personSummaries = getPersonSummaries(trip);
  const [expandedPersonId, setExpandedPersonId] = useState<string | null>(null);

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
          {personSummaries.map((s) => {
            const isExpanded = expandedPersonId === s.personId;
            const receiptShares = isExpanded ? getPersonReceiptShares(trip, s.personId) : [];
            return (
              <li key={s.personId} className="person-summary-item">
                <button
                  type="button"
                  className="person-summary-row person-summary-toggle"
                  onClick={() => setExpandedPersonId(isExpanded ? null : s.personId)}
                  aria-expanded={isExpanded}
                >
                  <span className="person-summary-name">
                    <span className={`expand-caret ${isExpanded ? 'open' : ''}`}>▸</span>
                    {personName(trip.people, s.personId)}
                  </span>
                  <span className="person-summary-stats">
                    bezahlt {formatCurrency(s.paid)} · Anteil {formatCurrency(s.share)}
                  </span>
                </button>

                {isExpanded && (
                  <div className="person-receipt-breakdown">
                    {receiptShares.length === 0 ? (
                      <p className="empty-hint">Für diese Person sind keine Kassenzettel aufgeteilt.</p>
                    ) : (
                      <ul className="person-receipt-list">
                        {receiptShares.map(({ receipt, share }) => {
                          const category = trip.categories.find((c) => c.id === receipt.categoryId);
                          return (
                            <li key={receipt.id} className="person-receipt-row">
                              <div className="person-receipt-info">
                                <span className="receipt-category">{category?.icon ?? '💶'}</span>
                                <div>
                                  <div className="person-receipt-title">{receipt.description}</div>
                                  <div className="receipt-meta">
                                    {formatDate(receipt.date)} · Beleg {formatCurrency(receipt.amount)}{' '}
                                    ÷ {receipt.splitBetweenIds.length}
                                  </div>
                                </div>
                              </div>
                              <span className="person-receipt-share">{formatCurrency(share)}</span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
