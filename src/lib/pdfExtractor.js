/**
 * HDFC bank statement PDF extractor.
 *
 * Uses PDF.js to extract positioned text items, reconstructs table rows
 * by grouping items that share the same y-coordinate, then maps amounts
 * to the correct column (Withdrawal / Deposit / Closing Balance) using
 * the x-position of each column header.
 *
 * Falls back to a balance-delta heuristic when column headers aren't found.
 */

import * as pdfjsLib from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { categorize } from './bankParser.js'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

const DATE_RE   = /^\d{1,2}\/\d{1,2}\/\d{2,4}$/
const AMOUNT_RE = /^[\d,]+\.\d{2}$/

export async function parseHDFCPDF(file) {
  const arrayBuffer = await file.arrayBuffer()

  const pdf = await pdfjsLib
    .getDocument({ data: arrayBuffer, useSystemFonts: true })
    .promise

  // ── 1. Collect all text items with x/y positions ──────────────────────
  const allItems = []

  for (let p = 1; p <= pdf.numPages; p++) {
    const page    = await pdf.getPage(p)
    const content = await page.getTextContent()

    for (const item of content.items) {
      const text = item.str.trim()
      if (!text) continue
      allItems.push({
        text,
        x:    Math.round(item.transform[4]),
        y:    Math.round(item.transform[5]),
        page: p,
      })
    }
  }

  if (allItems.length === 0) {
    throw new Error('No text found in PDF. The file may be a scanned image or password-protected.')
  }

  // ── 2. Group into visual rows (items with the same y within ±3pt) ─────
  const rows = groupIntoRows(allItems)

  // ── 3. Locate the header row → column x-positions ────────────────────
  let withdrawalX = null, depositX = null, balanceX = null

  const headerRow = rows.find(row => {
    const joined = row.map(i => i.text).join(' ').toLowerCase()
    return joined.includes('withdrawal') || joined.includes('narration')
  })

  if (headerRow) {
    for (const item of headerRow) {
      const t = item.text.toLowerCase()
      if (t.includes('withdrawal')) withdrawalX = item.x
      else if (t.includes('deposit'))              depositX   = item.x
      else if (t.includes('closing') || (t.includes('balance') && balanceX === null))
                                                   balanceX   = item.x
    }
  }

  const hasColumns = withdrawalX !== null && depositX !== null

  // ── 4. Parse each transaction row ─────────────────────────────────────
  const transactions = []
  let prevBalance = null

  for (const row of rows) {
    if (row.length === 0) continue

    // Transaction rows start with a DD/MM/YY date
    if (!DATE_RE.test(row[0].text)) continue

    const date = toISODate(row[0].text)
    if (!date) continue

    const narrationParts = []
    const amounts        = []   // { value, x }
    let   valueDate      = null
    let   isFirst        = true

    for (const item of row) {
      if (isFirst) { isFirst = false; continue } // skip the leading date

      const t = item.text
      if (AMOUNT_RE.test(t)) {
        amounts.push({ value: parseAmount(t), x: item.x })
      } else if (DATE_RE.test(t)) {
        valueDate = toISODate(t)
      } else {
        narrationParts.push(t)
      }
    }

    if (amounts.length === 0) continue

    const narration = narrationParts.join(' ').trim()
    let debit = 0, credit = 0, balance = null

    if (hasColumns) {
      // Use column header x-positions as direct thresholds (right-aligned amounts
      // always appear to the right of their column header):
      //   x < depositX               → withdrawal/debit
      //   depositX ≤ x < balanceX    → deposit/credit
      //   x ≥ balanceX               → closing balance
      for (const amt of amounts) {
        if (balanceX != null && amt.x >= balanceX)   balance = amt.value
        else if (amt.x < depositX)                    debit   = amt.value
        else                                          credit  = amt.value
      }
    } else {
      // Fallback: last amount = closing balance; use delta to infer direction
      balance = amounts[amounts.length - 1].value

      if (amounts.length >= 2) {
        const mid = amounts[amounts.length - 2].value
        if (prevBalance != null) {
          if (balance > prevBalance) credit = mid
          else                       debit  = mid
        } else if (amounts.length === 3) {
          debit  = amounts[0].value
          credit = amounts[1].value
        }
      }
    }

    prevBalance = balance

    if (debit === 0 && credit === 0 && !narration) continue

    transactions.push({
      id:         txnId(date, narration, debit, credit),
      date,
      narration,
      ref_no:     '',
      value_date: valueDate,
      debit,
      credit,
      balance,
      category:   categorize(narration),
    })
  }

  return transactions
}

// ─── helpers ────────────────────────────────────────────────────────────────

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

/** Group text items that share approximately the same y-coordinate into rows,
 *  sorted within each row by x (left→right). */
function groupIntoRows(items, tolerance = 3) {
  const sorted = [...items].sort((a, b) =>
    a.page !== b.page ? a.page - b.page : b.y - a.y
  )

  const rows = []
  let bucket = []
  let lastY  = null
  let lastP  = null

  for (const item of sorted) {
    if (lastY === null || item.page !== lastP || Math.abs(item.y - lastY) > tolerance) {
      if (bucket.length) rows.push(bucket.sort((a, b) => a.x - b.x))
      bucket = [item]
      lastY  = item.y
      lastP  = item.page
    } else {
      bucket.push(item)
    }
  }
  if (bucket.length) rows.push(bucket.sort((a, b) => a.x - b.x))

  return rows
}

function toISODate(str) {
  const m = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
  if (!m) return null
  let [, d, mo, y] = m
  if (y.length === 2) y = '20' + y
  return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`
}

function parseAmount(str) {
  const n = parseFloat(str.replace(/,/g, ''))
  return isNaN(n) ? 0 : n
}
