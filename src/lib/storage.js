const KEYS = {
  serviceRecords: 'rr_service_records',
  bankTransactions: 'rr_bank_transactions',
  attendance: 'rr_attendance',
}

export function getServiceRecords() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.serviceRecords) || '[]')
  } catch {
    return []
  }
}

export function saveServiceRecords(records) {
  localStorage.setItem(KEYS.serviceRecords, JSON.stringify(records))
}

// Merge new records into existing, deduplicating by id (ids are deterministic — safe to re-import)
export function mergeServiceRecords(newRecords) {
  const existing = getServiceRecords()
  const ids = new Set(existing.map(r => r.id))
  const merged = [...existing, ...newRecords.filter(r => !ids.has(r.id))]
  saveServiceRecords(merged)
  return merged.length
}

export function deleteServiceRecord(id) {
  saveServiceRecords(getServiceRecords().filter(r => r.id !== id))
}

// Remove all service records and attendance for a given staff name
export function deleteStaffRecords(staffName) {
  saveServiceRecords(getServiceRecords().filter(r => r.staff_name !== staffName))
  saveAttendance(getAttendance().filter(r => r.staff_name !== staffName))
}

export function getBankTransactions() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.bankTransactions) || '[]')
  } catch {
    return []
  }
}

export function saveBankTransactions(transactions) {
  localStorage.setItem(KEYS.bankTransactions, JSON.stringify(transactions))
}

// Merge bank transactions, deduplicating by id — supports uploading monthly statements incrementally
export function mergeBankTransactions(newTxns) {
  const existing = getBankTransactions()
  const ids = new Set(existing.map(t => t.id))
  const merged = [...existing, ...newTxns.filter(t => !ids.has(t.id))]
  saveBankTransactions(merged)
  return merged.length
}

export function deleteBankTransaction(id) {
  saveBankTransactions(getBankTransactions().filter(t => t.id !== id))
}

export function getAttendance() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.attendance) || '[]')
  } catch {
    return []
  }
}

export function saveAttendance(records) {
  localStorage.setItem(KEYS.attendance, JSON.stringify(records))
}

export function mergeAttendance(newRecords) {
  const existing = getAttendance()
  const ids = new Set(existing.map(r => r.id))
  const merged = [...existing, ...newRecords.filter(r => !ids.has(r.id))]
  saveAttendance(merged)
}

export function clearAll() {
  Object.values(KEYS).forEach(k => localStorage.removeItem(k))
}
