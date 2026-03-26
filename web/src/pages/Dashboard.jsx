import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid,
} from 'recharts'
import { getServiceRecords, getBankTransactions } from '../lib/storage.js'
import {
  filterByPeriod, computeStats, groupByDate,
  groupByStaff, getExpensesByCategory, periodLabel,
} from '../lib/analytics.js'

const PERIODS = [
  { key: 'today', label: 'Today' },
  { key: 'week',  label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'all',   label: 'All Time' },
]

const EXPENSE_COLORS = {
  salary:          '#a78bfa',
  rent:            '#fb923c',
  electricity:     '#facc15',
  products:        '#34d399',
  food:            '#f472b6',
  owner_transfer:  '#22d3ee',
  bank_charges:    '#f87171',
  cash_withdrawal: '#f59e0b',
  paytm:           '#60a5fa',
  aws:             '#818cf8',
  other:           '#71717a',
}

function inr(n) {
  return Math.round(n || 0).toLocaleString('en-IN')
}

function pct(part, total) {
  if (!total) return '0%'
  return Math.round((part / total) * 100) + '%'
}

function dateFmt(d) {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const [, m, day] = d.split('-')
  return `${parseInt(day)} ${months[parseInt(m) - 1]}`
}

function BarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const cash  = payload.find(p => p.dataKey === 'cash')?.value  || 0
  const paytm = payload.find(p => p.dataKey === 'paytm')?.value || 0
  const tips  = payload.find(p => p.dataKey === 'tips')?.value  || 0
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3.5 py-2.5 text-xs shadow-xl">
      <p className="text-zinc-300 font-medium mb-2">{dateFmt(label)}</p>
      {cash  > 0 && <p className="text-amber-400 mb-0.5">Cash  &nbsp; ₹{inr(cash)}</p>}
      {paytm > 0 && <p className="text-blue-400  mb-0.5">Paytm &nbsp; ₹{inr(paytm)}</p>}
      {tips  > 0 && <p className="text-emerald-400">Tips  &nbsp; ₹{inr(tips)}</p>}
      <p className="text-zinc-200 font-semibold mt-2 pt-1.5 border-t border-zinc-700">
        ₹{inr(cash + paytm)}
      </p>
    </div>
  )
}

export default function Dashboard() {
  const [records,  setRecords]  = useState([])
  const [bankTxns, setBankTxns] = useState([])
  const [period,   setPeriod]   = useState('all')

  useEffect(() => {
    setRecords(getServiceRecords())
    setBankTxns(getBankTransactions())
  }, [])

  const filtered  = useMemo(() => filterByPeriod(records, period),        [records, period])
  const stats     = useMemo(() => computeStats(filtered),                  [filtered])
  const chartData = useMemo(() => groupByDate(filtered),                   [filtered])
  const staffData = useMemo(() => groupByStaff(filtered),                  [filtered])
  const expenses  = useMemo(() => getExpensesByCategory(bankTxns, period), [bankTxns, period])

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)

  const payPie = [
    { name: 'Paytm', value: stats.paytm, color: '#2563eb' },
    { name: 'Cash',  value: stats.cash,  color: '#d97706' },
    { name: 'Tips',  value: stats.tips,  color: '#059669' },
  ].filter(d => d.value > 0)

  const dailySvcCount = useMemo(() => {
    const map = {}
    for (const r of filtered) {
      if (r.entry_type !== 'service') continue
      map[r.date] = (map[r.date] || 0) + 1
    }
    return map
  }, [filtered])

  if (records.length === 0) return <EmptyState />

  return (
    <div className="min-h-full flex flex-col">

      {/* ── Sticky period bar ── */}
      <div className="sticky top-0 z-10 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800/80 px-8 py-3 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-zinc-100 font-medium">Overview</span>
          <span className="text-zinc-600 text-sm">{periodLabel(period)}</span>
        </div>
        <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-1 gap-0.5">
          {PERIODS.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors
                ${period === p.key ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-8 space-y-5">

        {/* ── KPI cards ── */}
        <div className="grid grid-cols-4 gap-4">
          <KpiCard
            label="Total Revenue"
            value={`₹${inr(stats.total)}`}
            sub={`Tips earned: ₹${inr(stats.tips)}`}
            gold
          />
          <KpiCard
            label="Services / Walk-ins"
            value={stats.serviceCount}
            sub={stats.serviceCount ? `Avg ₹${inr(stats.avgPerService)} / service` : 'No services yet'}
          />
          <KpiCard
            label="Paytm (Online)"
            value={`₹${inr(stats.paytm)}`}
            sub={`${pct(stats.paytm, stats.total)} of total`}
            valueColor="text-blue-400"
          />
          <KpiCard
            label="Cash"
            value={`₹${inr(stats.cash)}`}
            sub={`${pct(stats.cash, stats.total)} of total`}
            valueColor="text-amber-400"
          />
        </div>

        {/* ── Revenue chart + Payment split ── */}
        <div className="grid grid-cols-3 gap-4">

          {/* Bar chart — 2/3 width */}
          <div className="col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-zinc-200 font-medium">Revenue Trend</p>
                <p className="text-zinc-500 text-xs mt-0.5">Daily cash + Paytm collected</p>
              </div>
              <div className="flex gap-4">
                <Legend2 color="#d97706" label="Cash" />
                <Legend2 color="#2563eb" label="Paytm" />
              </div>
            </div>
            {chartData.length === 0 ? (
              <NoData h={220} />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} barCategoryGap="30%">
                  <CartesianGrid vertical={false} stroke="#27272a" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={d => dateFmt(d)}
                    tick={{ fill: '#71717a', fontSize: 11 }}
                    axisLine={{ stroke: '#3f3f46' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#71717a', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={44}
                    tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                  />
                  <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="cash"  stackId="a" fill="#d97706" radius={[0,0,0,0]} />
                  <Bar dataKey="paytm" stackId="a" fill="#2563eb" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Donut — 1/3 width */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <p className="text-zinc-200 font-medium mb-0.5">Payment Split</p>
            <p className="text-zinc-500 text-xs mb-4">Online vs cash vs tips</p>
            {payPie.length === 0 ? (
              <NoData h={180} />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={payPie}
                      cx="50%" cy="50%"
                      innerRadius={48} outerRadius={68}
                      dataKey="value"
                      strokeWidth={0}
                      paddingAngle={3}
                    >
                      {payPie.map(e => <Cell key={e.name} fill={e.color} />)}
                    </Pie>
                    <Tooltip
                      formatter={v => [`₹${inr(v)}`, '']}
                      contentStyle={{ background: '#27272a', border: '1px solid #3f3f46', borderRadius: 8, fontSize: 12 }}
                      itemStyle={{ color: '#e4e3df' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-2">
                  {payPie.map(d => (
                    <div key={d.name} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 text-zinc-400">
                        <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: d.color }} />
                        {d.name}
                      </span>
                      <span className="text-zinc-300 tabular-nums">
                        ₹{inr(d.value)}{' '}
                        <span className="text-zinc-600">({pct(d.value, stats.total + stats.tips)})</span>
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Daily table + Expenses + Staff ── */}
        <div className="grid grid-cols-3 gap-4">

          {/* Daily breakdown table — 2/3 */}
          <div className="col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-800">
              <p className="text-zinc-200 font-medium">Daily Breakdown</p>
              <p className="text-zinc-500 text-xs mt-0.5">Day-by-day service summary</p>
            </div>
            {chartData.length === 0 ? (
              <div className="p-8 text-center text-zinc-600 text-sm">No data for this period</div>
            ) : (
              <div className="overflow-x-auto max-h-72 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0">
                    <tr className="bg-zinc-800/80 text-zinc-500 text-xs">
                      <th className="px-5 py-3 text-left font-normal">Date</th>
                      <th className="px-5 py-3 text-right font-normal">Services</th>
                      <th className="px-5 py-3 text-right font-normal">Cash</th>
                      <th className="px-5 py-3 text-right font-normal">Paytm</th>
                      <th className="px-5 py-3 text-right font-normal">Tips</th>
                      <th className="px-5 py-3 text-right font-normal">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {[...chartData]
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .map(d => (
                        <tr key={d.date} className="hover:bg-zinc-800/20 transition-colors">
                          <td className="px-5 py-2.5 text-zinc-300">{dateFmt(d.date)}</td>
                          <td className="px-5 py-2.5 text-right text-zinc-400">{dailySvcCount[d.date] || 0}</td>
                          <td className="px-5 py-2.5 text-right text-amber-500 tabular-nums">
                            {d.cash  > 0 ? `₹${inr(d.cash)}`  : '—'}
                          </td>
                          <td className="px-5 py-2.5 text-right text-blue-400 tabular-nums">
                            {d.paytm > 0 ? `₹${inr(d.paytm)}` : '—'}
                          </td>
                          <td className="px-5 py-2.5 text-right text-emerald-400 tabular-nums">
                            {d.tips  > 0 ? `₹${inr(d.tips)}`  : '—'}
                          </td>
                          <td className="px-5 py-2.5 text-right text-zinc-100 font-medium tabular-nums">
                            ₹{inr(d.cash + d.paytm)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-zinc-800/50 border-t border-zinc-700 text-xs font-semibold">
                      <td className="px-5 py-3 text-zinc-400">Total</td>
                      <td className="px-5 py-3 text-right text-zinc-300">{stats.serviceCount}</td>
                      <td className="px-5 py-3 text-right text-amber-400 tabular-nums">₹{inr(stats.cash)}</td>
                      <td className="px-5 py-3 text-right text-blue-400 tabular-nums">₹{inr(stats.paytm)}</td>
                      <td className="px-5 py-3 text-right text-emerald-400 tabular-nums">₹{inr(stats.tips)}</td>
                      <td className="px-5 py-3 text-right text-zinc-100 tabular-nums">₹{inr(stats.total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Right column: Expenses + Top staff */}
          <div className="space-y-4">

            {/* Expenses */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-zinc-200 font-medium">Expenses</p>
                  <p className="text-zinc-500 text-xs mt-0.5">From bank statement</p>
                </div>
                {totalExpenses > 0 && (
                  <span className="text-red-400 text-sm font-semibold tabular-nums">₹{inr(totalExpenses)}</span>
                )}
              </div>
              {expenses.length === 0 ? (
                <p className="text-zinc-600 text-sm">
                  {bankTxns.length === 0
                    ? <><Link to="/import" className="underline hover:text-zinc-400">Import bank statement</Link> to see expenses</>
                    : 'No expenses in this period'}
                </p>
              ) : (
                <div className="space-y-3">
                  {expenses.map(e => (
                    <div key={e.category}>
                      <div className="flex justify-between mb-1">
                        <span className="text-zinc-400 text-xs capitalize">{e.category.replace(/_/g, ' ')}</span>
                        <span className="text-zinc-300 text-xs font-medium tabular-nums">₹{inr(e.amount)}</span>
                      </div>
                      <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-1 rounded-full"
                          style={{
                            width: `${(e.amount / expenses[0].amount) * 100}%`,
                            background: EXPENSE_COLORS[e.category] || '#71717a',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top staff */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-zinc-200 font-medium">Top Staff</p>
                <Link to="/staff" className="text-zinc-600 hover:text-zinc-400 text-xs">All →</Link>
              </div>
              {staffData.length === 0 ? (
                <p className="text-zinc-600 text-sm">No data for this period</p>
              ) : (
                <div className="space-y-3">
                  {staffData.slice(0, 5).map((s, i) => (
                    <div key={s.name} className="flex items-center gap-3">
                      <span className={`text-xs font-bold w-4 text-center ${i === 0 ? 'text-amber-400' : 'text-zinc-600'}`}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between">
                          <span className="text-zinc-300 text-xs truncate">{s.name}</span>
                          <span className="text-zinc-200 text-xs font-semibold ml-2 tabular-nums">₹{inr(s.total)}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className="h-1 rounded-full bg-amber-500/50"
                              style={{ width: `${(s.total / staffData[0].total) * 100}%` }}
                            />
                          </div>
                          <span className="text-zinc-600 text-xs">{s.services} svcs</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, gold, valueColor = 'text-zinc-100' }) {
  return (
    <div className={`bg-zinc-900 rounded-xl px-5 py-4 border
      ${gold ? 'border-amber-500/40 border-t-[3px] border-t-amber-400' : 'border-zinc-800'}`}>
      <p className="text-zinc-500 text-xs uppercase tracking-wide mb-3">{label}</p>
      <p className={`text-2xl font-semibold tabular-nums mb-1 ${valueColor}`}>{value}</p>
      {sub && <p className="text-zinc-600 text-xs">{sub}</p>}
    </div>
  )
}

function Legend2({ color, label }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-zinc-500">
      <span className="w-3 h-2.5 rounded-sm" style={{ background: color }} />
      {label}
    </span>
  )
}

function NoData({ h = 160 }) {
  return (
    <div className="flex items-center justify-center text-zinc-600 text-sm" style={{ height: h }}>
      No data for this period
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 max-w-sm text-center">
        <div className="text-5xl mb-5">📊</div>
        <h2 className="font-serif text-xl text-zinc-100 mb-2">Welcome to BizReport</h2>
        <p className="text-zinc-500 text-sm mb-6 leading-relaxed">
          Import your WhatsApp staff chat and bank statement to populate the dashboard.
        </p>
        <Link
          to="/import"
          className="inline-block bg-zinc-700 hover:bg-zinc-600 text-zinc-100 text-sm px-6 py-2.5 rounded-lg transition-colors"
        >
          Go to Import →
        </Link>
        <div className="mt-6 grid grid-cols-3 gap-2 text-left">
          {[
            ['📱', 'Chat',  'Export .txt from WhatsApp'],
            ['🏦', 'Bank',  'Bank PDF or CSV'],
            ['📊', 'Stats', 'Live dashboard instantly'],
          ].map(([icon, title, desc]) => (
            <div key={title} className="bg-zinc-800/50 rounded-lg p-3">
              <p className="text-base mb-1">{icon}</p>
              <p className="text-zinc-300 text-xs font-medium">{title}</p>
              <p className="text-zinc-600 text-xs leading-tight mt-0.5">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
