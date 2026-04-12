import { useState, useEffect } from 'react'
import { getStaffList, getDisabledStaffList, addStaff, disableStaff, enableStaff, resetAllData } from '../lib/storage.js'

export default function Settings({ onLogout }) {
  const [activeStaff, setActiveStaff] = useState([])
  const [disabledStaff, setDisabledStaff] = useState([])
  const [showDisabled, setShowDisabled] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [adding, setAdding] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState('')

  async function loadStaff() {
    try {
      setLoading(true)
      const [active, disabled] = await Promise.all([
        getStaffList(),
        getDisabledStaffList(),
      ])
      setActiveStaff(active)
      setDisabledStaff(disabled)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadStaff() }, [])

  async function handleAddStaff() {
    if (!newName.trim()) {
      window.alert('Enter staff name')
      return
    }
    setAdding(true)
    try {
      const staff = await addStaff(newName.trim(), newPhone.trim())
      if (staff) {
        setSuccessMsg(`${staff.name} added! PIN: ${staff.pin} -- Share this PIN with them.`)
        setNewName('')
        setNewPhone('')
        setShowAddForm(false)
        loadStaff()
        setTimeout(() => setSuccessMsg(''), 10000)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setAdding(false)
    }
  }

  function handleDisableStaff(staff) {
    if (!window.confirm(`Disable ${staff.name}? They won't be able to login but data is preserved.`)) return
    disableStaff(staff.id).then(() => loadStaff()).catch(err => setError(err.message))
  }

  function handleEnableStaff(staff) {
    if (!window.confirm(`Re-enable ${staff.name}?`)) return
    enableStaff(staff.id).then(() => loadStaff()).catch(err => setError(err.message))
  }

  async function handleResetData() {
    if (!window.confirm('DELETE all service records, attendance & OT data?\n\nStaff accounts will be kept. This cannot be undone.')) return
    try {
      await resetAllData()
      window.alert('All service records, attendance & OT data deleted.')
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-zinc-600 border-t-amber-400" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="font-serif text-2xl text-zinc-100 mb-1">Settings</h1>
      <p className="text-zinc-500 text-sm mb-8">Manage staff and preferences.</p>

      {error && (
        <div className="mb-4 bg-red-950/40 border border-red-900/40 text-red-400 text-sm px-4 py-2.5 rounded-lg">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="mb-4 bg-emerald-950/40 border border-emerald-900/40 text-emerald-400 text-sm px-4 py-2.5 rounded-lg">
          {successMsg}
        </div>
      )}

      {/* Staff Management */}
      <div className="mb-8">
        <p className="text-amber-400 text-[11px] font-bold tracking-[2px] mb-4">STAFF MANAGEMENT</p>

        {/* Add Staff */}
        {showAddForm ? (
          <div className="bg-zinc-900 border border-zinc-800 border-l-4 border-l-amber-400 rounded-2xl p-5 mb-4 space-y-4">
            <p className="text-zinc-200 font-semibold">New Staff</p>
            <div className="space-y-3">
              <div>
                <label className="text-zinc-400 text-[9px] font-bold tracking-[1.5px] block mb-1">FULL NAME</label>
                <input
                  type="text"
                  placeholder="e.g. Sawan Kumar"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full bg-[#0f0e0c] border-b border-zinc-700 text-zinc-200 text-sm py-2 px-1 focus:outline-none focus:border-amber-500/60"
                />
              </div>
              <div>
                <label className="text-zinc-400 text-[9px] font-bold tracking-[1.5px] block mb-1">PHONE</label>
                <input
                  type="tel"
                  placeholder="+91 XXXXX XXXXX"
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  className="w-full bg-[#0f0e0c] border-b border-zinc-700 text-zinc-200 text-sm py-2 px-1 focus:outline-none focus:border-amber-500/60"
                />
              </div>
            </div>
            <button
              onClick={handleAddStaff}
              disabled={adding}
              className="w-full bg-amber-400 hover:bg-amber-300 disabled:bg-amber-400/50 text-[#3d2e00] font-bold text-sm py-3 rounded-xl transition-colors"
            >
              {adding ? 'Adding...' : 'Add & Generate PIN'}
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="w-full text-zinc-400 hover:text-zinc-200 text-sm font-semibold py-1 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full bg-zinc-900 border border-zinc-800 border-l-4 border-l-amber-400 rounded-2xl px-5 py-4 text-left text-zinc-200 font-semibold text-sm hover:bg-zinc-800/80 transition-colors mb-4"
          >
            + New Staff
          </button>
        )}

        {/* Active Staff List */}
        <div className="space-y-3">
          {activeStaff.map(staff => (
            <StaffCard key={staff.id} staff={staff} onDisable={() => handleDisableStaff(staff)} />
          ))}
          {activeStaff.length === 0 && (
            <p className="text-zinc-600 text-sm py-2">No active staff.</p>
          )}
        </div>

        {/* Disabled Staff Toggle */}
        {disabledStaff.length > 0 && (
          <>
            <div className="flex items-center justify-between mt-4 py-2">
              <span className="text-zinc-400 text-sm">Show disabled staff ({disabledStaff.length})</span>
              <button
                onClick={() => setShowDisabled(v => !v)}
                className={`relative w-10 h-5 rounded-full transition-colors ${showDisabled ? 'bg-amber-500/40' : 'bg-zinc-700'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform ${showDisabled ? 'translate-x-5 bg-amber-400' : 'bg-zinc-500'}`} />
              </button>
            </div>
            {showDisabled && (
              <div className="space-y-3">
                {disabledStaff.map(staff => (
                  <DisabledStaffCard key={staff.id} staff={staff} onEnable={() => handleEnableStaff(staff)} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Danger Zone */}
      <div className="mb-8">
        <p className="text-amber-400 text-[11px] font-bold tracking-[2px] mb-4">DANGER ZONE</p>
        <button
          onClick={handleResetData}
          className="w-full bg-zinc-900 border border-red-400/20 rounded-2xl px-5 py-4 text-left flex items-center justify-between hover:bg-zinc-800/80 transition-colors"
        >
          <span className="text-red-300 font-bold text-sm">Reset All Data</span>
          <span className="text-zinc-600">&rsaquo;</span>
        </button>
        <p className="text-zinc-600 text-xs mt-2 px-1">
          Deletes all services, attendance & OT records. Staff accounts are kept.
        </p>
      </div>

      {/* Account */}
      <div className="mb-8">
        <p className="text-amber-400 text-[11px] font-bold tracking-[2px] mb-4">ACCOUNT</p>
        <button
          onClick={onLogout}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-left flex items-center justify-between hover:bg-zinc-800/80 transition-colors"
        >
          <span className="text-red-300 font-bold text-sm">Logout</span>
          <span className="text-zinc-600">&rsaquo;</span>
        </button>
      </div>

      {/* About */}
      <div>
        <p className="text-amber-400 text-[11px] font-bold tracking-[2px] mb-4">ABOUT</p>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4">
          <p className="text-zinc-200 text-sm font-bold">Radiant Rue</p>
          <p className="text-zinc-500 text-xs mt-0.5">V1.0.0 &middot; Supabase Cloud</p>
        </div>
      </div>
    </div>
  )
}

function StaffCard({ staff, onDisable }) {
  const initials = staff.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
          <span className="text-sm font-bold text-amber-400">{initials}</span>
        </div>
        <div>
          <p className="text-zinc-200 text-sm font-bold">{staff.name}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-zinc-500 text-xs">PIN:</span>
            <span className="text-amber-400 text-xs font-bold tracking-[3px]">{staff.pin}</span>
          </div>
        </div>
      </div>
      <button
        onClick={onDisable}
        className="text-red-300/80 hover:text-red-400 text-xs font-semibold transition-colors"
      >
        Disable
      </button>
    </div>
  )
}

function DisabledStaffCard({ staff, onEnable }) {
  const initials = staff.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div className="bg-zinc-900 border border-zinc-800/50 rounded-2xl px-5 py-4 flex items-center justify-between opacity-60">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center opacity-40">
          <span className="text-sm font-bold text-amber-400">{initials}</span>
        </div>
        <div>
          <p className="text-zinc-200 text-sm font-bold opacity-50">{staff.name}</p>
        </div>
      </div>
      <button
        onClick={onEnable}
        className="bg-amber-400/15 text-amber-400 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-amber-400/25 transition-colors"
      >
        Enable
      </button>
    </div>
  )
}
