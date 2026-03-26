/**
 * Shared constants used by both web and mobile apps.
 */

export const PAYMENT_TYPES = ['paytm', 'cash']
export const ENTRY_TYPES   = ['service', 'tip']

export const EXPENSE_CATEGORIES = [
  'salary', 'rent', 'electricity', 'products',
  'food', 'owner_transfer', 'bank_charges',
  'cash_withdrawal', 'paytm', 'aws', 'other',
]

// localStorage keys (web) — mirrored as AsyncStorage keys in mobile
export const STORAGE_KEYS = {
  serviceRecords:   'rr_service_records',
  bankTransactions: 'rr_bank_transactions',
  attendance:       'rr_attendance',
}
