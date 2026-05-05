import { Trash2 } from 'lucide-react';
import type { Expense } from '../types';
import { isIncome, getCategoryMeta, fmt } from '../utils/analytics';
import { format } from 'date-fns';

interface Props {
  expense:   Expense;
  onDelete?: (id: string) => void;
  deleting?: boolean;
}

export default function TransactionItem({ expense, onDelete, deleting }: Props) {
  const income  = isIncome(expense);
  const display = expense.note || expense.category || (income ? 'Income' : 'Expense');
  const meta    = getCategoryMeta(income ? 'salary' : display);

  let dateLabel = '';
  try { dateLabel = format(new Date(expense.date), 'd MMM'); }
  catch { dateLabel = expense.date; }

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-50 last:border-0 animate-fade-in">
      {/* Icon */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
        style={{ background: meta.color + '18' }}
      >
        {income ? '💰' : meta.icon}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate capitalize">{display}</p>
        <p className="text-xs text-gray-400 mt-0.5">{dateLabel}</p>
      </div>

      {/* Amount */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={`text-sm font-bold ${income ? 'text-green-600' : 'text-gray-900'}`}>
          {income ? '+' : '−'}{fmt(expense.amount)}
        </span>

        {onDelete && (
          <button
            onClick={() => onDelete(expense.id)}
            disabled={deleting}
            className="p-1.5 rounded-full text-gray-300 hover:text-red-400 hover:bg-red-50 active:scale-90 transition-all disabled:opacity-40"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
