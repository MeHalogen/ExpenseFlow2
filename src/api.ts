import type { Expense, AddExpensePayload } from './types';

const BASE = '/.netlify/functions';

export async function fetchExpenses(): Promise<Expense[]> {
  const res = await fetch(`${BASE}/get-expenses`);
  if (!res.ok) throw new Error('Failed to fetch expenses');
  const data = await res.json();
  return data.expenses as Expense[];
}

export async function addExpense(payload: AddExpensePayload): Promise<void> {
  const res = await fetch(`${BASE}/add-expense`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error || 'Failed to add expense');
  }
}

export async function deleteExpense(id: string): Promise<void> {
  const res = await fetch(`${BASE}/delete-expense`, {
    method:  'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error('Failed to delete expense');
}
