export interface Person {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface Receipt {
  id: string;
  description: string;
  date: string; // ISO date string
  amount: number;
  categoryId: string;
  paidById: string;
  splitBetweenIds: string[]; // person ids sharing this receipt equally
  note?: string;
}

export interface TripState {
  people: Person[];
  categories: Category[];
  receipts: Receipt[];
}
