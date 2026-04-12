import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from './supabase'

// Local-only keys (session state, not synced)
const LOCAL_KEYS = {
  staffProfile: 'rr_staff_profile',
  role: 'rr_role',
}

// ── IST Timezone Helpers ────────────────────────────────────────────────────

export function getISTDate() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
}

export function getISTTime() {
  return new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false })
}

export function getWeekStart(dateStr) {
  // Returns Tuesday of the settlement week containing dateStr
  // Settlement runs Tue-Mon (settle Monday night, includes that Monday)
  const d = new Date(dateStr + 'T12:00:00') // noon to avoid UTC date shift
  const day = d.getDay() // 0=Sun, 1=Mon, 2=Tue...6=Sat
  // Days since Tuesday: Sun=5, Mon=6, Tue=0, Wed=1, Thu=2, Fri=3, Sat=4
  const diff = (day + 5) % 7
  d.setDate(d.getDate() - diff)
  return formatLocalDate(d)
}

function formatLocalDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

// ── Service Records (Supabase) ──────────────────────────────────────────────

export async function getServiceRecords() {
  const { data, error } = await supabase
    .from('service_records')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) { console.error('getServiceRecords:', error.message); return [] }
  return data || []
}

export async function saveServiceRecord(record) {
  const row = {
    staff_name: record.staff_name,
    date: record.date,
    time: record.time,
    amount: record.amount,
    payment_type: record.payment_type,
    entry_type: record.entry_type,
    source: record.source || 'mobile',
  }
  const { data, error } = await supabase
    .from('service_records')
    .insert(row)
    .select()
    .single()
  if (error) { console.error('saveServiceRecord:', error.message); return null }
  return data
}

export async function deleteServiceRecord(recordId) {
  const { error } = await supabase
    .from('service_records')
    .delete()
    .eq('id', recordId)
  if (error) { console.error('deleteServiceRecord:', error.message); return false }
  return true
}

export async function getRecordsForDate(date, staffName) {
  let q = supabase
    .from('service_records')
    .select('*')
    .eq('date', date)
    .order('created_at', { ascending: false })
  if (staffName) q = q.eq('staff_name', staffName)
  const { data, error } = await q
  if (error) { console.error('getRecordsForDate:', error.message); return [] }
  return data || []
}

export async function getRecordsForWeek(staffName, startDate, endDate) {
  const { data, error } = await supabase
    .from('service_records')
    .select('*')
    .eq('staff_name', staffName)
    .gte('date', startDate)
    .lt('date', endDate)
    .order('date')
  if (error) { console.error('getRecordsForWeek:', error.message); return [] }
  return data || []
}

// ── Attendance (Supabase) ───────────────────────────────────────────────────

export async function getAttendance() {
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) { console.error('getAttendance:', error.message); return [] }
  return data || []
}

export async function saveAttendanceEvent(event) {
  const row = {
    staff_name: event.staff_name,
    date: event.date,
    login_time: event.login_time,
    logout_time: event.logout_time,
  }
  const { data, error } = await supabase
    .from('attendance')
    .insert(row)
    .select()
    .single()
  if (error) { console.error('saveAttendanceEvent:', error.message); return null }
  return data
}

export async function getTodayClock(staffName) {
  const today = getISTDate()
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('date', today)
    .eq('staff_name', staffName)
    .order('created_at', { ascending: false })
  if (error) { console.error('getTodayClock:', error.message); return { isClockedIn: false, date: today } }

  const events = data || []
  const lastLogin = events.find(a => a.login_time)
  const lastLogout = events.find(a => a.logout_time)
  const isClockedIn = lastLogin && (!lastLogout || lastLogin.login_time > lastLogout.logout_time)
  return { isClockedIn: !!isClockedIn, lastLogin, lastLogout, date: today }
}

// ── Staff Profile (local session only) ──────────────────────────────────────

export async function getStaffProfile() {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_KEYS.staffProfile)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export async function saveStaffProfile(profile) {
  await AsyncStorage.setItem(LOCAL_KEYS.staffProfile, JSON.stringify(profile))
}

// ── Auth / Role (local session only) ────────────────────────────────────────

export async function getRole() {
  return AsyncStorage.getItem(LOCAL_KEYS.role)
}

export async function setRole(role) {
  await AsyncStorage.setItem(LOCAL_KEYS.role, role)
}

export async function clearRole() {
  await AsyncStorage.multiRemove([LOCAL_KEYS.role, LOCAL_KEYS.staffProfile])
}

// ── Staff Management (Supabase) ─────────────────────────────────────────────

export async function getStaffList() {
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .eq('active', true)
    .order('name')
  if (error) { console.error('getStaffList:', error.message); return [] }
  return data || []
}

export async function getDisabledStaffList() {
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .eq('active', false)
    .order('name')
  if (error) { console.error('getDisabledStaffList:', error.message); return [] }
  return data || []
}

export async function getAllStaff() {
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .order('name')
  if (error) { console.error('getAllStaff:', error.message); return [] }
  return data || []
}

export async function verifyPin(pin) {
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .eq('pin', pin)
    .eq('active', true)
    .single()
  if (error || !data) return null
  return data
}

export async function addStaff(name, phone) {
  let pin
  let attempts = 0
  while (attempts < 20) {
    pin = String(1000 + Math.floor(Math.random() * 8999))
    if (pin === '9999') continue
    const { data } = await supabase.from('staff').select('id').eq('pin', pin).single()
    if (!data) break
    attempts++
  }

  const { data, error } = await supabase
    .from('staff')
    .insert({ name, pin, phone: phone || null })
    .select()
    .single()
  if (error) { console.error('addStaff:', error.message); return null }
  return data
}

export async function disableStaff(staffId) {
  const { error } = await supabase
    .from('staff')
    .update({ active: false })
    .eq('id', staffId)
  if (error) { console.error('disableStaff:', error.message); return false }
  return true
}

export async function enableStaff(staffId) {
  const { error } = await supabase
    .from('staff')
    .update({ active: true })
    .eq('id', staffId)
  if (error) { console.error('enableStaff:', error.message); return false }
  return true
}

// ── OT Records (Supabase) ───────────────────────────────────────────────────

export async function getOTRecord(staffName, weekStart) {
  const { data } = await supabase
    .from('ot_records')
    .select('*')
    .eq('staff_name', staffName)
    .eq('week_start', weekStart)
    .maybeSingle()
  return data
}

export async function saveOTRecord(staffName, weekStart, otAmount) {
  const { data, error } = await supabase
    .from('ot_records')
    .upsert(
      { staff_name: staffName, week_start: weekStart, ot_hours: otAmount },
      { onConflict: 'staff_name,week_start' }
    )
    .select()
    .single()
  if (error) { console.error('saveOTRecord:', error.message); return null }
  return data
}

// ── Stats (Supabase) ────────────────────────────────────────────────────────

export async function getStaffStats(staffName) {
  const { data: records } = await supabase
    .from('service_records')
    .select('*')
    .eq('staff_name', staffName)

  const mine = records || []
  const services = mine.filter(r => r.entry_type === 'service')
  const tips = mine.filter(r => r.entry_type === 'tip')

  const { data: attData } = await supabase
    .from('attendance')
    .select('date')
    .eq('staff_name', staffName)
    .not('login_time', 'is', null)

  const daysSet = new Set((attData || []).map(a => a.date))

  return {
    totalServices: services.length,
    totalRevenue: services.reduce((s, r) => s + Number(r.amount), 0),
    totalTips: tips.reduce((s, r) => s + Number(r.amount), 0),
    totalCash: services.filter(r => r.payment_type === 'cash').reduce((s, r) => s + Number(r.amount), 0),
    totalPaytm: services.filter(r => r.payment_type !== 'cash').reduce((s, r) => s + Number(r.amount), 0),
    daysWorked: daysSet.size,
  }
}

// ── Batch Stats (single query for all staff) ───────────────────────────────

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

// ── Weekly Settlement Calculation ───────────────────────────────────────────

export async function getWeeklySettlement(staffName) {
  const today = getISTDate()
  const todayD = new Date(today + 'T00:00:00')
  const todayDay = todayD.getDay() // 0=Sun ... 6=Sat

  // Settlement resets every Tuesday:
  // Show previous week's settlement on Mon (payday), reset Tue
  // Use *previous* week if today is Mon, current week otherwise
  let weekStart
  if (todayDay === 1) {
    // Monday — show the week that just ended (last Mon-Sun)
    const d = new Date(today + 'T12:00:00')
    d.setDate(d.getDate() - 7)
    weekStart = formatLocalDate(d)
  } else {
    weekStart = getWeekStart(today)
  }

  const ws = new Date(weekStart + 'T12:00:00')
  ws.setDate(ws.getDate() + 7)
  const weekEnd = formatLocalDate(ws)

  const records = await getRecordsForWeek(staffName, weekStart, weekEnd)
  const services = records.filter(r => r.entry_type === 'service')
  const tips = records.filter(r => r.entry_type === 'tip')
  const products = records.filter(r => r.entry_type === 'product')

  // Target: 10% of daily service total if >= 3000 (products excluded)
  const dailyTotals = {}
  services.forEach(r => {
    dailyTotals[r.date] = (dailyTotals[r.date] || 0) + Number(r.amount)
  })
  let targetBonus = 0
  const dailyBreakdown = []
  for (const [date, total] of Object.entries(dailyTotals)) {
    const qualified = total >= 3000
    if (qualified) targetBonus += Math.round(total * 0.10)
    dailyBreakdown.push({ date, total, qualified, bonus: qualified ? Math.round(total * 0.10) : 0 })
  }

  const totalTips = tips.reduce((s, r) => s + Number(r.amount), 0)

  // Product bonus: flat ₹30 per product sale
  const productCount = products.length
  const productBonus = productCount * 30

  // OT — stored as amount (₹), not hours
  const ot = await getOTRecord(staffName, weekStart)
  const otAmount = ot ? Number(ot.ot_hours) : 0

  return {
    weekStart,
    weekEnd,
    payDay: weekEnd,
    targetBonus,
    dailyBreakdown,
    totalTips,
    productCount,
    productBonus,
    otAmount,
    totalPayout: targetBonus + totalTips + productBonus + otAmount,
  }
}

// ── Admin: Reset All Data ───────────────────────────────────────────────────

export async function resetAllData() {
  await supabase.from('service_records').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('attendance').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('ot_records').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  return true
}

// ── Admin: all staff names ──────────────────────────────────────────────────

export async function getAllStaffNames() {
  const { data } = await supabase
    .from('service_records')
    .select('staff_name')
  const names = (data || []).map(r => r.staff_name)
  return [...new Set(names)]
}

export async function deleteStaffRecords(staffName) {
  await supabase.from('service_records').delete().eq('staff_name', staffName)
  await supabase.from('attendance').delete().eq('staff_name', staffName)
}
