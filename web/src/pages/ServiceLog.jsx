import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { getServiceRecords, deleteServiceRecord } from '../lib/storage.js'

export default function ServiceLog() {
  const [records, setRecords] = useState([])
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    staff: '',
    payment: '',
    type: '',
  })
  const [sortField, setSortField] = useState('date')
  const [sortDir, setSortDir] = useState('desc')

  useEffect(() => {
    setRecords(getServiceRecords())
  }, [])

  const staffNames = useMemo(
    () => [...new Set(records.map(r => r.staff_name))].sort(),
    [records]
  )

  const filtered = useMemo(() => {
    return records
      .filter(r => {
        if (filters.dateFrom && r.date < filters.dateFrom) return false
        if (filters.dateTo && r.date > filters.dateTo) return false
        if (filters.staff && r.staff_name !== filters.staff) return false
        if (filters.payment && r.payment_type !== filters.payment) return false
        if (filters.type && r.entry_type !== filters.type) return false
        return true
      })
      .sort((a, b) => {
        let va = a[sortField]
        let vb = b[sortField]
        if (sortField === 'amount') { va = Number(va); vb = Number(vb) }
        if (va < vb) return sortDir === 'asc' ? -1 : 1
        if (va > vb) return sortDir === 'asc' ? 1 : -1
        return 0
      })
  }, [records, filters, sortField, sortDir])

  const totals = useMemo(() => ({
    services: filtered.filter(r => r.entry_type === 'service').length,
    cash: filtered.filter(r => r.payment_type === 'cash' && r.entry_type === 'service').reduce((s, r) => s + r.amount, 0),
    paytm: filtered.filter(r => r.payment_type === 'paytm' && r.entry_type === 'service').reduce((s, r) => s + r.amount, 0),
    tips: filtered.filter(r => r.entry_type === 'tip').reduce((s, r) => s + r.amount, 0),
  }), [filtered])

  function toggleSort(field) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  function setFilter(key, val) {
    setFilters(f => ({ ...f, [key]: val }))
  }

  function clearFilters() {
    setFilters({ dateFrom: '', dateTo: '', staff: '', payment: '', type: '' })
  }

  function handleDelete(id) {
    deleteServiceRecord(id)
    setRecords(r => r.filter(x => x.id !== id))
  }

  const hasFilters = Object.values(filters).some(Boolean)

  if (records.length === 0) {
    return (
      <div className="p-8">
        <h1 className="font-serif text-2xl text-zinc-100 mb-2">Service Log</h1>
        <p className="text-zinc-500 text-sm">
          No records yet.{' '}
          <Link to="/" className="text-zinc-300 underline underline-offset-2">Import WhatsApp chat</Link> first.
        </p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="font-serif text-2xl text-zinc-100 mb-1">Service Log</h1>
      <p className="text-zinc-500 text-sm mb-6">{records.length} total records</p>

      {/* Summary bar */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <Card label="Services" value={totals.services} />
        <Card label="Cash collected" value={`₹${totals.cash.toLocaleString('en-IN')}`} valueClass="text-yellow-400" />
        <Card label="Paytm collected" value={`₹${totals.paytm.toLocaleString('en-IN')}`} valueClass="text-blue-400" />
        <Card label="Tips" value={`₹${totals.tips.toLocaleString('en-IN')}`} valueClass="text-green-400" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <input
          type="date"
          value={filters.dateFrom}
          onChange={e => setFilter('dateFrom', e.target.value)}
          className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm px-3 py-1.5 rounded-md"
        />
        <span className="text-zinc-600 text-sm">to</span>
        <input
          type="date"
          value={filters.dateTo}
          onChange={e => setFilter('dateTo', e.target.value)}
          className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm px-3 py-1.5 rounded-md"
        />
        <select
          value={filters.staff}
          onChange={e => setFilter('staff', e.target.value)}
          className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm px-3 py-1.5 rounded-md"
        >
          <option value="">All staff</option>
          {staffNames.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <select
          value={filters.payment}
          onChange={e => setFilter('payment', e.target.value)}
          className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm px-3 py-1.5 rounded-md"
        >
          <option value="">All payments</option>
          <option value="cash">Cash</option>
          <option value="paytm">Paytm</option>
        </select>
        <select
          value={filters.type}
          onChange={e => setFilter('type', e.target.value)}
          className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm px-3 py-1.5 rounded-md"
        >
          <option value="">All types</option>
          <option value="service">Service</option>
          <option value="tip">Tip</option>
        </select>
        {hasFilters && (
          <button onClick={clearFilters} className="text-zinc-400 hover:text-zinc-200 text-sm px-2 py-1.5 underline underline-offset-2">
            Clear
          </button>
        )}
      </div>

      <p className="text-zinc-600 text-xs mb-3">{filtered.length} matching records</p>

      {/* Table */}
      <div className="border border-zinc-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-800/60 text-zinc-400 text-xs uppercase tracking-wide">
                <SortTh field="date" current={sortField} dir={sortDir} onSort={toggleSort}>Date</SortTh>
                <SortTh field="time" current={sortField} dir={sortDir} onSort={toggleSort}>Time</SortTh>
                <SortTh field="staff_name" current={sortField} dir={sortDir} onSort={toggleSort}>Staff</SortTh>
                <SortTh field="amount" current={sortField} dir={sortDir} onSort={toggleSort} right>Amount</SortTh>
                <SortTh field="payment_type" current={sortField} dir={sortDir} onSort={toggleSort}>Payment</SortTh>
                <SortTh field="entry_type" current={sortField} dir={sortDir} onSort={toggleSort}>Type</SortTh>
                <th className="px-4 py-2.5 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/70">
              {filtered.map(r => (
                <tr key={r.id} className="text-zinc-300 hover:bg-zinc-800/20">
                  <td className="px-4 py-2 whitespace-nowrap">{r.date}</td>
                  <td className="px-4 py-2 text-zinc-500 whitespace-nowrap">{r.time ? r.time.slice(0, 5) : '—'}</td>
                  <td className="px-4 py-2">{r.staff_name}</td>
                  <td className="px-4 py-2 text-right font-medium tabular-nums">
                    ₹{r.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                      ${r.payment_type === 'cash'
                        ? 'bg-yellow-900/30 text-yellow-400'
                        : 'bg-blue-900/30 text-blue-400'
                      }`}>
                      {r.payment_type}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span className={`text-xs capitalize ${r.entry_type === 'tip' ? 'text-green-400' : 'text-zinc-500'}`}>
                      {r.entry_type}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-right">
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="text-zinc-600 hover:text-red-400 transition-colors p-1 rounded"
                      title="Delete record"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function Card({ label, value, valueClass = 'text-zinc-100' }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3">
      <div className="text-zinc-500 text-xs mb-1">{label}</div>
      <div className={`text-lg font-medium tabular-nums ${valueClass}`}>{value}</div>
    </div>
  )
}

function SortTh({ field, current, dir, onSort, children, right }) {
  const active = current === field
  return (
    <th
      className={`px-4 py-2.5 font-medium cursor-pointer select-none hover:text-zinc-200 transition-colors
        ${right ? 'text-right' : 'text-left'}`}
      onClick={() => onSort(field)}
    >
      {children}{active ? (dir === 'asc' ? ' ↑' : ' ↓') : ''}
    </th>
  )
}
