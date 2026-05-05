export interface Expense {
  id: string;
  amount: number;
  category: string;   // purpose text from sheet (e.g. "Zomato", "Rent")
  mode: string;
  bank: string;
  note: string;       // same as category for SBI entries
  date: string;       // "YYYY-MM-DD"
  created_at: string;
  isIncome: boolean;  // true = credit column (C), false = debit column (B)
  balance?: number;   // running balance from column F
}

export interface AddExpensePayload {
  amount:    number;
  purpose:   string;   // goes to column E in sheet
  date:      string;
  isExpense: boolean;  // true → column B (Debit), false → column C (Credit)
}

export type EntryType = 'expense' | 'income';
