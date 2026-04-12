import { useState, useEffect, useMemo } from 'react'
import { format, startOfWeek, endOfWeek, subWeeks, parseISO, eachDayOfInterval } from 'date-fns'
import { getServiceRecords, getOTRecords, getStaffList } from '../lib/storage'

const BONUS_THRESHOLD = 3000
const BONUS_RATE = 0.10
const PRODUCT_COMMISSION = 30

function inr(n) {
  return Math.round(n || 0).toLocaleString('en-IN')
}

export default function Settlement() {
  const [staffList, setStaffList] = useState([])
  const [records, setRecords] = useState([])
  const [otRecords, setOTRecords] = useState([])
  const [selectedStaff, setSelectedStaff] = useState('')
  const [weekOffset, setWeekOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const [s, r, ot] = await Promise.all([
          getStaffList(),
          getServiceRecords(),
          getOTRecords(),
        ])
        setStaffList(s)
        setRecords(r)
        setOTRecords(ot)
        if (s.length > 0) setSelectedStaff(s[0].name)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Settlement week runs Tuesday to Monday (settle Monday night, includes that Monday)
  const weekStart = useMemo(() => {
    const base = subWeeks(new Date(), weekOffset)
    return startOfWeek(base, { weekStartsOn: 2 }) // 2 = Tuesday
  }, [weekOffset])

  const weekEnd = useMemo(() => endOfWeek(weekStart, { weekStartsOn: 2 }), [weekStart])

  const weekLabel = useMemo(
    () => `${format(weekStart, 'd MMM')} - ${format(weekEnd, 'd MMM yyyy')}`,
    [weekStart, weekEnd]
  )

  const wsStr = format(weekStart, 'yyyy-MM-dd')
  const weStr = format(weekEnd, 'yyyy-MM-dd')

  // Filter records for selected staff and week
  const staffRecords = useMemo(() => {
    if (!selectedStaff) return []
    return records.filter(
      r => r.staff_name === selectedStaff && r.date >= wsStr && r.date <= weStr
    )
  }, [records, selectedStaff, wsStr, weStr])

  // Daily breakdown
  const dailyBreakdown = useMemo(() => {
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd })
    return days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd')
      const dayRecords = staffRecords.filter(r => r.date === dateStr)
      const services = dayRecords.filter(r => r.entry_type === 'service')
      const revenue = services.reduce((s, r) => s + r.amount, 0)
      const bonus = revenue >= BONUS_THRESHOLD ? Math.round(revenue * BONUS_RATE) : 0
      const tips = dayRecords.filter(r => r.entry_type === 'tip').reduce((s, r) => s + r.amount, 0)
      const products = dayRecords.filter(r => r.entry_type === 'product').length
      return { date: dateStr, day: format(day, 'EEE'), revenue, bonus, tips, products }
    })
  }, [staffRecords, weekStart, weekEnd])

  // Weekly totals
  const weeklyTotals = useMemo(() => {
    const totalRevenue = dailyBreakdown.reduce((s, d) => s + d.revenue, 0)
    const totalBonus = dailyBreakdown.reduce((s, d) => s + d.bonus, 0)
    const totalTips = dailyBreakdown.reduce((s, d) => s + d.tips, 0)
    const totalProducts = dailyBreakdown.reduce((s, d) => s + d.products, 0)
    const productCommission = totalProducts * PRODUCT_COMMISSION

    // OT from ot_records
    const otRecord = otRecords.find(
      o => o.staff_name === selectedStaff && o.week_start === wsStr
    )
    const overtime = otRecord ? Number(otRecord.ot_hours) : 0

    const totalPayout = totalBonus + totalTips + productCommission + overtime
    return { totalRevenue, totalBonus, totalTips, totalProducts, productCommission, overtime, totalPayout }
  }, [dailyBreakdown, otRecords, selectedStaff, wsStr])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-300 dark:border-zinc-600 border-t-amber-500 dark:border-t-amber-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="font-serif text-2xl text-stone-900 dark:text-zinc-100 mb-2">Settlement</h1>
        <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="font-serif text-2xl text-stone-900 dark:text-zinc-100 mb-1">Weekly Settlement</h1>
      <p className="text-stone-400 dark:text-zinc-500 text-sm mb-6">Staff payout breakdown by week</p>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          value={selectedStaff}
          onChange={e => setSelectedStaff(e.target.value)}
          className="bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 text-stone-800 dark:text-zinc-200 text-sm px-3 py-2 rounded-md"
        >
          {staffList.map(s => (
            <option key={s.id} value={s.name}>{s.name}</option>
          ))}
          {staffList.length === 0 && <option value="">No staff found</option>}
        </select>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setWeekOffset(o => o + 1)}
            className="bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 text-stone-500 dark:text-zinc-400 hover:text-stone-800 dark:hover:text-zinc-200 text-sm px-3 py-2 rounded-md transition-colors"
          >
            &larr; Prev
          </button>
          <span className="text-stone-700 dark:text-zinc-300 text-sm px-3 py-2 min-w-[180px] text-center">{weekLabel}</span>
          <button
            onClick={() => setWeekOffset(o => Math.max(0, o - 1))}
            disabled={weekOffset === 0}
            className="bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 text-stone-500 dark:text-zinc-400 hover:text-stone-800 dark:hover:text-zinc-200 disabled:text-stone-300 dark:disabled:text-zinc-600 disabled:cursor-not-allowed text-sm px-3 py-2 rounded-md transition-colors"
          >
            Next &rarr;
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        <SummaryCard label="Target Bonus" value={`₹${inr(weeklyTotals.totalBonus)}`} sub={`10% of days >= ₹3k`} color="text-amber-600 dark:text-amber-400" />
        <SummaryCard label="Tips" value={`₹${inr(weeklyTotals.totalTips)}`} sub="All tip entries" color="text-emerald-600 dark:text-emerald-400" />
        <SummaryCard label="Products" value={`₹${inr(weeklyTotals.productCommission)}`} sub={`${weeklyTotals.totalProducts} x ₹${PRODUCT_COMMISSION}`} color="text-blue-600 dark:text-blue-400" />
        <SummaryCard label="Overtime" value={`₹${inr(weeklyTotals.overtime)}`} sub="From OT records" color="text-purple-600 dark:text-purple-400" />
        <SummaryCard
          label="Total Payout"
          value={`₹${inr(weeklyTotals.totalPayout)}`}
          sub={`Revenue: ₹${inr(weeklyTotals.totalRevenue)}`}
          color="text-stone-900 dark:text-zinc-100"
          highlight
        />
      </div>

      {/* Daily breakdown table */}
      <div className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-200 dark:border-zinc-800">
          <p className="text-stone-800 dark:text-zinc-200 font-medium">Daily Breakdown</p>
          <p className="text-stone-400 dark:text-zinc-500 text-xs mt-0.5">{selectedStaff} - {weekLabel}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50 dark:bg-zinc-800/60 text-stone-400 dark:text-zinc-500 text-xs uppercase tracking-wide">
                <th className="px-5 py-2.5 text-left font-normal">Day</th>
                <th className="px-5 py-2.5 text-left font-normal">Date</th>
                <th className="px-5 py-2.5 text-right font-normal">Revenue</th>
                <th className="px-5 py-2.5 text-right font-normal">Bonus</th>
                <th className="px-5 py-2.5 text-right font-normal">Tips</th>
                <th className="px-5 py-2.5 text-right font-normal">Products</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-zinc-800/50">
              {dailyBreakdown.map(d => (
                <tr key={d.date} className="hover:bg-stone-50 dark:hover:bg-zinc-800/20 transition-colors">
                  <td className="px-5 py-2.5 text-stone-500 dark:text-zinc-400">{d.day}</td>
                  <td className="px-5 py-2.5 text-stone-700 dark:text-zinc-300">{d.date}</td>
                  <td className="px-5 py-2.5 text-right text-stone-800 dark:text-zinc-200 tabular-nums font-medium">
                    {d.revenue > 0 ? `₹${inr(d.revenue)}` : '—'}
                  </td>
                  <td className={`px-5 py-2.5 text-right tabular-nums ${d.bonus > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-stone-300 dark:text-zinc-600'}`}>
                    {d.bonus > 0 ? `₹${inr(d.bonus)}` : '—'}
                  </td>
                  <td className={`px-5 py-2.5 text-right tabular-nums ${d.tips > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-300 dark:text-zinc-600'}`}>
                    {d.tips > 0 ? `₹${inr(d.tips)}` : '—'}
                  </td>
                  <td className="px-5 py-2.5 text-right text-stone-500 dark:text-zinc-400 tabular-nums">
                    {d.products > 0 ? d.products : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-stone-50 dark:bg-zinc-800/50 border-t border-stone-200 dark:border-zinc-700 text-xs font-semibold">
                <td className="px-5 py-3 text-stone-500 dark:text-zinc-400" colSpan={2}>Total</td>
                <td className="px-5 py-3 text-right text-stone-900 dark:text-zinc-100 tabular-nums">₹{inr(weeklyTotals.totalRevenue)}</td>
                <td className="px-5 py-3 text-right text-amber-600 dark:text-amber-400 tabular-nums">₹{inr(weeklyTotals.totalBonus)}</td>
                <td className="px-5 py-3 text-right text-emerald-600 dark:text-emerald-400 tabular-nums">₹{inr(weeklyTotals.totalTips)}</td>
                <td className="px-5 py-3 text-right text-stone-700 dark:text-zinc-300 tabular-nums">{weeklyTotals.totalProducts}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}

function SummaryCard({ label, value, sub, color = 'text-stone-900 dark:text-zinc-100', highlight }) {
  return (
    <div className={`bg-white dark:bg-zinc-900 rounded-xl px-4 py-3.5 border
      ${highlight ? 'border-amber-500/40 border-t-[3px] border-t-amber-500 dark:border-t-amber-400' : 'border-stone-200 dark:border-zinc-800'}`}>
      <p className="text-stone-400 dark:text-zinc-500 text-xs mb-2">{label}</p>
      <p className={`text-lg font-semibold tabular-nums mb-0.5 ${color}`}>{value}</p>
      {sub && <p className="text-stone-300 dark:text-zinc-600 text-xs">{sub}</p>}
    </div>
  )
}
