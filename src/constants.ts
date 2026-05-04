export interface Category {
  label: string;
  icon: string;
  color: string;
}

export const EXPENSE_CATEGORIES: Category[] = [
  { label: 'Food',          icon: '🍔', color: '#F97316' },
  { label: 'Transport',     icon: '🚗', color: '#3B82F6' },
  { label: 'Shopping',      icon: '🛍️', color: '#EC4899' },
  { label: 'Entertainment', icon: '🎬', color: '#8B5CF6' },
  { label: 'Health',        icon: '💊', color: '#10B981' },
  { label: 'Utilities',     icon: '💡', color: '#F59E0B' },
  { label: 'Rent',          icon: '🏠', color: '#6366F1' },
  { label: 'Subscriptions', icon: '📱', color: '#14B8A6' },
  { label: 'Travel',        icon: '✈️',  color: '#0EA5E9' },
  { label: 'Groceries',     icon: '🛒', color: '#22C55E' },
  { label: 'Education',     icon: '📚', color: '#84CC16' },
  { label: 'Other',         icon: '📦', color: '#94A3B8' },
];

export const INCOME_CATEGORIES: Category[] = [
  { label: 'Salary',        icon: '💰', color: '#22C55E' },
  { label: 'Freelance',     icon: '💻', color: '#3B82F6' },
  { label: 'Investment',    icon: '📈', color: '#8B5CF6' },
  { label: 'Gift',          icon: '🎁', color: '#EC4899' },
  { label: 'Other Income',  icon: '💵', color: '#10B981' },
];

export const INCOME_LABELS = new Set(INCOME_CATEGORIES.map((c) => c.label));

export const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

export const PAYMENT_MODES = ['UPI', 'Cash', 'Card', 'Net Banking'];
export const BANKS = ['SBI', 'HDFC', 'ICICI', 'Axis', 'Kotak', 'Paytm', 'Other'];

export const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
export const SHORT_MONTHS = [
  'Jan','Feb','Mar','Apr','May','Jun',
  'Jul','Aug','Sep','Oct','Nov','Dec',
];
