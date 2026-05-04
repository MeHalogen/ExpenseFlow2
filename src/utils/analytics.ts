import type { Expense } from '../types';
import { INCOME_LABELS, ALL_CATEGORIES, SHORT_MONTHS } from '../constants';

export function isIncome(e: Expense) {
  return INCOME_LABELS.has(e.category);
}

export function filterByMonth(expenses: Expense[], year: number, month: number) {
  return expenses.filter((e) => {
    const d = new Date(e.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

export interface MonthStats {
  income:    number;
  spent:     number;
  remaining: number;
}

export function computeStats(expenses: Expense[]): MonthStats {
  const income = expenses.filter(isIncome).reduce((s, e) => s + e.amount, 0);
  const spent  = expenses.filter((e) => !isIncome(e)).reduce((s, e) => s + e.amount, 0);
  return { income, spent, remaining: income - spent };
}

export interface CategoryStat {
  category: string;
  amount:   number;
  icon:     string;
  color:    string;
}

export function categoryBreakdown(expenses: Expense[]): CategoryStat[] {
  const map: Record<string, number> = {};
  expenses.filter((e) => !isIncome(e)).forEach((e) => {
    map[e.category] = (map[e.category] || 0) + e.amount;
  });
  return Object.entries(map)
    .map(([category, amount]) => {
      const meta = ALL_CATEGORIES.find((c) => c.label === category);
      return { category, amount, icon: meta?.icon ?? '📦', color: meta?.color ?? '#94A3B8' };
    })
    .sort((a, b) => b.amount - a.amount);
}

export interface MonthlyTrend {
  month:  string; // "Jan 2026"
  year:   number;
  mon:    number;
  income: number;
  spent:  number;
}

export function monthlyTrends(expenses: Expense[], limit = 6): MonthlyTrend[] {
  const map: Record<string, MonthlyTrend> = {};
  expenses.forEach((e) => {
    const d = new Date(e.date);
    const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
    if (!map[key]) {
      map[key] = {
        month:  `${SHORT_MONTHS[d.getMonth()]} ${d.getFullYear()}`,
        year:   d.getFullYear(),
        mon:    d.getMonth(),
        income: 0,
        spent:  0,
      };
    }
    if (isIncome(e)) map[key].income += e.amount;
    else              map[key].spent  += e.amount;
  });
  return Object.values(map)
    .sort((a, b) => a.year !== b.year ? a.year - b.year : a.mon - b.mon)
    .slice(-limit);
}

export function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}
