import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronDown } from 'lucide-react';
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
  useEffect(() => { amountRef.current?.focus(); }, []);

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  async function handleSubmit() {
    const num = parseFloat(amount);
    if (!num || num <= 0)  { toast.error('Enter a valid amount');  return; }
    if (!category)         { toast.error('Pick a category');       return; }

    setSaving(true);
    try {
      await addExpense({ amount: num, category, mode, bank, note: note || undefined, date });
      toast.success('Entry added ✓');
      refresh();
      navigate('/', { replace: true });
    } catch (e: any) {
      toast.error(e.message || 'Failed to add entry');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page bg-ink safe-top">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 bg-white border-b border-gray-100">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 active:scale-90 transition-transform"
        >
          <ChevronLeft size={20} className="text-gray-600" />
        </button>
        <h2 className="text-base font-semibold text-gray-900">Add Entry</h2>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="px-4 pt-4 pb-6 space-y-4 max-w-md mx-auto">

          {/* Type toggle */}
          <div className="flex p-1 bg-gray-100 rounded-xl gap-1">
            {(['expense', 'income'] as EntryType[]).map((t) => (
              <button
                key={t}
                onClick={() => { setType(t); setCategory(''); }}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all capitalize ${
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

          {/* Amount */}
          <div className="card p-4">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide block mb-2">
              Amount
            </label>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-gray-400">₹</span>
              <input
                ref={amountRef}
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1 text-4xl font-bold text-gray-900 bg-transparent outline-none placeholder-gray-200 w-0"
              />
            </div>
          </div>

          {/* Category */}
          <div className="card p-4">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide block mb-3">
              Category
            </label>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((cat) => {
                const active = category === cat.label;
                return (
                  <button
                    key={cat.label}
                    onClick={() => setCategory(cat.label)}
                    className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-xs font-medium transition-all active:scale-95 ${
                      active ? 'shadow-sm' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                    style={active ? { background: cat.color + '18', color: cat.color, border: `1.5px solid ${cat.color}40` } : {}}
                  >
                    <span className="text-xl leading-none">{cat.icon}</span>
                    <span className="leading-tight text-center">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mode */}
          <div className="card p-4">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide block mb-3">
              Payment Mode
            </label>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_MODES.map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-95 ${
                    mode === m
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Bank + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="card p-4">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wide block mb-2">
                Bank
              </label>
              <div className="relative">
                <select
                  value={bank}
                  onChange={(e) => setBank(e.target.value)}
                  className="w-full bg-transparent text-sm font-medium text-gray-800 outline-none appearance-none pr-5"
                >
                  {BANKS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-0 top-0.5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="card p-4">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wide block mb-2">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-transparent text-sm font-medium text-gray-800 outline-none"
              />
            </div>
          </div>

          {/* Note */}
          <div className="card p-4">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide block mb-2">
              Note <span className="normal-case text-gray-300">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Zomato order, petrol..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full text-sm text-gray-800 bg-transparent outline-none placeholder-gray-300"
            />
          </div>

        </div>
      </div>

      {/* Submit */}
      <div className="px-4 py-3 bg-white border-t border-gray-100 safe-bottom">
        <button
          onClick={handleSubmit}
          disabled={saving}
          className={`w-full py-4 rounded-2xl text-white font-semibold text-base transition-all active:scale-95 disabled:opacity-60 ${
            type === 'expense' ? 'bg-red-500' : 'bg-green-500'
          }`}
        >
          {saving
            ? 'Saving…'
            : type === 'expense'
              ? `Add Expense${amount ? ` · ₹${amount}` : ''}`
              : `Add Income${amount ? ` · ₹${amount}` : ''}`
          }
        </button>
      </div>
    </div>
  );
}
