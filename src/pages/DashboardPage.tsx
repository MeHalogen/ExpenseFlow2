import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import type { Expense } from '../types';
import { filterByMonth, computeStats, categoryBreakdown, fmt } from '../utils/analytics';
import { MONTH_NAMES } from '../constants';
import TransactionItem from '../components/TransactionItem';
import Spinner from '../components/Spinner';
import { deleteExpense } from '../api';

interface Props {
  expenses: Expense[];
  loading:  boolean;
  error:    string | null;
  refresh:  () => void;
}

export default function DashboardPage({ expenses, loading, error, refresh }: Props) {
  const now    = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else              setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else               setMonth(m => m + 1);
  }

  const monthly   = useMemo(() => filterByMonth(expenses, year, month), [expenses, year, month]);
  const stats     = useMemo(() => computeStats(monthly), [monthly]);
  const categories= useMemo(() => categoryBreakdown(monthly), [monthly]);
  const maxCat    = categories[0]?.amount || 1;

  // Pick savings summary from the most-recent entry that has these values
  const savingsSummary = useMemo(() => {
    const e = monthly.find(x => x.carryover || x.totalSavings || x.grandTotal);
    if (!e) return null;
    return {
      carryover:       e.carryover       ?? 0,
      savings:         e.savings         ?? 0,
      incentiveSaving: e.incentiveSaving ?? 0,
      totalSavings:    e.totalSavings    ?? 0,
      grandTotal:      e.grandTotal      ?? 0,
    };
  }, [monthly]);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteExpense(id);
      toast.success('Entry deleted');
      refresh();
    } catch {
      toast.error('Could not delete entry');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="page">
      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-100 safe-top">
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <div>
            <h1 className="text-lg font-bold text-gray-900">ExpenseFlow</h1>
            <p className="text-xs text-gray-400">Track · Analyse · Save</p>
          </div>
          <button
            onClick={refresh}
            disabled={loading}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 active:scale-90 transition-transform disabled:opacity-50"
          >
            {loading ? <Spinner size={16} /> : <RefreshCw size={16} />}
          </button>
        </div>

        {/* Month navigator */}
        <div className="flex items-center justify-center gap-4 pb-3">
          <button onClick={prevMonth} className="p-1.5 rounded-full hover:bg-gray-100 active:scale-90 transition-all">
            <ChevronLeft size={18} className="text-gray-500" />
          </button>
          <span className="text-sm font-semibold text-gray-800 w-28 text-center">
            {MONTH_NAMES[month]} {year}
          </span>
          <button onClick={nextMonth} className="p-1.5 rounded-full hover:bg-gray-100 active:scale-90 transition-all">
            <ChevronRight size={18} className="text-gray-500" />
          </button>
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto scrollbar-hide pb-4">

        {error && (
          <div className="mx-4 mt-4 p-3 rounded-xl bg-blue-50 text-blue-600 text-sm text-center">
            🚀 Deploy to Netlify to connect Google Sheets
          </div>
        )}

        {/* ── Balance Card ── */}
        <div className="mx-4 mt-4 card p-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
            {MONTH_NAMES[month]} Balance
          </p>
          <p className={`text-3xl font-bold tracking-tight mb-3 ${
            stats.remaining >= 0 ? 'text-gray-900' : 'text-red-500'
          }`}>
            {stats.remaining < 0 ? '−' : ''}{fmt(Math.abs(stats.remaining))}
          </p>
          <div className="flex gap-3">
            <div className="flex-1 bg-green-50 rounded-xl p-3">
              <p className="text-xs text-green-600 font-medium mb-0.5">Income</p>
              <p className="text-base font-bold text-green-700">{fmt(stats.income)}</p>
            </div>
            <div className="flex-1 bg-red-50 rounded-xl p-3">
              <p className="text-xs text-red-500 font-medium mb-0.5">Spent</p>
              <p className="text-base font-bold text-red-600">{fmt(stats.spent)}</p>
            </div>
          </div>
        </div>

        {/* ── Savings Overview Card ── */}
        {savingsSummary && (
          <div className="mx-4 mt-4 card p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Savings Overview
            </p>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div className="bg-indigo-50 rounded-xl p-3">
                <p className="text-xs text-indigo-500 font-medium mb-0.5">Carryover</p>
                <p className="text-base font-bold text-indigo-700">{fmt(savingsSummary.carryover)}</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-3">
                <p className="text-xs text-emerald-600 font-medium mb-0.5">Savings 😊</p>
                <p className="text-base font-bold text-emerald-700">{fmt(savingsSummary.savings)}</p>
              </div>
              <div className="bg-violet-50 rounded-xl p-3">
                <p className="text-xs text-violet-500 font-medium mb-0.5">Incentive Saving</p>
                <p className="text-base font-bold text-violet-700">{fmt(savingsSummary.incentiveSaving)}</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-3">
                <p className="text-xs text-amber-600 font-medium mb-0.5">Total Savings</p>
                <p className="text-base font-bold text-amber-700">{fmt(savingsSummary.totalSavings)}</p>
              </div>
            </div>
            <div className="bg-blue-600 rounded-xl p-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-blue-100">Grand Total</p>
              <p className="text-xl font-bold text-white">{fmt(savingsSummary.grandTotal)}</p>
            </div>
          </div>
        )}

        {/* ── Category Breakdown ── */}
        {categories.length > 0 && (
          <div className="mx-4 mt-4 card p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Spending by Category
            </p>
            <div className="flex flex-col gap-3">
              {categories.slice(0, 6).map((cat) => (
                <div key={cat.category}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base leading-none">{cat.icon}</span>
                      <span className="text-sm text-gray-700 font-medium">{cat.category}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-800">{fmt(cat.amount)}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width:      `${(cat.amount / maxCat) * 100}%`,
                        background: cat.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Transactions ── */}
        <div className="mx-4 mt-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Transactions · {monthly.length}
          </p>

          {loading && monthly.length === 0 ? (
            <div className="flex justify-center py-12">
              <Spinner size={28} />
            </div>
          ) : monthly.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              No entries for {MONTH_NAMES[month]}
            </div>
          ) : (
            <div className="card overflow-hidden">
              {[...monthly]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((exp) => (
                  <TransactionItem
                    key={exp.id}
                    expense={exp}
                    onDelete={handleDelete}
                    deleting={deletingId === exp.id}
                  />
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
