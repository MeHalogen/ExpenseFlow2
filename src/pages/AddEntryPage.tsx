import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import { addExpense } from '../api';
import type { EntryType } from '../types';

interface Props {
  refresh: () => void;
}

// Quick-fill shortcuts matching SBI-style purposes
const EXPENSE_SHORTCUTS = [
  { label: 'Food',      icon: '🍔' },
  { label: 'Cab',       icon: '🚗' },
  { label: 'Zomato',    icon: '🛵' },
  { label: 'Groceries', icon: '🛒' },
  { label: 'Rent',      icon: '🏠' },
  { label: 'Recharge',  icon: '📱' },
  { label: 'Netflix',   icon: '🎬' },
  { label: 'Petrol',    icon: '⛽' },
  { label: 'Medicine',  icon: '💊' },
  { label: 'Shopping',  icon: '🛍️' },
  { label: 'Bill',      icon: '💡' },
  { label: 'Other',     icon: '📦' },
];

const INCOME_SHORTCUTS = [
  { label: 'Salary',     icon: '💰' },
  { label: 'Freelance',  icon: '💻' },
  { label: 'Refund',     icon: '↩️' },
  { label: 'Gift',       icon: '🎁' },
  { label: 'Investment', icon: '📈' },
];

export default function AddEntryPage({ refresh }: Props) {
  const navigate = useNavigate();

  const [type,    setType]    = useState<EntryType>('expense');
  const [amount,  setAmount]  = useState('');
  const [purpose, setPurpose] = useState('');
  const [date,    setDate]    = useState(new Date().toISOString().slice(0, 10));
  const [saving,  setSaving]  = useState(false);

  const amountRef  = useRef<HTMLInputElement>(null);
  const purposeRef = useRef<HTMLInputElement>(null);
  const dateRef    = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => amountRef.current?.focus(), 120);
    return () => clearTimeout(t);
  }, []);

  const shortcuts   = type === 'expense' ? EXPENSE_SHORTCUTS : INCOME_SHORTCUTS;
  const accentLight = type === 'expense' ? '#FEF2F2' : '#F0FDF4';
  const accentColor = type === 'expense' ? '#EF4444' : '#22C55E';
  const accentBtn   = type === 'expense' ? 'bg-red-500'   : 'bg-green-500';
  const accentText  = type === 'expense' ? 'text-red-500' : 'text-green-600';

  const displayAmt = amount && Number(amount) > 0
    ? Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })
    : '';

  const dateLabel = (() => {
    try {
      return new Date(date + 'T00:00:00').toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
      });
    } catch { return date; }
  })();

  async function handleSubmit() {
    const num = parseFloat(amount);
    if (!num || num <= 0)  { toast.error('Enter a valid amount'); return; }
    if (!purpose.trim())   { toast.error('Enter a purpose');      return; }

    setSaving(true);
    try {
      await addExpense({
        amount:    num,
        purpose:   purpose.trim(),
        date,
        isExpense: type === 'expense',
      });
      toast.success('Saved to sheet ✓');
      refresh();
      navigate('/', { replace: true });
    } catch (e: any) {
      toast.error(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page bg-white safe-top">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-4 pt-5 pb-2 flex-shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="w-11 h-11 flex items-center justify-center rounded-full bg-gray-100 active:scale-90 transition-transform"
        >
          <ChevronLeft size={22} className="text-gray-700" />
        </button>

        {/* Expense / Income toggle */}
        <div className="flex p-1 bg-gray-100 rounded-2xl gap-1">
          {(['expense', 'income'] as EntryType[]).map((t) => (
            <button
              key={t}
              onClick={() => { setType(t); setPurpose(''); }}
              className={`px-4 py-2 text-sm font-bold rounded-xl transition-all active:scale-95 ${
                type === t
                  ? t === 'expense'
                    ? 'bg-white text-red-500 shadow-sm'
                    : 'bg-white text-green-600 shadow-sm'
                  : 'text-gray-400'
              }`}
            >
              {t === 'expense' ? '↓ Debit' : '↑ Credit'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Hero amount ── */}
      <div
        className="mx-4 mt-3 rounded-3xl px-6 py-5 flex items-center gap-2 flex-shrink-0"
        style={{ background: accentLight }}
        onClick={() => amountRef.current?.focus()}
      >
        <span className={`text-4xl font-extrabold select-none ${accentText}`} style={{ color: accentColor }}>₹</span>
        <input
          ref={amountRef}
          type="number"
          inputMode="decimal"
          placeholder="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="flex-1 text-5xl font-extrabold bg-transparent outline-none w-0 placeholder-gray-200"
          style={{ color: accentColor, caretColor: accentColor }}
        />
      </div>

      {/* ── Scrollable form ── */}
      <div className="flex-1 overflow-y-auto scrollbar-hide pt-5 pb-2">
        <div className="px-4 space-y-5 max-w-md mx-auto">

          {/* Purpose — primary field */}
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
              Purpose
            </p>
            <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-4">
              <input
                ref={purposeRef}
                type="text"
                placeholder={type === 'expense' ? 'e.g. Zomato, Rent, Cab…' : 'e.g. Salary, Freelance…'}
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="flex-1 text-base font-semibold text-gray-900 bg-transparent outline-none placeholder-gray-300"
              />
              {purpose && (
                <button onClick={() => setPurpose('')} className="text-gray-300 text-lg leading-none">×</button>
              )}
            </div>
          </div>

          {/* Quick-fill shortcuts */}
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
              Quick fill
            </p>
            <div className="grid grid-cols-4 gap-2">
              {shortcuts.map((s) => {
                const active = purpose === s.label;
                return (
                  <button
                    key={s.label}
                    onClick={() => {
                      setPurpose(s.label);
                      amountRef.current?.focus();
                    }}
                    className="flex flex-col items-center gap-2 py-3.5 rounded-2xl text-[11px] font-semibold transition-all active:scale-95"
                    style={
                      active
                        ? { background: accentColor + '18', color: accentColor, outline: `2px solid ${accentColor}44` }
                        : { background: '#F8FAFC', color: '#64748B' }
                    }
                  >
                    <span className="text-2xl leading-none">{s.icon}</span>
                    <span className="leading-tight text-center">{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date */}
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
              Date
            </p>
            <button
              className="w-full flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-4 active:scale-95 transition-transform text-left relative"
              onClick={() => dateRef.current?.showPicker?.()}
            >
              <CalendarDays size={20} className="text-gray-400 flex-shrink-0" />
              <span className="text-base font-semibold text-gray-800">{dateLabel}</span>
              <input
                ref={dateRef}
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              />
            </button>
          </div>

        </div>
      </div>

      {/* ── Submit ── */}
      <div className="px-4 pt-3 pb-4 safe-bottom flex-shrink-0">
        <button
          onClick={handleSubmit}
          disabled={saving}
          className={`w-full py-4 rounded-2xl text-white font-bold text-base transition-all active:scale-[0.97] disabled:opacity-50 ${accentBtn}`}
        >
          {saving
            ? 'Saving to sheet…'
            : `${type === 'expense' ? 'Add Debit' : 'Add Credit'}${displayAmt ? ` · ₹${displayAmt}` : ''}`
          }
        </button>
      </div>

    </div>
  );
}
