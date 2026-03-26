import {
  startOfWeek, endOfWeek, startOfMonth, endOfMonth, format,
} from 'date-fns'

export function filterByPeriod(records, period) {
  if (period === 'all') return records
  const { from, to } = dateRange(period)
  return records.filter(r => r.date >= from && r.date <= to)
}

export function computeStats(records) {
  const services = records.filter(r => r.entry_type === 'service')
  const tips      = records.filter(r => r.entry_type === 'tip')
  const cash      = services.filter(r => r.payment_type === 'cash').reduce((s, r) => s + r.amount, 0)
  const paytm     = services.filter(r => r.payment_type === 'paytm').reduce((s, r) => s + r.amount, 0)
  const tipTotal  = tips.reduce((s, r) => s + r.amount, 0)
  return {
    serviceCount: services.length,
    cash,
    paytm,
    tips: tipTotal,
    total: cash + paytm,
    avgPerService: services.length ? (cash + paytm) / services.length : 0,
  }
}

export function groupByDate(records) {
  const map = {}
  for (const r of records) {
    if (!map[r.date]) map[r.date] = { date: r.date, cash: 0, paytm: 0, tips: 0 }
    if (r.entry_type === 'tip')           map[r.date].tips  += r.amount
    else if (r.payment_type === 'cash')   map[r.date].cash  += r.amount
    else                                   map[r.date].paytm += r.amount
  }
  return Object.values(map).sort((a, b) => a.date.localeCompare(b.date))
}

export function groupByStaff(records) {
  const map = {}
  for (const r of records) {
    const n = r.staff_name
    if (!map[n]) map[n] = { name: n, services: 0, cash: 0, paytm: 0, tips: 0, total: 0 }
    if (r.entry_type === 'tip') {
      map[n].tips += r.amount
    } else {
      map[n].services++
      map[n].total += r.amount
      if (r.payment_type === 'cash') map[n].cash  += r.amount
      else                            map[n].paytm += r.amount
    }
  }
  return Object.values(map)
    .map(s => ({ ...s, avg: s.services ? s.total / s.services : 0 }))
    .sort((a, b) => b.total - a.total)
}

export function getExpensesByCategory(bankTxns, period) {
  const txns = period === 'all' ? bankTxns : (() => {
    const { from, to } = dateRange(period)
    return bankTxns.filter(t => t.date >= from && t.date <= to)
  })()

  const map = {}
  for (const t of txns) {
    if (t.debit <= 0) continue
    if (!map[t.category]) map[t.category] = 0
    map[t.category] += t.debit
  }
  return Object.entries(map)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
}

export function periodLabel(period) {
  const now = new Date()
  if (period === 'today') return format(now, 'd MMM yyyy')
  if (period === 'week') {
    const s = startOfWeek(now, { weekStartsOn: 1 })
    const e = endOfWeek(now, { weekStartsOn: 1 })
    return `${format(s, 'd MMM')} – ${format(e, 'd MMM yyyy')}`
  }
  if (period === 'month') return format(now, 'MMMM yyyy')
  return 'All Time'
}

function dateRange(period) {
  const now = new Date()
  const today = format(now, 'yyyy-MM-dd')
  if (period === 'today') return { from: today, to: today }
  if (period === 'week') return {
    from: format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    to:   format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
  }
  if (period === 'month') return {
    from: format(startOfMonth(now), 'yyyy-MM-dd'),
    to:   format(endOfMonth(now), 'yyyy-MM-dd'),
  }
  return { from: '', to: '' }
}
