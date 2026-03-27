import AsyncStorage from '@react-native-async-storage/async-storage'

const KEYS = {
  serviceRecords: 'rr_service_records',
  attendance: 'rr_attendance',
  staffProfile: 'rr_staff_profile',  // { name, pin }
  role: 'rr_role',
}

// ── Service Records ─────────────────────────────────────────────────────────

export async function getServiceRecords() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.serviceRecords)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export async function saveServiceRecord(record) {
  const records = await getServiceRecords()
  records.unshift(record)
  await AsyncStorage.setItem(KEYS.serviceRecords, JSON.stringify(records))
  return records
}

export async function getRecordsForDate(date, staffName) {
  const all = await getServiceRecords()
  return all.filter(r => r.date === date && (!staffName || r.staff_name === staffName))
}

// ── Attendance ──────────────────────────────────────────────────────────────

export async function getAttendance() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.attendance)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export async function saveAttendanceEvent(event) {
  const records = await getAttendance()
  records.unshift(event)
  await AsyncStorage.setItem(KEYS.attendance, JSON.stringify(records))
  return records
}

export async function getTodayClock(staffName) {
  const today = new Date().toISOString().slice(0, 10)
  const all = await getAttendance()
  const todayEvents = all.filter(a => a.date === today && a.staff_name === staffName)
  const lastLogin = todayEvents.find(a => a.login_time)
  const lastLogout = todayEvents.find(a => a.logout_time)
  // Clocked in if there's a login with no later logout
  const isClockedIn = lastLogin && (!lastLogout || lastLogin.login_time > lastLogout.logout_time)
  return { isClockedIn, lastLogin, lastLogout }
}

// ── Staff Profile ───────────────────────────────────────────────────────────

export async function getStaffProfile() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.staffProfile)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export async function saveStaffProfile(profile) {
  await AsyncStorage.setItem(KEYS.staffProfile, JSON.stringify(profile))
}

// ── Auth / Role ─────────────────────────────────────────────────────────────

export async function getRole() {
  return AsyncStorage.getItem(KEYS.role)
}

export async function setRole(role) {
  await AsyncStorage.setItem(KEYS.role, role)
}

export async function clearRole() {
  await AsyncStorage.removeItem(KEYS.role)
}

// ── Stats ───────────────────────────────────────────────────────────────────

export async function getStaffStats(staffName) {
  const records = await getServiceRecords()
  const mine = records.filter(r => r.staff_name === staffName)
  const services = mine.filter(r => r.entry_type === 'service')
  const tips = mine.filter(r => r.entry_type === 'tip')

  const attendance = await getAttendance()
  const daysSet = new Set(
    attendance.filter(a => a.staff_name === staffName && a.login_time).map(a => a.date)
  )

  return {
    totalServices: services.length,
    totalRevenue: services.reduce((s, r) => s + r.amount, 0),
    totalTips: tips.reduce((s, r) => s + r.amount, 0),
    totalCash: services.filter(r => r.payment_type === 'cash').reduce((s, r) => s + r.amount, 0),
    totalPaytm: services.filter(r => r.payment_type === 'paytm').reduce((s, r) => s + r.amount, 0),
    daysWorked: daysSet.size,
  }
}

// ── Admin: all staff names ──────────────────────────────────────────────────

export async function getAllStaffNames() {
  const records = await getServiceRecords()
  return [...new Set(records.map(r => r.staff_name))]
}

export async function deleteStaffRecords(staffName) {
  const records = await getServiceRecords()
  await AsyncStorage.setItem(
    KEYS.serviceRecords,
    JSON.stringify(records.filter(r => r.staff_name !== staffName))
  )
  const attendance = await getAttendance()
  await AsyncStorage.setItem(
    KEYS.attendance,
    JSON.stringify(attendance.filter(a => a.staff_name !== staffName))
  )
}
