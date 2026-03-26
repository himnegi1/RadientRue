import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { getServiceRecords, getAttendance, deleteStaffRecords } from '../lib/storage.js'
import { filterByPeriod, groupByStaff, periodLabel } from '../lib/analytics.js'

const PERIODS = [
  { key: 'today', label: 'Today' },
  { key: 'week',  label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'all',   label: 'All Time' },
]

function inr(n) {
  return n.toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

export default function Staff() {
  const [records,    setRecords]    = useState([])
  const [attendance, setAttendance] = useState([])
  const [period,     setPeriod]     = useState('month')

  useEffect(() => {
    setRecords(getServiceRecords())
    setAttendance(getAttendance())
  }, [])

  function handleDeleteStaff(name) {
    if (!window.confirm(`Permanently delete all records for "${name}"? This cannot be undone.`)) return
    deleteStaffRecords(name)
    setRecords(getServiceRecords())
    setAttendance(getAttendance())
  }

  const filtered  = useMemo(() => filterByPeriod(records, period), [records, period])
  const staffData = useMemo(() => groupByStaff(filtered), [filtered])

  // Days worked per staff in period
  const daysWorked = useMemo(() => {
    const attFiltered = filterByPeriod(attendance.map(a => ({ ...a, entry_type: 'service' })), period)
    const map = {}
    for (const a of attFiltered) {
      if (!map[a.staff_name]) map[a.staff_name] = new Set()
      map[a.staff_name].add(a.date)
    }
    return Object.fromEntries(Object.entries(map).map(([k, v]) => [k, v.size]))
  }, [attendance, period])

  if (records.length === 0) {
    return (
      <div className="p-8">
        <h1 className="font-serif text-2xl text-zinc-100 mb-2">Staff Performance</h1>
        <p className="text-zinc-500 text-sm">
          No data yet.{' '}
          <Link to="/import" className="text-zinc-300 underline underline-offset-2">Import WhatsApp chat</Link> first.
        </p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl text-zinc-100">Staff Performance</h1>
          <p className="text-zinc-500 text-xs mt-0.5">{periodLabel(period)}</p>
        </div>
        <div className="flex gap-0.5 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
          {PERIODS.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors
                ${period === p.key ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {staffData.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center">
          <p className="text-zinc-600 text-sm">No data for this period</p>
        </div>
      ) : (
        <>
          {/* Summary cards per staff */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {staffData.map(s => (
              <div key={s.name} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-zinc-300 font-medium">{s.name}</p>
                  <button
                    onClick={() => handleDeleteStaff(s.name)}
                    title={`Delete all records for ${s.name}`}
                    className="text-zinc-600 hover:text-red-400 transition-colors p-0.5"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                  <span className="text-zinc-500">Services</span>
                  <span className="text-zinc-200 text-right">{s.services}</span>
                  <span className="text-zinc-500">Revenue</span>
                  <span className="text-zinc-200 text-right font-medium">₹{inr(s.total)}</span>
                  <span className="text-zinc-500">Cash</span>
                  <span className="text-yellow-500 text-right">₹{inr(s.cash)}</span>
                  <span className="text-zinc-500">Paytm</span>
                  <span className="text-blue-400 text-right">₹{inr(s.paytm)}</span>
                  <span className="text-zinc-500">Tips</span>
                  <span className="text-green-400 text-right">₹{inr(s.tips)}</span>
                  <span className="text-zinc-500">Avg / service</span>
                  <span className="text-zinc-300 text-right">₹{inr(s.avg)}</span>
                  {daysWorked[s.name] != null && (
                    <>
                      <span className="text-zinc-500">Days present</span>
                      <span className="text-zinc-300 text-right">{daysWorked[s.name]}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Comparison table */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
            <div className="px-5 py-3 border-b border-zinc-800">
              <h2 className="text-zinc-400 text-xs font-medium uppercase tracking-wide">Comparison</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-800/40 text-zinc-500 text-xs">
                  <th className="px-5 py-2.5 text-left font-normal">Staff</th>
                  <th className="px-5 py-2.5 text-right font-normal">Services</th>
                  <th className="px-5 py-2.5 text-right font-normal">Cash</th>
                  <th className="px-5 py-2.5 text-right font-normal">Paytm</th>
                  <th className="px-5 py-2.5 text-right font-normal">Tips</th>
                  <th className="px-5 py-2.5 text-right font-normal">Avg / Svc</th>
                  <th className="px-5 py-2.5 text-right font-normal">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {staffData.map((s, i) => (
                  <tr key={s.name} className="hover:bg-zinc-800/20">
                    <td className="px-5 py-3 text-zinc-300">
                      {i === 0 && <span className="text-amber-500 mr-1.5 text-xs">★</span>}
                      {s.name}
                    </td>
                    <td className="px-5 py-3 text-right text-zinc-400">{s.services}</td>
                    <td className="px-5 py-3 text-right text-yellow-600">₹{inr(s.cash)}</td>
                    <td className="px-5 py-3 text-right text-blue-500">₹{inr(s.paytm)}</td>
                    <td className="px-5 py-3 text-right text-green-500">₹{inr(s.tips)}</td>
                    <td className="px-5 py-3 text-right text-zinc-400">₹{inr(s.avg)}</td>
                    <td className="px-5 py-3 text-right text-zinc-100 font-medium">₹{inr(s.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
