import { useState, useEffect, useCallback } from 'react'
import {
  getAllStaff, getAllStaffStatsBatch, saveOTRecord, getOTRecord, getWeekStart, getISTDate,
} from '../lib/storage.js'

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
  return {}
}

export default function Staff() {
  const [staffList, setStaffList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showDisabled, setShowDisabled] = useState(false)
  const [otInputs, setOtInputs] = useState({})
  const [period, setPeriod] = useState('all')

  const weekStart = getWeekStart(getISTDate())

  const loadStaff = useCallback(async () => {
    try {
      setLoading(true)
      const range = getDateRange(period)
      const [allStaff, statsMap] = await Promise.all([
        getAllStaff(),
        getAllStaffStatsBatch(range),
      ])
      const otPromises = allStaff.map(s => getOTRecord(s.name, weekStart))
      const otResults = await Promise.all(otPromises)

      const list = allStaff.map((staff, i) => {
        const stats = statsMap[staff.name] || {
          totalServices: 0, totalRevenue: 0, totalTips: 0,
          totalProducts: 0, productCount: 0, daysWorked: 0,
          targetBonus: 0, productCommission: 0,
        }
        const otAmount = otResults[i] ? Number(otResults[i].ot_hours) : 0
        const salary = Number(staff.monthly_salary || 0)
        const totalPayout = salary + stats.targetBonus + stats.totalTips + stats.productCommission + otAmount
        return { ...staff, ...stats, otAmount, totalPayout }
      })
      list.sort((a, b) => b.totalRevenue - a.totalRevenue)
      setStaffList(list)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [weekStart, period])

  useEffect(() => { loadStaff() }, [loadStaff])

  async function handleSaveOT(staffName) {
    const val = parseFloat(otInputs[staffName])
    if (isNaN(val) || val < 0) return
    try {
      await saveOTRecord(staffName, weekStart, val)
      setOtInputs(prev => ({ ...prev, [staffName]: undefined }))
      window.alert(`OT saved: ₹${val} for ${staffName}`)
      loadStaff()
    } catch (err) {
      setError(err.message)
    }
  }

  const activeStaff = staffList.filter(s => s.active)
  const disabledStaff = staffList.filter(s => !s.active)
  const displayList = showDisabled ? staffList : activeStaff

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
        <h1 className="font-serif text-2xl text-stone-900 dark:text-zinc-100 mb-2">Staff</h1>
        <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>
      </div>
    )
  }

  return (
    <div className="min-h-full flex flex-col">
      {/* Sticky period bar */}
      <div className="sticky top-0 z-10 bg-stone-50/95 dark:bg-zinc-950/95 backdrop-blur-sm border-b border-stone-200/80 dark:border-zinc-800/80 px-8 py-3 flex items-center justify-between">
        <span className="text-stone-900 dark:text-zinc-100 font-medium">
          Staff Scorecards <span className="text-stone-400 dark:text-zinc-500 font-normal text-sm">({activeStaff.length} active)</span>
        </span>
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

      <div className="p-8">
        {disabledStaff.length > 0 && (
          <div className="flex items-center justify-end mb-4">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <span className="text-stone-500 dark:text-zinc-400 text-sm">Show disabled</span>
              <button
                onClick={() => setShowDisabled(v => !v)}
                className={`relative w-10 h-5 rounded-full transition-colors ${showDisabled ? 'bg-amber-500/40' : 'bg-stone-200 dark:bg-zinc-700'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform ${showDisabled ? 'translate-x-5 bg-amber-500 dark:bg-amber-400' : 'bg-stone-400 dark:bg-zinc-500'}`} />
              </button>
            </label>
          </div>
        )}

        {displayList.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl p-12 text-center">
            <p className="text-stone-300 dark:text-zinc-600 text-sm">No staff data</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {displayList.map(item => (
              <StaffScorecard
                key={item.id}
                item={item}
                period={period}
                otInput={otInputs[item.name] ?? ''}
                onOtChange={val => setOtInputs(prev => ({ ...prev, [item.name]: val }))}
                onSaveOT={() => handleSaveOT(item.name)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StaffScorecard({ item, period, otInput, onOtChange, onSaveOT }) {
  const isDisabled = !item.active
  const initial = item.name.charAt(0).toUpperCase()
  const salary = Number(item.monthly_salary || 0)

  return (
    <div className={`bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl overflow-hidden ${isDisabled ? 'opacity-50' : ''}`}>

      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-stone-100 dark:border-zinc-800">
        <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-500 flex items-center justify-center shrink-0">
          <span className="text-lg font-bold text-amber-700 dark:text-[#0f0e0c]">{initial}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-stone-800 dark:text-zinc-100 font-bold truncate">{item.name}</span>
            {isDisabled && (
              <span className="text-[9px] font-bold text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-400/10 px-1.5 py-0.5 rounded">DISABLED</span>
            )}
          </div>
          <p className="text-stone-400 dark:text-zinc-500 text-xs mt-0.5">
            {item.daysWorked} days worked &middot; {item.totalServices} services
          </p>
        </div>
      </div>

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-2 divide-x divide-stone-100 dark:divide-zinc-800 border-b border-stone-100 dark:border-zinc-800">
        <div className="px-5 py-3">
          <p className="text-stone-400 dark:text-zinc-500 text-[10px] uppercase tracking-widest mb-0.5">Total Revenue</p>
          <p className="text-stone-900 dark:text-zinc-100 font-bold text-lg tabular-nums">₹{fmt(item.totalRevenue)}</p>
        </div>
        <div className="px-5 py-3">
          <p className="text-stone-400 dark:text-zinc-500 text-[10px] uppercase tracking-widest mb-0.5">Total Payout</p>
          <p className="text-amber-600 dark:text-amber-400 font-bold text-lg tabular-nums">₹{fmt(item.totalPayout)}</p>
        </div>
      </div>

      {/* ── Two-column breakdown ── */}
      <div className="grid grid-cols-2 divide-x divide-stone-100 dark:divide-zinc-800">

        {/* LEFT — Contributed */}
        <div className="px-5 py-4 space-y-2.5">
          <p className="text-[9px] font-bold uppercase tracking-[2px] text-stone-400 dark:text-zinc-500 mb-3">Staff Contributed</p>
          <Row label="Services" value={`₹${inr(item.totalRevenue)}`} sub={`${item.totalServices} entries`} />
          <Row label="Tips" value={`₹${inr(item.totalTips)}`} highlight={item.totalTips > 0} />
          <Row label="Products" value={`${item.productCount} items`} sub={item.totalProducts > 0 ? `₹${inr(item.totalProducts)}` : null} />
        </div>

        {/* RIGHT — Owner Paid */}
        <div className="px-5 py-4 space-y-2.5">
          <p className="text-[9px] font-bold uppercase tracking-[2px] text-stone-400 dark:text-zinc-500 mb-3">Owner Paid</p>
          <Row
            label="Salary"
            value={salary > 0 ? `₹${inr(salary)}/mo` : '—'}
            muted={salary === 0}
          />
          <Row
            label="Target Bonus"
            value={`₹${inr(item.targetBonus)}`}
            highlight={item.targetBonus > 0}
            sub="10% on days ≥ ₹3k"
          />
          <Row
            label="Tips"
            value={`₹${inr(item.totalTips)}`}
            highlight={item.totalTips > 0}
          />
          <Row
            label="Products"
            value={`₹${inr(item.productCommission)}`}
            highlight={item.productCommission > 0}
            sub={item.productCount > 0 ? `${item.productCount} × ₹30` : null}
          />
          <Row
            label="Overtime"
            value={`₹${inr(item.otAmount)}`}
            highlight={item.otAmount > 0}
          />
        </div>
      </div>

      {/* ── OT input (active staff only) ── */}
      {!isDisabled && (
        <div className="flex items-center gap-2 px-5 py-3 border-t border-stone-100 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-800/30">
          <span className="text-stone-400 dark:text-zinc-500 text-xs flex-1">Update OT this week</span>
          <input
            type="number"
            min="0"
            placeholder="₹"
            value={otInput}
            onChange={e => onOtChange(e.target.value)}
            className="bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 w-24 text-sm text-stone-800 dark:text-zinc-200 text-center focus:outline-none focus:border-amber-500/50"
          />
          <button
            onClick={onSaveOT}
            className="bg-amber-100 dark:bg-amber-500/20 hover:bg-amber-200 dark:hover:bg-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
          >
            Save
          </button>
        </div>
      )}
    </div>
  )
}

function Row({ label, value, sub, highlight, muted }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div>
        <p className="text-stone-500 dark:text-zinc-400 text-xs">{label}</p>
        {sub && <p className="text-stone-300 dark:text-zinc-600 text-[10px]">{sub}</p>}
      </div>
      <p className={`text-sm font-semibold tabular-nums shrink-0
        ${highlight ? 'text-amber-600 dark:text-amber-400' : muted ? 'text-stone-300 dark:text-zinc-600' : 'text-stone-800 dark:text-zinc-200'}`}>
        {value}
      </p>
    </div>
  )
}
