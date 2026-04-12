import { supabase } from './supabase'

// ─── IST Timezone Helpers ──────────────────────────────────────────────────

export function getISTDate() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
}

export function getWeekStart(dateStr) {
  // Returns Tuesday of the settlement week containing dateStr
  // Settlement runs Tue-Mon (settle Monday night, includes that Monday)
  const d = new Date(dateStr + 'T12:00:00')
  const day = d.getDay() // 0=Sun, 1=Mon, 2=Tue...6=Sat
  // Days since Tuesday: Sun=5, Mon=6, Tue=0, Wed=1, Thu=2, Fri=3, Sat=4
  const diff = (day + 5) % 7
  d.setDate(d.getDate() - diff)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

// ─── Service Records ────────────────────────────────────────────────────────

export async function getServiceRecords() {
  const { data, error } = await supabase
    .from('service_records')
    .select('*')
    .order('date', { ascending: false })
    .order('time', { ascending: false })
  if (error) throw error
  return data || []
}

export async function saveServiceRecord(record) {
  const { data, error } = await supabase
    .from('service_records')
    .insert(record)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteServiceRecord(id) {
  const { error } = await supabase
    .from('service_records')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function deleteServiceRecordsByStaff(staffName) {
  const { error } = await supabase
    .from('service_records')
    .delete()
    .eq('staff_name', staffName)
  if (error) throw error
}

// Remove all service records and attendance for a given staff name
export async function deleteStaffRecords(staffName) {
  await deleteServiceRecordsByStaff(staffName)
  const { error } = await supabase
    .from('attendance')
    .delete()
    .eq('staff_name', staffName)
  if (error) throw error
}

// Bulk insert service records, skipping duplicates by id
export async function mergeServiceRecords(records) {
  if (!records.length) return 0
  const { data, error } = await supabase
    .from('service_records')
    .upsert(records, { onConflict: 'id', ignoreDuplicates: true })
    .select()
  if (error) throw error
  return data?.length || records.length
}

// ─── Staff ──────────────────────────────────────────────────────────────────

export async function getStaffList() {
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .eq('active', true)
    .order('name')
  if (error) throw error
  return data || []
}

export async function getAllStaff() {
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .order('name')
  if (error) throw error
  return data || []
}

export async function addStaff(name, phone) {
  const pin = String(Math.floor(1000 + Math.random() * 9000))
  const { data, error } = await supabase
    .from('staff')
    .insert({ name, phone, pin })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function disableStaff(id) {
  const { error } = await supabase
    .from('staff')
    .update({ active: false })
    .eq('id', id)
  if (error) throw error
}

export async function enableStaff(id) {
  const { error } = await supabase
    .from('staff')
    .update({ active: true })
    .eq('id', id)
  if (error) throw error
}

// ─── Attendance ─────────────────────────────────────────────────────────────

export async function getAttendance() {
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .order('date', { ascending: false })
  if (error) throw error
  return data || []
}

export async function mergeAttendance(records) {
  if (!records.length) return
  const { error } = await supabase
    .from('attendance')
    .upsert(records, { onConflict: 'id', ignoreDuplicates: true })
  if (error) throw error
}

// ─── Bank Transactions ──────────────────────────────────────────────────────

export async function getBankTransactions() {
  const { data, error } = await supabase
    .from('bank_transactions')
    .select('*')
    .order('date', { ascending: false })
  if (error) throw error
  return data || []
}

export async function saveBankTransactions(transactions) {
  if (!transactions.length) return
  const { error } = await supabase
    .from('bank_transactions')
    .insert(transactions)
  if (error) throw error
}

export async function deleteBankTransaction(id) {
  const { error } = await supabase
    .from('bank_transactions')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function mergeBankTransactions(transactions) {
  if (!transactions.length) return 0
  const { data, error } = await supabase
    .from('bank_transactions')
    .upsert(transactions, { onConflict: 'id', ignoreDuplicates: true })
    .select()
  if (error) throw error
  return data?.length || transactions.length
}

// ─── OT Records ─────────────────────────────────────────────────────────────

export async function getOTRecords() {
  const { data, error } = await supabase
    .from('ot_records')
    .select('*')
    .order('week_start', { ascending: false })
  if (error) throw error
  return data || []
}

export async function saveOTRecord(staffName, weekStart, amount) {
  const { data, error } = await supabase
    .from('ot_records')
    .upsert(
      { staff_name: staffName, week_start: weekStart, ot_hours: amount },
      { onConflict: 'staff_name,week_start' }
    )
    .select()
    .single()
  if (error) throw error
  return data
}

// ─── Disabled Staff ─────────────────────────────────────────────────────────

export async function getDisabledStaffList() {
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .eq('active', false)
    .order('name')
  if (error) throw error
  return data || []
}

// ─── OT Record (single) ────────────────────────────────────────────────────

export async function getOTRecord(staffName, weekStart) {
  const { data } = await supabase
    .from('ot_records')
    .select('*')
    .eq('staff_name', staffName)
    .eq('week_start', weekStart)
    .maybeSingle()
  return data
}

// ─── Batch Stats ────────────────────────────────────────────────────────────

export async function getAllStaffStatsBatch() {
  const [{ data: records }, { data: attData }] = await Promise.all([
    supabase.from('service_records').select('staff_name, amount, payment_type, entry_type'),
    supabase.from('attendance').select('staff_name, date').not('login_time', 'is', null),
  ])

  const statsMap = {}
  const ensure = name => {
    if (!statsMap[name]) statsMap[name] = { totalServices: 0, totalRevenue: 0, totalTips: 0, totalProducts: 0, totalCash: 0, totalPaytm: 0, daysWorked: 0, _days: new Set() }
  }

  for (const r of (records || [])) {
    ensure(r.staff_name)
    const s = statsMap[r.staff_name]
    const amt = Number(r.amount)
    if (r.entry_type === 'service') {
      s.totalServices++
      s.totalRevenue += amt
      if (r.payment_type === 'cash') s.totalCash += amt
      else s.totalPaytm += amt
    } else if (r.entry_type === 'tip') {
      s.totalTips += amt
    } else if (r.entry_type === 'product') {
      s.totalProducts += amt
    }
  }

  for (const a of (attData || [])) {
    ensure(a.staff_name)
    statsMap[a.staff_name]._days.add(a.date)
  }

  for (const name of Object.keys(statsMap)) {
    statsMap[name].daysWorked = statsMap[name]._days.size
    delete statsMap[name]._days
  }

  return statsMap
}

// ─── Reset All Data ─────────────────────────────────────────────────────────

export async function resetAllData() {
  const tables = ['service_records', 'attendance', 'ot_records']
  for (const table of tables) {
    const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (error) throw error
  }
}

// ─── Clear All (alias) ─────────────────────────────────────────────────────

export async function clearAllData() {
  return resetAllData()
}
