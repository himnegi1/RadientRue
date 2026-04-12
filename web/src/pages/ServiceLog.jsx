import { useState, useEffect, useMemo } from 'react'
import { getServiceRecords, getStaffList } from '../lib/storage.js'

const FILTERS = [
  { key: 'all',     label: 'All' },
  { key: 'service', label: 'Services' },
  { key: 'tip',     label: 'Tips' },
  { key: 'product', label: 'Products' },
]

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
}

export default function ServiceLog() {
  const [records, setRecords] = useState([])
  const [activeNames, setActiveNames] = useState(new Set())
  const [hasDisabled, setHasDisabled] = useState(false)
  const [filter, setFilter] = useState('all')
  const [showDisabled, setShowDisabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const [recs, staff] = await Promise.all([getServiceRecords(), getStaffList()])
        setRecords(recs)
        const names = new Set(staff.map(s => s.name))
        setActiveNames(names)
        setHasDisabled(recs.some(r => !names.has(r.staff_name)))
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Group by date, apply filters
  const sections = useMemo(() => {
    let filtered = records
    if (filter !== 'all') {
      filtered = filtered.filter(r => r.entry_type === filter)
    }
    if (!showDisabled) {
      filtered = filtered.filter(r => activeNames.has(r.staff_name))
    }

    const grouped = {}
    for (const r of filtered) {
      if (!grouped[r.date]) grouped[r.date] = []
      grouped[r.date].push(r)
    }

    return Object.entries(grouped)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, data]) => ({ date, data }))
  }, [records, filter, showDisabled, activeNames])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-zinc-600 border-t-amber-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="font-serif text-2xl text-zinc-100 mb-2">Service Log</h1>
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    )
  }

  if (records.length === 0) {
    return (
      <div className="p-8">
        <h1 className="font-serif text-2xl text-zinc-100 mb-2">Service Log</h1>
        <p className="text-zinc-500 text-sm">No records yet. Staff need to log services from the mobile app.</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="font-serif text-2xl text-zinc-100 mb-4">Service Log</h1>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex gap-2">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors
                ${filter === f.key
                  ? 'bg-amber-400/15 border-amber-400 text-amber-400'
                  : 'border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:border-zinc-500'
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        {hasDisabled && (
          <label className="flex items-center gap-2 cursor-pointer select-none ml-auto">
            <span className="text-zinc-400 text-sm">Show disabled staff</span>
            <button
              onClick={() => setShowDisabled(v => !v)}
              className={`relative w-10 h-5 rounded-full transition-colors ${showDisabled ? 'bg-amber-500/40' : 'bg-zinc-700'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform ${showDisabled ? 'translate-x-5 bg-amber-400' : 'bg-zinc-500'}`} />
            </button>
          </label>
        )}
      </div>

      {sections.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
          <p className="text-zinc-600 text-sm">No entries</p>
        </div>
      ) : (
        <div className="space-y-1">
          {sections.map(section => {
            const svcRecords = section.data.filter(d => d.entry_type === 'service')
            const sectionRevenue = svcRecords.reduce((s, r) => s + Number(r.amount), 0)
            return (
              <div key={section.date}>
                {/* Date header */}
                <div className="flex items-center justify-between py-2.5 mt-3">
                  <span className="text-zinc-200 text-sm font-bold">{formatDate(section.date)}</span>
                  <span className="text-zinc-500 text-xs">
                    {section.data.length} entries &middot; ₹{sectionRevenue.toLocaleString('en-IN')}
                  </span>
                </div>
                {/* Entries */}
                {section.data.map(item => {
                  const isDisabledStaff = !activeNames.has(item.staff_name)
                  const badgeLabel = item.entry_type === 'tip' ? 'TIP' : item.entry_type === 'product' ? 'PRD' : 'SVC'
                  const badgeClass = item.entry_type === 'tip'
                    ? 'bg-green-900/40 text-green-500'
                    : item.entry_type === 'product'
                    ? 'bg-purple-900/30 text-purple-400'
                    : 'bg-zinc-800 text-zinc-500'
                  const payClass = item.payment_type === 'cash' ? 'text-amber-500' : 'text-blue-400'
                  const payLabel = item.payment_type === 'cash' ? 'cash' : 'online'

                  return (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 py-2.5 border-b border-zinc-800/50
                        ${isDisabledStaff ? 'opacity-50' : ''}`}
                    >
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${badgeClass}`}>
                        {badgeLabel}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-zinc-200 text-sm font-semibold truncate">{item.staff_name}</p>
                        <p className="text-zinc-600 text-xs">{item.time?.slice(0, 5) ?? ''}</p>
                      </div>
                      <span className={`text-xs ${payClass} mr-2`}>{payLabel}</span>
                      <span className="text-zinc-100 font-bold text-sm tabular-nums min-w-[60px] text-right">
                        ₹{Number(item.amount).toLocaleString('en-IN')}
                      </span>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
