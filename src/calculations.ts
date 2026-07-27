import type { Person, Receipt, TripState } from './types';

export interface CategoryTotal {
  categoryId: string;
  total: number;
}

export interface PersonSummary {
  personId: string;
  paid: number;
  share: number;
  balance: number; // paid - share; positive = gets money back, negative = owes money
}

export interface Settlement {
  fromId: string;
  toId: string;
  amount: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function getGrandTotal(receipts: Receipt[]): number {
  return round2(receipts.reduce((sum, r) => sum + r.amount, 0));
}

export function getCategoryTotals(trip: TripState): CategoryTotal[] {
  return trip.categories.map((c) => ({
    categoryId: c.id,
    total: round2(
      trip.receipts.filter((r) => r.categoryId === c.id).reduce((sum, r) => sum + r.amount, 0),
    ),
  }));
}

export function getPersonSummaries(trip: TripState): PersonSummary[] {
  return trip.people.map((person) => {
    const paid = trip.receipts
      .filter((r) => r.paidById === person.id)
      .reduce((sum, r) => sum + r.amount, 0);

    const share = trip.receipts.reduce((sum, r) => {
      if (!r.splitBetweenIds.includes(person.id) || r.splitBetweenIds.length === 0) return sum;
      return sum + r.amount / r.splitBetweenIds.length;
    }, 0);

    return {
      personId: person.id,
      paid: round2(paid),
      share: round2(share),
      balance: round2(paid - share),
    };
  });
}

/**
 * Greedy debt simplification: matches the biggest debtor against the
 * biggest creditor repeatedly, minimizing the number of transactions.
 */
export function getSettlements(summaries: PersonSummary[]): Settlement[] {
  const creditors = summaries
    .filter((s) => s.balance > 0.005)
    .map((s) => ({ id: s.personId, amount: s.balance }))
    .sort((a, b) => b.amount - a.amount);
  const debtors = summaries
    .filter((s) => s.balance < -0.005)
    .map((s) => ({ id: s.personId, amount: -s.balance }))
    .sort((a, b) => b.amount - a.amount);

  const settlements: Settlement[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = round2(Math.min(debtor.amount, creditor.amount));

    if (amount > 0.005) {
      settlements.push({ fromId: debtor.id, toId: creditor.id, amount });
    }

    debtor.amount = round2(debtor.amount - amount);
    creditor.amount = round2(creditor.amount - amount);

    if (debtor.amount <= 0.005) i += 1;
    if (creditor.amount <= 0.005) j += 1;
  }

  return settlements;
}

export function personName(people: Person[], id: string): string {
  return people.find((p) => p.id === id)?.name ?? 'Unbekannt';
}

export interface PersonReceiptShare {
  receipt: Receipt;
  share: number;
}

export function getPersonReceiptShares(trip: TripState, personId: string): PersonReceiptShare[] {
  return trip.receipts
    .filter((r) => r.splitBetweenIds.includes(personId) && r.splitBetweenIds.length > 0)
    .map((receipt) => ({
      receipt,
      share: round2(receipt.amount / receipt.splitBetweenIds.length),
    }))
    .sort((a, b) => b.receipt.date.localeCompare(a.receipt.date));
}
