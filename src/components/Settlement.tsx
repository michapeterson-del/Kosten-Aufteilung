import type { TripState } from '../types';
import { getPersonSummaries, getSettlements, personName } from '../calculations';
import { formatCurrency } from '../format';

interface Props {
  trip: TripState;
}

export function Settlement({ trip }: Props) {
  const summaries = getPersonSummaries(trip);
  const settlements = getSettlements(summaries);

  return (
    <div className="card">
      <h2>Abrechnung zum Urlaubsende</h2>
      <p className="section-hint">
        So gleicht ihr am Ende gerecht aus, wer wem wie viel schuldet — mit möglichst wenigen
        Überweisungen.
      </p>

      {trip.people.length === 0 ? (
        <p className="empty-hint">Füge Mitreisende und Kassenzettel hinzu, um eine Abrechnung zu sehen.</p>
      ) : (
        <>
          <ul className="balance-list">
            {summaries.map((s) => (
              <li key={s.personId} className="balance-row">
                <span>{personName(trip.people, s.personId)}</span>
                <span
                  className={
                    s.balance > 0.005 ? 'balance-positive' : s.balance < -0.005 ? 'balance-negative' : ''
                  }
                >
                  {s.balance > 0.005
                    ? `bekommt ${formatCurrency(s.balance)}`
                    : s.balance < -0.005
                      ? `schuldet ${formatCurrency(-s.balance)}`
                      : 'ausgeglichen'}
                </span>
              </li>
            ))}
          </ul>

          <h3>Wer zahlt wem?</h3>
          {settlements.length === 0 ? (
            <p className="empty-hint">Alle sind bereits ausgeglichen. 🎉</p>
          ) : (
            <ul className="settlement-list">
              {settlements.map((s, idx) => (
                <li key={idx} className="settlement-row">
                  <span className="settlement-from">{personName(trip.people, s.fromId)}</span>
                  <span className="settlement-arrow">→</span>
                  <span className="settlement-to">{personName(trip.people, s.toId)}</span>
                  <span className="settlement-amount">{formatCurrency(s.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
