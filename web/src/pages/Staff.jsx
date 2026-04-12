import { useState, useEffect, useCallback } from 'react'
import {
  getAllStaff, getAllStaffStatsBatch, saveOTRecord, getOTRecord, getWeekStart, getISTDate,
} from '../lib/storage.js'

function fmt(n) {
  n = Math.round(n || 0)
  if (n >= 100000) return (n / 100000).toFixed(1) + 'L'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return n.toLocaleString('en-IN')
}

export default function Staff() {
  const [staffList, setStaffList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showDisabled, setShowDisabled] = useState(false)
  const [otInputs, setOtInputs] = useState({})

  const weekStart = getWeekStart(getISTDate())

  const loadStaff = useCallback(async () => {
    try {
      setLoading(true)
      const [allStaff, statsMap] = await Promise.all([
        getAllStaff(),
        getAllStaffStatsBatch(),
      ])
      const otPromises = allStaff.map(s => getOTRecord(s.name, weekStart))
      const otResults = await Promise.all(otPromises)
      const list = allStaff.map((staff, i) => ({
        ...staff,
        ...(statsMap[staff.name] || { totalServices: 0, totalRevenue: 0, totalTips: 0, totalProducts: 0, daysWorked: 0 }),
        otAmount: otResults[i] ? Number(otResults[i].ot_hours) : 0,
      }))
      list.sort((a, b) => b.totalRevenue - a.totalRevenue)
      setStaffList(list)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [weekStart])

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
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-zinc-600 border-t-amber-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="font-serif text-2xl text-zinc-100 mb-2">Staff</h1>
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl text-zinc-100">Staff ({activeStaff.length})</h1>
        {disabledStaff.length > 0 && (
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <span className="text-zinc-400 text-sm">Show disabled</span>
            <button
              onClick={() => setShowDisabled(v => !v)}
              className={`relative w-10 h-5 rounded-full transition-colors ${showDisabled ? 'bg-amber-500/40' : 'bg-zinc-700'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform ${showDisabled ? 'translate-x-5 bg-amber-400' : 'bg-zinc-500'}`} />
            </button>
          </label>
        )}
      </div>

      {displayList.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
          <p className="text-zinc-600 text-sm">No staff data</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
          {displayList.map(item => {
            const isDisabled = !item.active
            const initial = item.name.charAt(0).toUpperCase()
            return (
              <div
                key={item.id}
                className={`bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3
                  ${isDisabled ? 'opacity-50' : ''}`}
              >
                {/* Header: avatar + name */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center shrink-0">
                    <span className="text-lg font-bold text-[#0f0e0c]">{initial}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-200 font-bold truncate">{item.name}</span>
                      {isDisabled && (
                        <span className="text-[9px] font-bold text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded">DISABLED</span>
                      )}
                    </div>
                    <p className="text-zinc-500 text-xs mt-0.5">
                      {item.daysWorked} days &middot; {item.totalServices} services
                    </p>
                  </div>
                </div>

                {/* Stats row */}
                <div className="flex gap-2">
                  <StatPill label="Revenue" value={`₹${fmt(item.totalRevenue)}`} gold />
                  <StatPill label="Tips" value={`₹${fmt(item.totalTips)}`} />
                  <StatPill label="Products" value={`₹${fmt(item.totalProducts || 0)}`} />
                </div>

                {/* OT Entry (active only) */}
                {!isDisabled && (
                  <div className="flex items-center gap-2 border-t border-zinc-800 pt-3">
                    <span className="text-zinc-400 text-xs flex-1">
                      OT this week: ₹{item.otAmount.toLocaleString('en-IN')}
                    </span>
                    <input
                      type="number"
                      min="0"
                      placeholder="₹"
                      value={otInputs[item.name] ?? ''}
                      onChange={e => setOtInputs(prev => ({ ...prev, [item.name]: e.target.value }))}
                      className="bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1.5 w-20 text-sm text-zinc-200 text-center focus:outline-none focus:border-amber-500/50"
                    />
                    <button
                      onClick={() => handleSaveOT(item.name)}
                      className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function StatPill({ label, value, gold }) {
  return (
    <div className="flex-1 bg-zinc-800 rounded-lg px-2.5 py-2 text-center">
      <p className="text-zinc-500 text-[10px] mb-0.5">{label}</p>
      <p className={`text-xs font-bold ${gold ? 'text-amber-400' : 'text-zinc-200'}`}>{value}</p>
    </div>
  )
}
