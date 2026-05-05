import type { Expense } from '../types';
import { SHORT_MONTHS } from '../constants';

// Use the isIncome flag from the backend (set from Credit column)
export function isIncome(e: Expense): boolean {
  return e.isIncome === true;
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
      const meta = getCategoryMeta(category);
      return { category, amount, icon: meta.icon, color: meta.color };
    })
    .sort((a, b) => b.amount - a.amount);
}

export interface MonthlyTrend {
  month:  string;
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

// Smart keyword mapper — works for SBI purpose strings like "Zomato", "Cab", "Rent"
export function getCategoryMeta(purpose: string): { icon: string; color: string } {
  const t = purpose.toLowerCase();
  if (/zomato|swiggy|food|restaurant|cafe|dhaba|biryani|lunch|dinner|breakfast|eating/.test(t))
    return { icon: '🍔', color: '#F97316' };
  if (/cab|auto|uber|ola|taxi|petrol|fuel|bus|metro|train|rapido|transport|fare/.test(t))
    return { icon: '🚗', color: '#3B82F6' };
  if (/rent|house|room|pg|hostel|flat/.test(t))
    return { icon: '🏠', color: '#6366F1' };
  if (/flipkart|amazon|meesho|shopping|myntra|ajio|nykaa/.test(t))
    return { icon: '🛍️', color: '#EC4899' };
  if (/recharge|mobile|phone|jio|airtel|vi |vodafone|bsnl/.test(t))
    return { icon: '📱', color: '#14B8A6' };
  if (/netflix|prime|hotstar|subscription|disney|zee5|spotify/.test(t))
    return { icon: '🎬', color: '#8B5CF6' };
  if (/salary|income|credit|freelance|payment received/.test(t))
    return { icon: '💰', color: '#22C55E' };
  if (/grocery|groceries|vegetable|sabzi|market|kirana|milk|fruit/.test(t))
    return { icon: '🛒', color: '#22C55E' };
  if (/electricity|water|gas|bill|utility|maintenance/.test(t))
    return { icon: '💡', color: '#F59E0B' };
  if (/doctor|medicine|pharmacy|hospital|health|medical|apollo/.test(t))
    return { icon: '💊', color: '#10B981' };
  if (/flight|train ticket|hotel|trip|travel|booking|oyo/.test(t))
    return { icon: '✈️',  color: '#0EA5E9' };
  if (/school|college|course|fee|tuition|education|book/.test(t))
    return { icon: '📚', color: '#84CC16' };
  return { icon: '📦', color: '#94A3B8' };
}
