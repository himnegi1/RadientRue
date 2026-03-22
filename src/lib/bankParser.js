/**
 * HDFC bank statement CSV parser.
 *
 * HDFC CSV column order (standard export):
 *   Date | Narration | Ref No./Cheque No. | Value Dt | Withdrawal Amt | Deposit Amt | Closing Balance
 *
 * Auto-categorises transactions based on narration keywords.
 */

export function parseBankCSV(text) {
  const lines = text
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)

  if (lines.length < 2) return []

  // Find the header row (contains "Date" and "Narration" or "Description")
  const headerIdx = lines.findIndex(l => {
    const lower = l.toLowerCase()
    return lower.includes('date') && (lower.includes('narration') || lower.includes('description'))
  })

  if (headerIdx === -1) return []

  const headers = parseCSVLine(lines[headerIdx]).map(h =>
    h.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim()
  )

  const transactions = []

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.length < 4) continue

    // Map by header name, fallback to positional
    const cell = (key, pos) => {
      const idx = headers.findIndex(h => h.includes(key))
      return (idx !== -1 ? values[idx] : values[pos] ?? '').trim()
    }

    const rawDate = cell('date', 0)
    if (!rawDate || rawDate.toLowerCase() === 'date') continue

    const date = parseHDFCDate(rawDate)
    if (!date) continue

    const narration = cell('narration', 1) || cell('description', 1)
    const refNo = cell('ref', 2)
    const valueDate = parseHDFCDate(cell('value', 3))
    const debit = parseAmount(cell('withdrawal', 4))
    const credit = parseAmount(cell('deposit', 5))
    const balance = parseAmount(cell('closing', 6)) || parseAmount(cell('balance', 6))

    // Skip rows that are all zeros with no narration (blank separators)
    if (debit === 0 && credit === 0 && !narration) continue

    const cleanNarration = narration.replace(/^"|"$/g, '')
    transactions.push({
      id: txnId(date, cleanNarration, debit, credit),
      date,
      narration: cleanNarration,
      ref_no: refNo,
      value_date: valueDate,
      debit,
      credit,
      balance: balance || null,
      category: categorize(narration),
    })
  }

  return transactions
}

// ─── helpers ────────────────────────────────────────────────────────────────

function parseCSVLine(line) {
  const result = []
  let inQuotes = false
  let current = ''

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

function parseHDFCDate(str) {
  if (!str) return null
  const m = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
  if (!m) return null
  let [, d, mo, y] = m
  if (y.length === 2) y = '20' + y
  return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`
}

function parseAmount(str) {
  if (!str) return 0
  const cleaned = str.replace(/[₹,\s"']/g, '').trim()
  const n = parseFloat(cleaned)
  return isNaN(n) ? 0 : n
}

function txnId(date, narration, debit, credit) {
  const str = [date, narration.slice(0, 60), Math.round(debit * 100), Math.round(credit * 100)].join('\x01')
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ c, 2654435761)
    h2 = Math.imul(h2 ^ c, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return ((4294967296 * (2097151 & h2) + (h1 >>> 0)) >>> 0).toString(36)
}

// Known narration patterns → category label
const RULES = [
  [/paytm|paysvc/i,                        'paytm'],
  [/nalamati|rent/i,                        'rent'],
  [/azam|aazam|shabana|sawan|akram|sadiq|akaram/i, 'salary'],
  [/\bsal(ary)?\b/i,                        'salary'],
  [/bangalore el|bescom|electricity/i,      'electricity'],
  [/kalu ram|salon product/i,               'products'],
  [/amazon|swiggy|zomato|blinkit/i,         'food'],
  [/anita.*negi|negi.*anita/i,              'owner_transfer'],
  [/\batm\b|cash wdl/i,                    'cash_withdrawal'],
  [/bank charge|card fee|annual fee/i,      'bank_charges'],
  [/aws|web service/i,                      'aws'],
]

export function categorize(narration) {
  for (const [pattern, label] of RULES) {
    if (pattern.test(narration)) return label
  }
  return 'other'
}
