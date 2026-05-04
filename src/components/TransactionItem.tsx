import { Trash2 } from 'lucide-react';
import type { Expense } from '../types';
import { isIncome, fmt } from '../utils/analytics';
import { ALL_CATEGORIES } from '../constants';
import { format } from 'date-fns';

interface Props {
  expense:   Expense;
  onDelete?: (id: string) => void;
  deleting?: boolean;
}

export default function TransactionItem({ expense, onDelete, deleting }: Props) {
  const income = isIncome(expense);
  const meta   = ALL_CATEGORIES.find((c) => c.label === expense.category);
  const icon   = meta?.icon ?? '📦';
  const color  = meta?.color ?? '#94A3B8';

  let dateLabel = '';
  try {
    dateLabel = format(new Date(expense.date), 'd MMM');
  } catch {
    dateLabel = expense.date;
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-50 last:border-0 animate-fade-in">
      {/* Icon */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
        style={{ background: color + '18' }}
      >
        {icon}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{expense.category}</p>
        <p className="text-xs text-gray-400 mt-0.5 truncate">
          {expense.mode}{expense.bank ? ` · ${expense.bank}` : ''}
          {expense.note ? ` · ${expense.note}` : ''}
        </p>
      </div>

      {/* Amount + date */}
      <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
        <span className={`text-sm font-semibold ${income ? 'text-green-600' : 'text-gray-900'}`}>
          {income ? '+' : '−'}{fmt(expense.amount)}
        </span>
        <span className="text-xs text-gray-400">{dateLabel}</span>
      </div>

      {/* Delete */}
      {onDelete && (
        <button
          onClick={() => onDelete(expense.id)}
          disabled={deleting}
          className="ml-1 p-1.5 rounded-full text-gray-300 hover:text-red-400 hover:bg-red-50 active:scale-90 transition-all disabled:opacity-40"
        >
          <Trash2 size={15} />
        </button>
      )}
    </div>
  );
}
