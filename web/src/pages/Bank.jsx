import { useState, useEffect, useMemo } from 'react'
import { Trash2 } from 'lucide-react'
import { getBankTransactions, deleteBankTransaction } from '../lib/storage.js'

const CATEGORY_COLOR = {
  paytm:          'text-blue-400',
  rent:           'text-orange-400',
  salary:         'text-purple-400',
  electricity:    'text-yellow-400',
  products:       'text-emerald-400',
  food:           'text-pink-400',
  owner_transfer: 'text-cyan-400',
  cash_withdrawal:'text-amber-400',
  bank_charges:   'text-red-400',
  aws:            'text-indigo-400',
  other:          'text-zinc-500',
}

export default function Bank() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({ dateFrom: '', dateTo: '', category: '', flow: '' })

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        setTransactions(await getBankTransactions())
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const categories = useMemo(
    () => [...new Set(transactions.map(t => t.category))].sort(),
    [transactions]
  )

  const filtered = useMemo(() => {
    return transactions
      .filter(t => {
        if (filters.dateFrom && t.date < filters.dateFrom) return false
        if (filters.dateTo && t.date > filters.dateTo) return false
        if (filters.category && t.category !== filters.category) return false
        if (filters.flow === 'credit' && t.credit === 0) return false
        if (filters.flow === 'debit' && t.debit === 0) return false
        return true
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1))
  }, [transactions, filters])

  const totals = useMemo(() => ({
    credits: filtered.reduce((s, t) => s + t.credit, 0),
    debits: filtered.reduce((s, t) => s + t.debit, 0),
  }), [filtered])

  function setFilter(key, val) {
    setFilters(f => ({ ...f, [key]: val }))
  }

  function clearFilters() {
    setFilters({ dateFrom: '', dateTo: '', category: '', flow: '' })
  }

  async function handleDelete(id) {
    try {
      await deleteBankTransaction(id)
      setTransactions(t => t.filter(x => x.id !== id))
    } catch (err) {
      setError(err.message)
    }
  }

  const hasFilters = Object.values(filters).some(Boolean)

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
        <h1 className="font-serif text-2xl text-zinc-100 mb-2">Bank Statement</h1>
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="p-8">
        <h1 className="font-serif text-2xl text-zinc-100 mb-2">Bank Statement</h1>
        <p className="text-zinc-500 text-sm">
          No transactions yet.
        </p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="font-serif text-2xl text-zinc-100 mb-1">Bank Statement</h1>
      <p className="text-zinc-500 text-sm mb-6">Imported bank transactions</p>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card label="Transactions" value={filtered.length} />
        <Card
          label="Total credits"
          value={`₹${totals.credits.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
          valueClass="text-green-400"
        />
        <Card
          label="Total debits"
          value={`₹${totals.debits.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
          valueClass="text-red-400"
        />
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
          value={filters.category}
          onChange={e => setFilter('category', e.target.value)}
          className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm px-3 py-1.5 rounded-md"
        >
          <option value="">All categories</option>
          {categories.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={filters.flow}
          onChange={e => setFilter('flow', e.target.value)}
          className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm px-3 py-1.5 rounded-md"
        >
          <option value="">Credits + Debits</option>
          <option value="credit">Credits only</option>
          <option value="debit">Debits only</option>
        </select>
        {hasFilters && (
          <button onClick={clearFilters} className="text-zinc-400 hover:text-zinc-200 text-sm px-2 py-1.5 underline underline-offset-2">
            Clear
          </button>
        )}
      </div>

      <p className="text-zinc-600 text-xs mb-3">{filtered.length} transactions</p>

      {/* Table */}
      <div className="border border-zinc-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-800/60 text-zinc-400 text-xs uppercase tracking-wide">
                <th className="px-4 py-2.5 text-left font-medium">Date</th>
                <th className="px-4 py-2.5 text-left font-medium">Narration</th>
                <th className="px-4 py-2.5 text-right font-medium">Debit</th>
                <th className="px-4 py-2.5 text-right font-medium">Credit</th>
                <th className="px-4 py-2.5 text-right font-medium">Balance</th>
                <th className="px-4 py-2.5 text-left font-medium">Category</th>
                <th className="px-4 py-2.5 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/70">
              {filtered.map(t => (
                <tr key={t.id} className="text-zinc-300 hover:bg-zinc-800/20">
                  <td className="px-4 py-2 whitespace-nowrap">{t.date}</td>
                  <td className="px-4 py-2 max-w-xs">
                    <span className="block truncate text-zinc-400" title={t.narration}>
                      {t.narration}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-red-400">
                    {t.debit > 0 ? `₹${t.debit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '—'}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-green-400">
                    {t.credit > 0 ? `₹${t.credit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '—'}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-zinc-500">
                    {t.balance != null ? `₹${t.balance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '—'}
                  </td>
                  <td className="px-4 py-2">
                    <span className={`text-xs capitalize ${CATEGORY_COLOR[t.category] ?? 'text-zinc-500'}`}>
                      {t.category?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-right">
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="text-zinc-600 hover:text-red-400 transition-colors p-1 rounded"
                      title="Delete transaction"
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
