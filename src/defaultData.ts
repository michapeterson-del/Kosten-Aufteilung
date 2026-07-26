import type { Category, TripState } from './types';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'essen', name: 'Essen & Trinken', icon: '🍽️' },
  { id: 'unterkunft', name: 'Unterkunft', icon: '🏠' },
  { id: 'transport', name: 'Transport', icon: '🚗' },
  { id: 'aktivitaeten', name: 'Aktivitäten', icon: '🎟️' },
  { id: 'einkaufen', name: 'Einkaufen', icon: '🛍️' },
  { id: 'sonstiges', name: 'Sonstiges', icon: '💶' },
];

export const EMPTY_TRIP: TripState = {
  people: [],
  categories: DEFAULT_CATEGORIES,
  receipts: [],
};
