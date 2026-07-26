import { useCallback, useEffect, useState } from 'react';
import type { Category, Person, Receipt, TripState } from './types';
import { EMPTY_TRIP } from './defaultData';

const STORAGE_KEY = 'kosten-aufteilung:trip';

function loadTrip(): TripState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_TRIP;
    const parsed = JSON.parse(raw) as TripState;
    return {
      people: parsed.people ?? [],
      categories: parsed.categories?.length ? parsed.categories : EMPTY_TRIP.categories,
      receipts: parsed.receipts ?? [],
    };
  } catch {
    return EMPTY_TRIP;
  }
}

function makeId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function useTripState() {
  const [trip, setTrip] = useState<TripState>(loadTrip);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trip));
  }, [trip]);

  const addPerson = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setTrip((t) => ({ ...t, people: [...t.people, { id: makeId(), name: trimmed }] }));
  }, []);

  const removePerson = useCallback((id: string) => {
    setTrip((t) => ({
      ...t,
      people: t.people.filter((p) => p.id !== id),
      receipts: t.receipts
        .filter((r) => r.paidById !== id)
        .map((r) => ({ ...r, splitBetweenIds: r.splitBetweenIds.filter((pid) => pid !== id) }))
        .filter((r) => r.splitBetweenIds.length > 0),
    }));
  }, []);

  const addCategory = useCallback((name: string, icon: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setTrip((t) => ({ ...t, categories: [...t.categories, { id: makeId(), name: trimmed, icon: icon || '💶' }] }));
  }, []);

  const removeCategory = useCallback((id: string) => {
    setTrip((t) => {
      if (t.categories.length <= 1) return t;
      const fallback = t.categories.find((c) => c.id !== id)?.id ?? id;
      return {
        ...t,
        categories: t.categories.filter((c) => c.id !== id),
        receipts: t.receipts.map((r) => (r.categoryId === id ? { ...r, categoryId: fallback } : r)),
      };
    });
  }, []);

  const addReceipt = useCallback((receipt: Omit<Receipt, 'id'>) => {
    setTrip((t) => ({ ...t, receipts: [{ ...receipt, id: makeId() }, ...t.receipts] }));
  }, []);

  const removeReceipt = useCallback((id: string) => {
    setTrip((t) => ({ ...t, receipts: t.receipts.filter((r) => r.id !== id) }));
  }, []);

  const resetTrip = useCallback(() => {
    setTrip(EMPTY_TRIP);
  }, []);

  return {
    trip,
    addPerson,
    removePerson,
    addCategory,
    removeCategory,
    addReceipt,
    removeReceipt,
    resetTrip,
  };
}

export type { Category, Person, Receipt, TripState };
