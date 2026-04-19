import { useState, useEffect, useMemo } from 'react'
import { getServiceRecords, getStaffList, saveServiceRecord, getISTDate } from '../lib/storage.js'

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
  const [selectedStaff, setSelectedStaff] = useState('all')
  const [allStaffNames, setAllStaffNames] = useState([])
  const [showDisabled, setShowDisabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Manual entry form
  const [showForm, setShowForm] = useState(false)
  const [activeStaffList, setActiveStaffList] = useState([])
  const [form, setForm] = useState({
    staff_name: '',
    date: '',
    entry_type: 'service',
    payment_type: 'cash',
    amount: '',
  })
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const [recs, staff] = await Promise.all([getServiceRecords(), getStaffList()])
        setRecords(recs)
        const names = new Set(staff.map(s => s.name))
        setActiveNames(names)
        setActiveStaffList(staff)
        setForm(f => ({ ...f, date: getISTDate(), staff_name: staff[0]?.name ?? '' }))
        setHasDisabled(recs.some(r => !names.has(r.staff_name)))
        const uniqueNames = [...new Set(recs.map(r => r.staff_name))].sort()
        setAllStaffNames(uniqueNames)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Group by date, apply all filters
  const sections = useMemo(() => {
    let filtered = records
    if (filter !== 'all') filtered = filtered.filter(r => r.entry_type === filter)
    if (selectedStaff !== 'all') filtered = filtered.filter(r => r.staff_name === selectedStaff)
    if (!showDisabled) filtered = filtered.filter(r => activeNames.has(r.staff_name))

    const grouped = {}
    for (const r of filtered) {
      if (!grouped[r.date]) grouped[r.date] = []
      grouped[r.date].push(r)
    }
    return Object.entries(grouped)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, data]) => ({ date, data }))
  }, [records, filter, selectedStaff, showDisabled, activeNames]) // ← selectedStaff added

  // Overall totals across all visible sections
  const overallTotals = useMemo(() => {
    const allEntries = sections.flatMap(s => s.data)
    const totalEntries = allEntries.length
    const totalAmount = allEntries
      .filter(r => r.entry_type === 'service')
      .reduce((s, r) => s + Number(r.amount), 0)
    return { totalEntries, totalAmount }
  }, [sections])

  async function handleSaveEntry(e) {
    e.preventDefault()
    if (!form.staff_name || !form.date || !form.amount) return
    setSaving(true)
    setSaveMsg(null)
    try {
      const now = new Date().toTimeString().slice(0, 8)
      const record = {
        staff_name: form.staff_name,
        date: form.date,
        time: now,
        amount: Number(form.amount),
        entry_type: form.entry_type,
        payment_type: form.payment_type === 'online' ? 'paytm' : form.payment_type,
        source: 'manual',
      }
      const saved = await saveServiceRecord(record)
      setRecords(prev => [saved, ...prev])
      setSaveMsg('Entry saved')
      setForm(f => ({ ...f, amount: '' }))
      setTimeout(() => setSaveMsg(null), 3000)
    } catch (err) {
      setSaveMsg('Error: ' + err.message)
    } finally {
      setSaving(false)
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
        <h1 className="font-serif text-2xl text-stone-900 dark:text-zinc-100 mb-2">Service Log</h1>
        <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>
      </div>
    )
  }

  if (records.length === 0) {
    return (
      <div className="p-8">
        <h1 className="font-serif text-2xl text-stone-900 dark:text-zinc-100 mb-2">Service Log</h1>
        <p className="text-stone-400 dark:text-zinc-500 text-sm">No records yet. Staff need to log services from the mobile app.</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-serif text-2xl text-stone-900 dark:text-zinc-100">Service Log</h1>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-white text-sm font-semibold transition-colors"
        >
          <span className="text-lg leading-none">{showForm ? '×' : '+'}</span>
          {showForm ? 'Cancel' : 'Add Entry'}
        </button>
      </div>

      {/* Manual entry form */}
      {showForm && (
        <form
          onSubmit={handleSaveEntry}
          className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 rounded-xl p-5 mb-5 space-y-4"
        >
          <p className="text-stone-500 dark:text-zinc-400 text-xs uppercase tracking-widest font-semibold">Manual Entry</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {/* Staff */}
            <div className="flex flex-col gap-1">
              <label className="text-stone-500 dark:text-zinc-400 text-xs">Staff</label>
              <select
                value={form.staff_name}
                onChange={e => setForm(f => ({ ...f, staff_name: e.target.value }))}
                required
                className="bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 text-stone-800 dark:text-zinc-200 text-sm px-3 py-2 rounded-md"
              >
                {activeStaffList.map(s => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div className="flex flex-col gap-1">
              <label className="text-stone-500 dark:text-zinc-400 text-xs">Date</label>
              <input
                type="date"
                value={form.date}
                max={getISTDate()}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                required
                className="bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 text-stone-800 dark:text-zinc-200 text-sm px-3 py-2 rounded-md"
              />
            </div>

            {/* Amount */}
            <div className="flex flex-col gap-1">
              <label className="text-stone-500 dark:text-zinc-400 text-xs">Amount (₹)</label>
              <input
                type="number"
                min="1"
                placeholder="e.g. 500"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                required
                className="bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 text-stone-800 dark:text-zinc-200 text-sm px-3 py-2 rounded-md"
              />
            </div>

            {/* Entry type */}
            <div className="flex flex-col gap-1">
              <label className="text-stone-500 dark:text-zinc-400 text-xs">Type</label>
              <div className="flex gap-2">
                {['service', 'tip', 'product'].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, entry_type: t }))}
                    className={`flex-1 py-2 rounded-md text-xs font-semibold border transition-colors capitalize
                      ${form.entry_type === t
                        ? 'bg-amber-100 dark:bg-amber-400/15 border-amber-500 dark:border-amber-400 text-amber-700 dark:text-amber-400'
                        : 'border-stone-200 dark:border-zinc-700 text-stone-400 dark:text-zinc-500 hover:border-stone-400 dark:hover:border-zinc-500'
                      }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment type */}
            <div className="flex flex-col gap-1">
              <label className="text-stone-500 dark:text-zinc-400 text-xs">Payment</label>
              <div className="flex gap-2">
                {['cash', 'online'].map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, payment_type: p }))}
                    className={`flex-1 py-2 rounded-md text-xs font-semibold border transition-colors capitalize
                      ${form.payment_type === p
                        ? 'bg-amber-100 dark:bg-amber-400/15 border-amber-500 dark:border-amber-400 text-amber-700 dark:text-amber-400'
                        : 'border-stone-200 dark:border-zinc-700 text-stone-400 dark:text-zinc-500 hover:border-stone-400 dark:hover:border-zinc-500'
                      }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
            >
              {saving ? 'Saving…' : 'Save Entry'}
            </button>
            {saveMsg && (
              <span className={`text-sm ${saveMsg.startsWith('Error') ? 'text-red-400' : 'text-emerald-500'}`}>
                {saveMsg}
              </span>
            )}
          </div>
        </form>
      )}

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select
          value={selectedStaff}
          onChange={e => setSelectedStaff(e.target.value)}
          className="bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 text-stone-800 dark:text-zinc-200 text-sm px-3 py-2 rounded-md"
        >
          <option value="all">All Staff</option>
          {allStaffNames.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>

        <div className="flex gap-2">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors
                ${filter === f.key
                  ? 'bg-amber-100 dark:bg-amber-400/15 border-amber-500 dark:border-amber-400 text-amber-700 dark:text-amber-400'
                  : 'border-stone-200 dark:border-zinc-700 text-stone-400 dark:text-zinc-500 hover:text-stone-700 dark:hover:text-zinc-300 hover:border-stone-400 dark:hover:border-zinc-500'
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {hasDisabled && (
          <label className="flex items-center gap-2 cursor-pointer select-none ml-auto">
            <span className="text-stone-500 dark:text-zinc-400 text-sm">Show disabled staff</span>
            <button
              onClick={() => setShowDisabled(v => !v)}
              className={`relative w-10 h-5 rounded-full transition-colors ${showDisabled ? 'bg-amber-500/40' : 'bg-stone-200 dark:bg-zinc-700'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform ${showDisabled ? 'translate-x-5 bg-amber-500 dark:bg-amber-400' : 'bg-stone-400 dark:bg-zinc-500'}`} />
            </button>
          </label>
        )}
      </div>

      {/* Overall summary strip */}
      {sections.length > 0 && (
        <div className="flex items-center gap-6 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl px-5 py-3 mb-5">
          <div>
            <p className="text-stone-400 dark:text-zinc-500 text-[10px] uppercase tracking-widest">Total Entries</p>
            <p className="text-stone-900 dark:text-zinc-100 font-bold text-lg">{overallTotals.totalEntries}</p>
          </div>
          <div className="w-px h-8 bg-stone-200 dark:bg-zinc-700" />
          <div>
            <p className="text-stone-400 dark:text-zinc-500 text-[10px] uppercase tracking-widest">Total Revenue</p>
            <p className="text-amber-600 dark:text-amber-400 font-bold text-lg tabular-nums">
              ₹{overallTotals.totalAmount.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="w-px h-8 bg-stone-200 dark:bg-zinc-700" />
          <div>
            <p className="text-stone-400 dark:text-zinc-500 text-[10px] uppercase tracking-widest">Days</p>
            <p className="text-stone-900 dark:text-zinc-100 font-bold text-lg">{sections.length}</p>
          </div>
        </div>
      )}

      {sections.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl p-12 text-center">
          <p className="text-stone-300 dark:text-zinc-600 text-sm">No entries</p>
        </div>
      ) : (
        <div className="space-y-1">
          {sections.map(section => {
            const svcRecords = section.data.filter(d => d.entry_type === 'service')
            const sectionRevenue = svcRecords.reduce((s, r) => s + Number(r.amount), 0)
            return (
              <div key={section.date}>
                {/* Date header with daily totals */}
                <div className="flex items-center justify-between py-2.5 mt-3">
                  <span className="text-stone-800 dark:text-zinc-200 text-sm font-bold">{formatDate(section.date)}</span>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-stone-400 dark:text-zinc-500">{section.data.length} entries</span>
                    <span className="text-stone-300 dark:text-zinc-700">·</span>
                    <span className="text-amber-600 dark:text-amber-400 font-semibold tabular-nums">
                      ₹{sectionRevenue.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Entries */}
                {section.data.map(item => {
                  const isDisabledStaff = !activeNames.has(item.staff_name)
                  const badgeLabel = item.entry_type === 'tip' ? 'TIP' : item.entry_type === 'product' ? 'PRD' : 'SVC'
                  const badgeClass = item.entry_type === 'tip'
                    ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-500'
                    : item.entry_type === 'product'
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                    : 'bg-stone-100 dark:bg-zinc-800 text-stone-500 dark:text-zinc-500'
                  const payClass = item.payment_type === 'cash' ? 'text-amber-600 dark:text-amber-500' : 'text-blue-600 dark:text-blue-400'
                  const payLabel = item.payment_type === 'cash' ? 'cash' : 'online'

                  return (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 py-2.5 border-b border-stone-100 dark:border-zinc-800/50
                        ${isDisabledStaff ? 'opacity-50' : ''}`}
                    >
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${badgeClass}`}>
                        {badgeLabel}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-stone-800 dark:text-zinc-200 text-sm font-semibold truncate">{item.staff_name}</p>
                        <p className="text-stone-300 dark:text-zinc-600 text-xs">{item.time?.slice(0, 5) ?? ''}</p>
                      </div>
                      <span className={`text-xs ${payClass} mr-2`}>{payLabel}</span>
                      <span className="text-stone-900 dark:text-zinc-100 font-bold text-sm tabular-nums min-w-[60px] text-right">
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
