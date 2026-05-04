export interface Expense {
  id: string;
  amount: number;
  category: string;
  mode: string;
  bank: string;
  note: string;
  date: string;        // "YYYY-MM-DD"
  created_at: string;
}

export interface AddExpensePayload {
  amount: number;
  category: string;
  mode: string;
  bank: string;
  note?: string;
  date: string;
}

export type EntryType = 'expense' | 'income';
