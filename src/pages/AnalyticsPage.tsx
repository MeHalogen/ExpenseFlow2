import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import type { Expense } from '../types';
import { monthlyTrends, categoryBreakdown, filterByMonth, computeStats, fmt } from '../utils/analytics';
import Spinner from '../components/Spinner';

interface Props {
  expenses: Expense[];
  loading:  boolean;
}

const RADIAN = Math.PI / 180;
function renderCustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
  if (percent < 0.05) return null;
  const r  = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x  = cx + r * Math.cos(-midAngle * RADIAN);
  const y  = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

export default function AnalyticsPage({ expenses, loading }: Props) {
  const now    = new Date();
  const trends = useMemo(() => monthlyTrends(expenses, 6), [expenses]);
  const catData= useMemo(() => {
    const all = filterByMonth(expenses, now.getFullYear(), now.getMonth());
    return categoryBreakdown(all);
  }, [expenses]);

  const stats = useMemo(() => {
    const all = filterByMonth(expenses, now.getFullYear(), now.getMonth());
    return computeStats(all);
  }, [expenses]);

  // summary cards: avg/day, top category, months tracked
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const avgPerDay   = Math.round(stats.spent / daysInMonth);
  const topCat      = catData[0];

  return (
    <div className="page bg-ink safe-top">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-4 pb-3">
        <h2 className="text-lg font-bold text-gray-900">Analytics</h2>
        <p className="text-xs text-gray-400 mt-0.5">Insights from your data</p>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="px-4 pt-4 pb-6 space-y-4 max-w-md mx-auto">

          {loading ? (
            <div className="flex justify-center py-16"><Spinner size={32} /></div>
          ) : (
            <>
              {/* Quick stats row */}
              <div className="grid grid-cols-3 gap-2">
                <div className="card p-3 text-center">
                  <p className="text-xs text-gray-400 mb-1">Spent today avg</p>
                  <p className="text-sm font-bold text-gray-900">{fmt(avgPerDay)}</p>
                </div>
                <div className="card p-3 text-center">
                  <p className="text-xs text-gray-400 mb-1">Top category</p>
                  <p className="text-sm font-bold text-gray-900 truncate">{topCat?.category ?? '—'}</p>
                </div>
                <div className="card p-3 text-center">
                  <p className="text-xs text-gray-400 mb-1">Months tracked</p>
                  <p className="text-sm font-bold text-gray-900">{trends.length}</p>
                </div>
              </div>

              {/* Monthly bar chart */}
              {trends.length > 0 && (
                <div className="card p-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
                    Monthly Overview
                  </p>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={trends} barSize={10} barGap={4}>
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 10, fill: '#94A3B8' }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => v.slice(0, 3)}
                      />
                      <YAxis hide />
                      <Tooltip
                        contentStyle={{
                          background: '#0F172A',
                          border: 'none',
                          borderRadius: 8,
                          fontSize: 12,
                          color: '#F8FAFC',
                        }}
                        formatter={(v: number, name: string) => [fmt(v), name === 'spent' ? 'Spent' : 'Income']}
                        labelStyle={{ color: '#94A3B8', marginBottom: 4 }}
                      />
                      <Bar dataKey="income" fill="#22C55E" radius={[4, 4, 0, 0]} name="income" />
                      <Bar dataKey="spent"  fill="#EF4444" radius={[4, 4, 0, 0]} name="spent"  />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-4 mt-2">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block" />
                      Income
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />
                      Spent
                    </div>
                  </div>
                </div>
              )}

              {/* Category pie */}
              {catData.length > 0 && (
                <div className="card p-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
                    This Month · By Category
                  </p>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={catData}
                        dataKey="amount"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={40}
                        labelLine={false}
                        label={renderCustomLabel}
                      >
                        {catData.map((entry) => (
                          <Cell key={entry.category} fill={entry.color} />
                        ))}
                      </Pie>
                      <Legend
                        formatter={(value) => (
                          <span style={{ fontSize: 11, color: '#64748B' }}>{value}</span>
                        )}
                        iconSize={8}
                        iconType="circle"
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Category list */}
              {catData.length > 0 && (
                <div className="card overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-50">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Category Breakdown
                    </p>
                  </div>
                  {catData.map((cat, i) => (
                    <div key={cat.category} className={`flex items-center gap-3 px-4 py-3 ${i < catData.length - 1 ? 'border-b border-gray-50' : ''}`}>
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-base flex-shrink-0"
                        style={{ background: cat.color + '18' }}
                      >
                        {cat.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-gray-800">{cat.category}</span>
                          <span className="text-sm font-semibold text-gray-900">{fmt(cat.amount)}</span>
                        </div>
                        <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width:      `${(cat.amount / (catData[0]?.amount || 1)) * 100}%`,
                              background: cat.color,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {catData.length === 0 && !loading && (
                <div className="text-center py-16 text-gray-400 text-sm">
                  No expense data yet.<br />
                  <span className="text-xs text-gray-300 mt-1 block">Add some entries to see analytics.</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
