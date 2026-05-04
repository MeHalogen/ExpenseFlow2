import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import { addExpense } from '../api';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_MODES, BANKS } from '../constants';
import type { EntryType } from '../types';

interface Props {
  refresh: () => void;
}

export default function AddEntryPage({ refresh }: Props) {
  const navigate = useNavigate();

  const [type,     setType]     = useState<EntryType>('expense');
  const [amount,   setAmount]   = useState('');
  const [category, setCategory] = useState('');
  const [mode,     setMode]     = useState('UPI');
  const [bank,     setBank]     = useState('SBI');
  const [date,     setDate]     = useState(new Date().toISOString().slice(0, 10));
  const [note,     setNote]     = useState('');
  const [saving,   setSaving]   = useState(false);

  const amountRef = useRef<HTMLInputElement>(null);
  const dateRef   = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => amountRef.current?.focus(), 120);
    return () => clearTimeout(t);
  }, []);

  const categories  = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
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
    if (!num || num <= 0) { toast.error('Enter a valid amount'); return; }
    if (!category)        { toast.error('Pick a category');      return; }
    setSaving(true);
    try {
      await addExpense({ amount: num, category, mode, bank, note: note || undefined, date });
      toast.success('Entry saved ✓');
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

        {/* Type toggle */}
        <div className="flex p-1 bg-gray-100 rounded-2xl gap-1">
          {(['expense', 'income'] as EntryType[]).map((t) => (
            <button
              key={t}
              onClick={() => { setType(t); setCategory(''); }}
              className={`px-4 py-2 text-sm font-bold rounded-xl transition-all active:scale-95 ${
                type === t
                  ? t === 'expense'
                    ? 'bg-white text-red-500 shadow-sm'
                    : 'bg-white text-green-600 shadow-sm'
                  : 'text-gray-400'
              }`}
            >
              {t === 'expense' ? '↓ Expense' : '↑ Income'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Hero amount input ── */}
      <div
        className="mx-4 mt-4 rounded-3xl px-6 py-6 flex items-center gap-2 flex-shrink-0"
        style={{ background: accentLight }}
        onClick={() => amountRef.current?.focus()}
      >
        <span
          className={`text-4xl font-extrabold select-none ${accentText}`}
          style={{ color: accentColor }}
        >
          ₹
        </span>
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
        <div className="px-4 space-y-6 max-w-md mx-auto">

          {/* Category */}
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
              Category
            </p>
            <div className="grid grid-cols-4 gap-2">
              {categories.map((cat) => {
                const active = category === cat.label;
                return (
                  <button
                    key={cat.label}
                    onClick={() => setCategory(cat.label)}
                    className="flex flex-col items-center gap-2 py-4 rounded-2xl text-[11px] font-semibold transition-all active:scale-95 select-none"
                    style={
                      active
                        ? { background: cat.color + '18', color: cat.color, outline: `2px solid ${cat.color}55` }
                        : { background: '#F8FAFC', color: '#64748B' }
                    }
                  >
                    <span className="text-2xl leading-none">{cat.icon}</span>
                    <span className="leading-tight text-center px-1">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Mode */}
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
              Payment Mode
            </p>
            <div className="grid grid-cols-4 gap-2">
              {PAYMENT_MODES.map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`py-3.5 rounded-2xl text-sm font-bold transition-all active:scale-95 ${
                    mode === m ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-500'
                  }`}
                >
                  {m === 'Net Banking' ? 'Net' : m}
                </button>
              ))}
            </div>
          </div>

          {/* Bank — horizontal chips */}
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
              Bank
            </p>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
              {BANKS.map((b) => (
                <button
                  key={b}
                  onClick={() => setBank(b)}
                  className={`flex-shrink-0 px-5 py-3 rounded-2xl text-sm font-bold transition-all active:scale-95 ${
                    bank === b ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-500'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* Date + Note */}
          <div className="grid grid-cols-2 gap-3">

            {/* Date */}
            <button
              className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-4 active:scale-95 transition-transform text-left relative overflow-hidden"
              onClick={() => dateRef.current?.showPicker?.()}
            >
              <CalendarDays size={20} className="text-gray-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide leading-none mb-1">Date</p>
                <p className="text-sm font-semibold text-gray-800 truncate">{dateLabel}</p>
              </div>
              <input
                ref={dateRef}
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              />
            </button>

            {/* Note */}
            <div className="bg-gray-50 rounded-2xl px-4 py-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide leading-none mb-1">Note</p>
              <input
                type="text"
                placeholder="optional…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full text-sm font-semibold text-gray-800 bg-transparent outline-none placeholder-gray-300"
              />
            </div>

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
            ? 'Saving…'
            : `${type === 'expense' ? 'Add Expense' : 'Add Income'}${displayAmt ? ` · ₹${displayAmt}` : ''}`
          }
        </button>
      </div>

    </div>
  );
}
