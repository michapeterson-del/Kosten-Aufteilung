import type { Category, Person, Receipt } from '../types';
import { personName } from '../calculations';
import { formatCurrency, formatDate } from '../format';

interface Props {
  receipts: Receipt[];
  people: Person[];
  categories: Category[];
  onRemove: (id: string) => void;
}

export function ReceiptList({ receipts, people, categories, onRemove }: Props) {
  const sorted = [...receipts].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="card">
      <h2>Alle Kassenzettel ({receipts.length})</h2>
      {sorted.length === 0 ? (
        <p className="empty-hint">Noch keine Kassenzettel erfasst.</p>
      ) : (
        <ul className="receipt-list">
          {sorted.map((r) => {
            const category = categories.find((c) => c.id === r.categoryId);
            return (
              <li key={r.id} className="receipt-item">
                <div className="receipt-main">
                  <span className="receipt-category">{category?.icon ?? '💶'}</span>
                  <div className="receipt-details">
                    <div className="receipt-title">{r.description}</div>
                    <div className="receipt-meta">
                      {formatDate(r.date)} · {category?.name ?? 'Sonstiges'} · bezahlt von{' '}
                      {personName(people, r.paidById)} · geteilt auf{' '}
                      {r.splitBetweenIds.map((id) => personName(people, id)).join(', ')}
                    </div>
                  </div>
                </div>
                <div className="receipt-amount">
                  {formatCurrency(r.amount)}
                  <button
                    type="button"
                    className="chip-remove"
                    onClick={() => onRemove(r.id)}
                    aria-label="Kassenzettel löschen"
                  >
                    ×
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
