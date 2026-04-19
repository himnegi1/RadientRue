import { useState, useEffect, useMemo } from 'react'
import { format, startOfWeek, endOfWeek, subWeeks, eachDayOfInterval } from 'date-fns'
import { getServiceRecords, getOTRecords, getStaffList, saveOTRecord } from '../lib/storage'

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
  const [otInput, setOtInput] = useState('')
  const [savingOT, setSavingOT] = useState(false)

  async function loadAll() {
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
      if (s.length > 0 && !selectedStaff) setSelectedStaff(s[0].name)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [])

  // Settlement week: Tuesday → Monday
  const weekStart = useMemo(() => {
    const base = subWeeks(new Date(), weekOffset)
    return startOfWeek(base, { weekStartsOn: 2 })
  }, [weekOffset])

  const weekEnd = useMemo(() => endOfWeek(weekStart, { weekStartsOn: 2 }), [weekStart])
  const weekLabel = useMemo(() => `${format(weekStart, 'd MMM')} - ${format(weekEnd, 'd MMM yyyy')}`, [weekStart, weekEnd])
  const wsStr = format(weekStart, 'yyyy-MM-dd')
  const weStr = format(weekEnd, 'yyyy-MM-dd')

  const staffRecords = useMemo(() => {
    if (!selectedStaff) return []
    return records.filter(r => r.staff_name === selectedStaff && r.date >= wsStr && r.date <= weStr)
  }, [records, selectedStaff, wsStr, weStr])

  const dailyBreakdown = useMemo(() => {
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd })
    return days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd')
      const dayRecords = staffRecords.filter(r => r.date === dateStr)
      const services = dayRecords.filter(r => r.entry_type === 'service')
      const revenue = services.reduce((s, r) => s + r.amount, 0)
      const target = revenue >= BONUS_THRESHOLD ? Math.round(revenue * BONUS_RATE) : 0
      const tips = dayRecords.filter(r => r.entry_type === 'tip').reduce((s, r) => s + r.amount, 0)
      const products = dayRecords.filter(r => r.entry_type === 'product').length
      return { date: dateStr, day: format(day, 'EEE'), revenue, target, tips, products }
    })
  }, [staffRecords, weekStart, weekEnd])

  const weeklyTotals = useMemo(() => {
    const totalRevenue = dailyBreakdown.reduce((s, d) => s + d.revenue, 0)
    const totalTarget = dailyBreakdown.reduce((s, d) => s + d.target, 0)
    const totalTips = dailyBreakdown.reduce((s, d) => s + d.tips, 0)
    const totalProducts = dailyBreakdown.reduce((s, d) => s + d.products, 0)
    const productCommission = totalProducts * PRODUCT_COMMISSION
    const otRecord = otRecords.find(o => o.staff_name === selectedStaff && o.week_start === wsStr)
    const overtime = otRecord ? Number(otRecord.ot_hours) : 0
    const totalPayout = totalTarget + totalTips + productCommission + overtime
    return { totalRevenue, totalTarget, totalTips, totalProducts, productCommission, overtime, totalPayout }
  }, [dailyBreakdown, otRecords, selectedStaff, wsStr])

  async function handleSaveOT() {
    const val = parseFloat(otInput)
    if (isNaN(val) || val < 0) return
    setSavingOT(true)
    try {
      await saveOTRecord(selectedStaff, wsStr, val)
      setOtInput('')
      // Refresh OT records
      const ot = await getOTRecords()
      setOTRecords(ot)
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingOT(false)
    }
  }

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
    <div className="p-8">
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

      {/* Single card: table + payout summary together */}
      <div className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl overflow-hidden">

        {/* Table header */}
        <div className="px-6 py-4 border-b border-stone-200 dark:border-zinc-800">
          <p className="text-stone-800 dark:text-zinc-200 font-medium">Daily Breakdown</p>
          <p className="text-stone-400 dark:text-zinc-500 text-xs mt-0.5">{selectedStaff} · {weekLabel}</p>
        </div>

        {/* Daily rows */}
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-stone-50 dark:bg-zinc-800/60 text-stone-400 dark:text-zinc-500 text-xs uppercase tracking-wide">
              <th className="px-5 py-2.5 text-left font-normal w-12">Day</th>
              <th className="px-5 py-2.5 text-left font-normal">Date</th>
              <th className="px-5 py-2.5 text-right font-normal">Target</th>
              <th className="px-5 py-2.5 text-right font-normal">Tips</th>
              <th className="px-5 py-2.5 text-right font-normal">Products</th>
              <th className="px-5 py-2.5 text-right font-normal">Overtime</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 dark:divide-zinc-800/50">
            {dailyBreakdown.map(d => (
              <tr key={d.date} className="hover:bg-stone-50 dark:hover:bg-zinc-800/20 transition-colors">
                <td className="px-5 py-2.5 text-stone-500 dark:text-zinc-400">{d.day}</td>
                <td className="px-5 py-2.5 text-stone-700 dark:text-zinc-300">{d.date}</td>
                <td className={`px-5 py-2.5 text-right tabular-nums ${d.target > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-stone-300 dark:text-zinc-600'}`}>
                  {d.target > 0 ? `₹${inr(d.target)}` : '—'}
                </td>
                <td className={`px-5 py-2.5 text-right tabular-nums ${d.tips > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-300 dark:text-zinc-600'}`}>
                  {d.tips > 0 ? `₹${inr(d.tips)}` : '—'}
                </td>
                <td className="px-5 py-2.5 text-right text-stone-500 dark:text-zinc-400 tabular-nums">
                  {d.products > 0 ? d.products : '—'}
                </td>
                <td className="px-5 py-2.5 text-right text-stone-300 dark:text-zinc-600 tabular-nums">—</td>
              </tr>
            ))}
          </tbody>

          {/* Weekly totals row */}
          <tfoot>
            <tr className="bg-stone-50 dark:bg-zinc-800/50 border-t-2 border-stone-200 dark:border-zinc-700 text-xs font-semibold">
              <td className="px-5 py-3 text-stone-500 dark:text-zinc-400" colSpan={2}>Week Total</td>
              <td className="px-5 py-3 text-right text-amber-600 dark:text-amber-400 tabular-nums">₹{inr(weeklyTotals.totalTarget)}</td>
              <td className="px-5 py-3 text-right text-emerald-600 dark:text-emerald-400 tabular-nums">₹{inr(weeklyTotals.totalTips)}</td>
              <td className="px-5 py-3 text-right text-stone-700 dark:text-zinc-300 tabular-nums">{weeklyTotals.totalProducts}</td>
              <td className="px-5 py-3 text-right text-purple-600 dark:text-purple-400 tabular-nums">₹{inr(weeklyTotals.overtime)}</td>
            </tr>
          </tfoot>
        </table>

        {/* Payout summary — same width as table, below the fold */}
        <div className="border-t-2 border-dashed border-stone-200 dark:border-zinc-700">
          <div className="px-6 py-3 bg-stone-50 dark:bg-zinc-800/40">
            <p className="text-[10px] font-bold uppercase tracking-[2px] text-stone-400 dark:text-zinc-500">Payout Summary</p>
          </div>

          {/* Summary rows — same column alignment as table */}
          <table className="w-full text-sm">
            <tbody className="divide-y divide-stone-100 dark:divide-zinc-800/50">
              <PayoutRow label="Target" sub="10% on days ≥ ₹3k" value={`₹${inr(weeklyTotals.totalTarget)}`} color="text-amber-600 dark:text-amber-400" />
              <PayoutRow label="Tips" sub="Passed to staff" value={`₹${inr(weeklyTotals.totalTips)}`} color="text-emerald-600 dark:text-emerald-400" />
              <PayoutRow label="Products" sub={`${weeklyTotals.totalProducts} × ₹${PRODUCT_COMMISSION}`} value={`₹${inr(weeklyTotals.productCommission)}`} color="text-blue-600 dark:text-blue-400" />

              {/* OT row with inline input */}
              <tr className="hover:bg-stone-50 dark:hover:bg-zinc-800/20 transition-colors">
                <td className="px-5 py-3" colSpan={2}>
                  <p className="text-stone-700 dark:text-zinc-300 font-medium text-sm">Overtime</p>
                  <p className="text-stone-400 dark:text-zinc-500 text-xs">This week's OT</p>
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <input
                      type="number"
                      min="0"
                      placeholder="₹"
                      value={otInput}
                      onChange={e => setOtInput(e.target.value)}
                      className="bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-lg px-2.5 py-1 w-24 text-sm text-stone-800 dark:text-zinc-200 text-right focus:outline-none focus:border-amber-500/50"
                    />
                    <button
                      onClick={handleSaveOT}
                      disabled={savingOT || !otInput}
                      className="bg-amber-100 dark:bg-amber-500/20 hover:bg-amber-200 dark:hover:bg-amber-500/30 disabled:opacity-40 text-amber-700 dark:text-amber-400 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                    >
                      {savingOT ? '...' : 'Save'}
                    </button>
                    <span className="text-purple-600 dark:text-purple-400 font-semibold tabular-nums min-w-[60px] text-right">
                      ₹{inr(weeklyTotals.overtime)}
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>

            {/* Total payout footer */}
            <tfoot>
              <tr className="bg-amber-50 dark:bg-amber-900/10 border-t-2 border-amber-200 dark:border-amber-500/30">
                <td className="px-5 py-4" colSpan={2}>
                  <p className="text-stone-700 dark:text-zinc-300 font-bold text-sm">Total Payout</p>
                  <p className="text-stone-400 dark:text-zinc-500 text-xs mt-0.5">Revenue: ₹{inr(weeklyTotals.totalRevenue)}</p>
                </td>
                <td className="px-5 py-4 text-right">
                  <p className="text-amber-600 dark:text-amber-400 font-bold text-xl tabular-nums">₹{inr(weeklyTotals.totalPayout)}</p>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}

function PayoutRow({ label, sub, value, color }) {
  return (
    <tr className="hover:bg-stone-50 dark:hover:bg-zinc-800/20 transition-colors">
      <td className="px-5 py-3" colSpan={2}>
        <p className="text-stone-700 dark:text-zinc-300 font-medium text-sm">{label}</p>
        {sub && <p className="text-stone-400 dark:text-zinc-500 text-xs">{sub}</p>}
      </td>
      <td className={`px-5 py-3 text-right font-semibold tabular-nums ${color}`}>{value}</td>
    </tr>
  )
}
