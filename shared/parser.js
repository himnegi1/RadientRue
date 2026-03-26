/**
 * WhatsApp chat export parser.
 *
 * Handles format: [DD/MM/YY, HH:MM:SS AM/PM] ~ SenderName: message
 *
 * Parsing rules:
 *   "500 Paytm"    → service ₹500, payment: paytm
 *   "100 cash"     → service ₹100, payment: cash
 *   "50 TIP paytm" → tip ₹50, payment: paytm
 *   "150 50 TIP"   → service ₹150 + tip ₹50 (both paytm)
 *   "Login"        → attendance login
 *   "Logout"       → attendance logout
 */

// Matches: [DD/MM/YY, H:MM:SS AM] ~ Sender: body
const MESSAGE_RE = /^\[(\d{1,2}\/\d{1,2}\/\d{2,4}),\s*(\d{1,2}:\d{2}:\d{2}\s*[APap][Mm])\]\s*~?\s*([^:]+?):\s*([\s\S]*)$/

// Unicode directional / BOM marks WhatsApp embeds in exported files
const UNICODE_MARKS = /[\u200e\u200f\u202a-\u202e\ufeff]/g

export function parseWhatsAppChat(text) {
  const records = []
  const attendance = []

  const messages = groupMessages(text.split('\n'))

  // Identify the primary sender — the staff member who owns this chat.
  // We pick the sender with the most messages, ignoring system-like senders
  // (group names, phone numbers that are clearly owner/admin with few messages).
  const primarySender = detectPrimarySender(messages)

  for (const msg of messages) {
    // Only process messages from the primary sender
    if (msg.sender !== primarySender) continue

    const result = parseBody(msg.body)
    if (!result) continue

    const date = toISODate(msg.date)
    const time = to24h(msg.time)

    if (result.type === 'login') {
      attendance.push({ id: recordId(msg.sender, date, 'login', time), staff_name: msg.sender, date, login_time: time, logout_time: null })
      continue
    }
    if (result.type === 'logout') {
      attendance.push({ id: recordId(msg.sender, date, 'logout', time), staff_name: msg.sender, date, login_time: null, logout_time: time })
      continue
    }

    for (const entry of result.entries) {
      records.push({
        id: recordId(msg.sender, date, time, entry.amount, entry.payment_type, entry.entry_type),
        staff_name: msg.sender,
        date,
        time,
        amount: entry.amount,
        payment_type: entry.payment_type,
        entry_type: entry.entry_type,
        source: 'whatsapp',
      })
    }
  }

  return { records, attendance, staffName: primarySender }
}

// ─── helpers ────────────────────────────────────────────────────────────────

// Returns the name of the staff member who "owns" this chat export.
// Strategy: count messages per sender; the one with the most is the staff member.
// System messages (group name == sender) are already excluded by groupMessages.
function detectPrimarySender(messages) {
  const counts = {}
  for (const msg of messages) {
    counts[msg.sender] = (counts[msg.sender] || 0) + 1
  }
  // Pick the sender with the highest message count
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? ''
}

function groupMessages(lines) {
  const messages = []
  let current = null

  for (const line of lines) {
    // Strip invisible Unicode marks WhatsApp adds (LTR mark, BOM, etc.)
    const clean = line.replace(UNICODE_MARKS, '')
    const m = clean.match(MESSAGE_RE)
    if (m) {
      if (current) messages.push(current)
      current = {
        date:   m[1].trim(),
        time:   m[2].trim(),
        sender: m[3].trim(),
        body:   m[4].replace(UNICODE_MARKS, '').trim(),
      }
    } else if (current) {
      const trimmed = clean.trim()
      if (trimmed) current.body += ' ' + trimmed
    }
  }
  if (current) messages.push(current)
  return messages
}

function parseBody(body) {
  // Strip Unicode marks that may be embedded in message bodies
  const raw = body.replace(UNICODE_MARKS, '').trim()

  // Skip empties and known non-data messages
  if (!raw) return null
  if (raw === '<Media omitted>') return null
  if (raw.startsWith('Messages and calls are')) return null
  if (raw.startsWith('This message was deleted')) return null
  if (/^missed (voice|video) call/i.test(raw)) return null
  if (/^@/.test(raw)) return null  // @mention-only messages
  // Daily summary messages Akram posts ("Total 3646", "Total 6600") — skip to avoid double-counting
  if (/^total\s+[\d,]+/i.test(raw)) return null

  // Strip embedded media markers — Akram sends amount as caption alongside image
  // e.g. "300 ‎image omitted" → "300". If nothing is left after stripping, skip.
  const stripped = raw
    .replace(/\b(?:\d+\s+)?(?:page\s+)?(?:image|video|audio|sticker|document)\s+omitted\b/gi, '')
    .trim()
  if (!stripped) return null

  // Normalise: strip trailing punctuation, split number+word ("50cash" → "50 cash"), replace "/" with space
  const text = stripped
    .replace(/[.,،。]+$/, '')
    .replace(/(\d)(cash|paytm|online)/gi, '$1 $2')  // "50cash" → "50 cash", "50online" → "50 online"
    .replace(/\//g, ' ')
    .trim()

  // Attendance markers
  if (/^login$/i.test(text)) return { type: 'login' }
  if (/^logout$/i.test(text)) return { type: 'logout' }

  // Transaction: scan tokens, building (amount, payment_type) pairs.
  // Each number is paired with the payment keyword that immediately follows it.
  // Handles: "500 Paytm", "100 cash", "50cash 50online", "150 50 TIP", "50 TIP paytm"
  const tokens = text.toUpperCase().split(/\s+/)
  const pairs  = []   // { amount, payment_type: 'cash'|'paytm'|null }
  let pending  = null // amount waiting for its payment keyword
  let lastPay  = 'paytm' // default payment type
  let hasTip   = false

  for (const token of tokens) {
    if (/^\d+(\.\d+)?$/.test(token)) {
      const num = parseFloat(token)
      // Skip numbers with 7+ digits — likely phone numbers or IDs, not service amounts
      if (num >= 1000000) continue
      if (pending !== null) pairs.push({ amount: pending, payment_type: null })
      pending = num
    } else if (token === 'CASH') {
      lastPay = 'cash'
      if (pending !== null) { pairs.push({ amount: pending, payment_type: 'cash' }); pending = null }
    } else if (token === 'PAYTM' || token === 'ONLINE') {
      lastPay = 'paytm'
      if (pending !== null) { pairs.push({ amount: pending, payment_type: 'paytm' }); pending = null }
    } else if (token === 'TIP' || token === 'TP') {
      hasTip = true
    }
  }
  if (pending !== null) pairs.push({ amount: pending, payment_type: null })

  // Resolve unspecified payment types using lastPay
  for (const p of pairs) { if (p.payment_type === null) p.payment_type = lastPay }

  if (pairs.length === 0) return null

  const entries = []

  if (hasTip) {
    // e.g. "150 50 TIP" → service 150 + tip 50 | "50 TIP paytm" → tip 50
    entries.push({ entry_type: pairs.length >= 2 ? 'service' : 'tip', amount: pairs[0].amount, payment_type: pairs[0].payment_type })
    if (pairs.length >= 2) entries.push({ entry_type: 'tip', amount: pairs[1].amount, payment_type: pairs[1].payment_type })
  } else {
    // e.g. "500 Paytm", "100 cash", "50cash 50online" → one or more service entries
    for (const p of pairs) entries.push({ entry_type: 'service', amount: p.amount, payment_type: p.payment_type })
  }

  return { type: 'transaction', entries }
}

function toISODate(str) {
  // DD/MM/YY or DD/MM/YYYY → YYYY-MM-DD
  const parts = str.split('/')
  if (parts.length !== 3) return str
  let [d, m, y] = parts
  if (y.length === 2) y = '20' + y
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
}

function to24h(str) {
  // "3:45:22 PM" → "15:45:22"
  const m = str.match(/(\d{1,2}):(\d{2}):(\d{2})\s*([APap][Mm])/)
  if (!m) return str
  let h = parseInt(m[1])
  const min = m[2], sec = m[3]
  const period = m[4].toUpperCase()
  if (period === 'PM' && h !== 12) h += 12
  if (period === 'AM' && h === 12) h = 0
  return `${String(h).padStart(2, '0')}:${min}:${sec}`
}

// Deterministic ID from content — re-importing the same chat never creates duplicates
function recordId(...parts) {
  const str = parts.join('\x01')
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
