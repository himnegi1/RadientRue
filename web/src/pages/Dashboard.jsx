import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid,
} from 'recharts'
import { getServiceRecords, getStaffList } from '../lib/storage.js'

const PERIODS = [
  { key: 'today', label: 'Today' },
  { key: 'week',  label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'all',   label: 'All Time' },
]

function fmt(n) {
  n = Math.round(n || 0)
  if (n >= 100000) return (n / 100000).toFixed(1) + 'L'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return n.toLocaleString('en-IN')
}

function inr(n) {
  return Math.round(n || 0).toLocaleString('en-IN')
}

function pct(part, total) {
  if (!total) return '0%'
  return Math.round((part / total) * 100) + '%'
}

function getDateRange(period) {
  const now = new Date()
  const today = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
  if (period === 'today') return { from: today, to: today }
  if (period === 'week') {
    const d = new Date(today + 'T12:00:00')
    const day = d.getDay()
    const diff = day === 0 ? 6 : day - 1
    const start = new Date(d)
    start.setDate(start.getDate() - diff)
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    const f = dt => dt.toISOString().slice(0, 10)
    return { from: f(start), to: f(end) }
  }
  if (period === 'month') {
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    return { from: `${y}-${m}-01`, to: `${y}-${m}-31` }
  }
  return { from: '', to: '' }
}

function filterByPeriod(records, period) {
  if (period === 'all') return records
  const { from, to } = getDateRange(period)
  return records.filter(r => r.date >= from && r.date <= to)
}

function useIsDark() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  useEffect(() => {
    const obs = new MutationObserver(() => {
      setDark(document.documentElement.classList.contains('dark'))
    })
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])
  return dark
}

export default function Dashboard() {
  const [records, setRecords] = useState([])
  const [activeStaff, setActiveStaff] = useState([])
  const [period, setPeriod] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const isDark = useIsDark()

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const [r, s] = await Promise.all([getServiceRecords(), getStaffList()])
        setRecords(r)
        setActiveStaff(s)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = useMemo(() => filterByPeriod(records, period), [records, period])

  const services = useMemo(() => filtered.filter(r => r.entry_type === 'service'), [filtered])
  const tips = useMemo(() => filtered.filter(r => r.entry_type === 'tip'), [filtered])
  const totalRevenue = useMemo(() => services.reduce((s, r) => s + Number(r.amount), 0), [services])
  const totalTips = useMemo(() => tips.reduce((s, r) => s + Number(r.amount), 0), [tips])
  const totalPaytm = useMemo(() => services.filter(r => r.payment_type !== 'cash').reduce((s, r) => s + Number(r.amount), 0), [services])
  const totalCash = useMemo(() => services.filter(r => r.payment_type === 'cash').reduce((s, r) => s + Number(r.amount), 0), [services])
  const paytmPct = totalRevenue > 0 ? Math.round((totalPaytm / totalRevenue) * 100) : 0

  // Revenue by day of week (bar chart)
  const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  const dayChartData = useMemo(() => {
    const dayTotals = {}
    services.forEach(r => {
      const d = new Date(r.date)
      const day = DAYS[d.getDay()]
      dayTotals[day] = (dayTotals[day] || 0) + Number(r.amount)
    })
    return DAYS.map(day => ({ day, revenue: dayTotals[day] || 0 }))
  }, [services])

  // Donut data
  const payPie = useMemo(() => [
    { name: 'Online', value: totalPaytm, color: isDark ? '#C9A84C' : '#b45309' },
    { name: 'Cash', value: totalCash, color: isDark ? '#3f3f46' : '#d6d3d1' },
  ].filter(d => d.value > 0), [totalPaytm, totalCash, isDark])

  // Leaderboard - only active staff
  const leaderboard = useMemo(() => {
    const activeNames = new Set(activeStaff.map(s => s.name))
    const staffRevenue = {}
    services.forEach(r => {
      if (activeNames.has(r.staff_name)) {
        staffRevenue[r.staff_name] = (staffRevenue[r.staff_name] || 0) + Number(r.amount)
      }
    })
    return Object.entries(staffRevenue)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
  }, [services, activeStaff])

  // Chart theme colors
  const chartGrid = isDark ? '#27272a' : '#e7e5e4'
  const chartTick = isDark ? '#71717a' : '#78716c'
  const chartAxis = isDark ? '#3f3f46' : '#d6d3d1'
  const barFill = isDark ? 'rgba(201,168,76,0.25)' : 'rgba(180,83,9,0.18)'
  const tooltipBg = isDark ? '#27272a' : '#ffffff'
  const tooltipBorder = isDark ? '#3f3f46' : '#e7e5e4'
  const tooltipText = isDark ? '#e4e3df' : '#1c1917'

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-300 dark:border-zinc-600 border-t-amber-500 dark:border-t-amber-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-900/40 rounded-xl p-8 max-w-sm text-center">
          <p className="text-red-500 dark:text-red-400 text-sm mb-2">Failed to load data</p>
          <p className="text-stone-400 dark:text-zinc-500 text-xs">{error}</p>
        </div>
      </div>
    )
  }

  if (records.length === 0) return <EmptyState />

  return (
    <div className="min-h-full flex flex-col">
      {/* Sticky period bar */}
      <div className="sticky top-0 z-10 bg-stone-50/95 dark:bg-zinc-950/95 backdrop-blur-sm border-b border-stone-200/80 dark:border-zinc-800/80 px-8 py-3 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-stone-900 dark:text-zinc-100 font-medium">Dashboard</span>
        </div>
        <div className="flex bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-lg p-1 gap-0.5">
          {PERIODS.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors
                ${period === p.key
                  ? 'bg-stone-200 dark:bg-zinc-700 text-stone-900 dark:text-zinc-100'
                  : 'text-stone-400 dark:text-zinc-500 hover:text-stone-700 dark:hover:text-zinc-300'}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-8 space-y-5">
        {/* KPI cards */}
        <div className="grid grid-cols-4 gap-4">
          <KpiCard label="Total Revenue" value={`₹${fmt(totalRevenue)}`} gold />
          <KpiCard label="Services" value={services.length} />
          <KpiCard label="Staff Active" value={activeStaff.length} />
          <KpiCard label="Total Tips" value={`₹${fmt(totalTips)}`} />
        </div>

        {/* Revenue Trend + Payment Methods */}
        <div className="grid grid-cols-3 gap-4">
          {/* Weekly bar chart */}
          <div className="col-span-2 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl p-6">
            <div className="mb-5">
              <p className="text-stone-800 dark:text-zinc-200 font-medium">Revenue Trend</p>
              <p className="text-stone-400 dark:text-zinc-500 text-xs mt-0.5">Weekly distribution</p>
            </div>
            {dayChartData.every(d => d.revenue === 0) ? (
              <NoData h={220} />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={dayChartData} barCategoryGap="30%">
                  <CartesianGrid vertical={false} stroke={chartGrid} />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: chartTick, fontSize: 11 }}
                    axisLine={{ stroke: chartAxis }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: chartTick, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={50}
                    tickFormatter={v => v >= 100000 ? `${(v / 100000).toFixed(1)}L` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null
                      const val = payload[0]?.value || 0
                      return (
                        <div className="bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-lg px-3.5 py-2.5 text-xs shadow-xl">
                          <p className="text-stone-700 dark:text-zinc-300 font-medium mb-1">{label}</p>
                          <p className="text-amber-600 dark:text-amber-400 font-semibold">₹{inr(val)}</p>
                        </div>
                      )
                    }}
                    cursor={{ fill: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }}
                  />
                  <Bar dataKey="revenue" fill={barFill} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Payment Methods donut */}
          <div className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl p-6">
            <p className="text-stone-800 dark:text-zinc-200 font-medium mb-0.5">Payment Methods</p>
            <p className="text-stone-400 dark:text-zinc-500 text-xs mb-4">Digital vs Cash split</p>
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
                      contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 8, fontSize: 12 }}
                      itemStyle={{ color: tooltipText }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex items-center justify-center mb-3">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-stone-900 dark:text-zinc-100">{paytmPct}%</p>
                    <p className="text-stone-400 dark:text-zinc-500 text-xs tracking-widest uppercase">Digital</p>
                  </div>
                </div>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-stone-500 dark:text-zinc-400">
                      <span className="w-2.5 h-2.5 rounded-sm shrink-0 bg-amber-600 dark:bg-amber-500" />
                      Online
                    </span>
                    <span className="text-stone-700 dark:text-zinc-300 tabular-nums font-medium">₹{inr(totalPaytm)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-stone-500 dark:text-zinc-400">
                      <span className="w-2.5 h-2.5 rounded-sm shrink-0 bg-stone-300 dark:bg-zinc-600" />
                      Cash
                    </span>
                    <span className="text-stone-700 dark:text-zinc-300 tabular-nums font-medium">₹{inr(totalCash)}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Leaderboard */}
        {leaderboard.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-stone-800 dark:text-zinc-200 font-medium">Leaderboard</p>
                <p className="text-stone-400 dark:text-zinc-500 text-xs mt-0.5">Top active staff by revenue</p>
              </div>
              <Link to="/staff" className="text-stone-400 dark:text-zinc-600 hover:text-stone-600 dark:hover:text-zinc-400 text-xs">View all</Link>
            </div>
            <div className="space-y-2.5">
              {leaderboard.map(([name, rev], i) => {
                const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
                const badgeBg = i === 0 ? '#C9A84C' : i === 1 ? '#a1a1aa' : i === 2 ? '#78716c' : '#3f3f46'
                return (
                  <div key={name} className="flex items-center justify-between bg-stone-50 dark:bg-zinc-800/50 border border-stone-100 dark:border-zinc-800 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-600/80 flex items-center justify-center">
                          <span className="text-sm font-bold text-amber-700 dark:text-amber-950">{initials}</span>
                        </div>
                        <div
                          className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-zinc-900"
                          style={{ backgroundColor: badgeBg }}
                        >
                          <span className="text-[9px] font-extrabold text-black">{i + 1}</span>
                        </div>
                      </div>
                      <span className="text-stone-800 dark:text-zinc-200 font-semibold text-sm">{name}</span>
                    </div>
                    <span className="text-amber-600 dark:text-amber-400 font-bold text-sm tabular-nums">₹{fmt(rev)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function KpiCard({ label, value, gold }) {
  return (
    <div className={`bg-white dark:bg-zinc-900 rounded-xl px-5 py-4 border relative overflow-hidden
      ${gold ? 'border-amber-500/40 border-t-[3px] border-t-amber-500 dark:border-t-amber-400' : 'border-stone-200 dark:border-zinc-800'}`}>
      <div className="absolute top-0 left-0 w-[3px] h-full bg-amber-400/40" />
      <p className="text-stone-400 dark:text-zinc-500 text-[9px] uppercase tracking-[2px] mb-3">{label}</p>
      <p className="text-2xl font-bold tabular-nums text-stone-900 dark:text-zinc-100">{value}</p>
    </div>
  )
}

function NoData({ h = 160 }) {
  return (
    <div className="flex items-center justify-center text-stone-300 dark:text-zinc-600 text-sm" style={{ height: h }}>
      No data for this period
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl p-12 max-w-sm text-center">
        <div className="text-5xl mb-5">📊</div>
        <h2 className="font-serif text-xl text-stone-900 dark:text-zinc-100 mb-2">Welcome to BizReport</h2>
        <p className="text-stone-400 dark:text-zinc-500 text-sm mb-6 leading-relaxed">
          No service records found yet. Staff need to start logging services from the mobile app.
        </p>
        <Link
          to="/settings"
          className="inline-block bg-stone-200 dark:bg-zinc-700 hover:bg-stone-300 dark:hover:bg-zinc-600 text-stone-900 dark:text-zinc-100 text-sm px-6 py-2.5 rounded-lg transition-colors"
        >
          Go to Settings
        </Link>
      </div>
    </div>
  )
}
