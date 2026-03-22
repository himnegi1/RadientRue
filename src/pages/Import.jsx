import { useState, useRef } from 'react'
import { Upload, Check, Trash2, Loader2 } from 'lucide-react'
import { parseWhatsAppChat } from '../lib/parser.js'
import { parseBankCSV } from '../lib/bankParser.js'
import { parseHDFCPDF } from '../lib/pdfExtractor.js'
import {
  mergeServiceRecords,
  mergeAttendance,
  mergeBankTransactions,
  clearAll,
} from '../lib/storage.js'

export default function Import() {
  const [wa, setWa] = useState({ file: null, parsed: null, saved: false, error: null })
  const [bank, setBank] = useState({ file: null, parsed: null, saved: false, error: null, loading: false })
  const waRef = useRef()
  const bankRef = useRef()

  function handleWAFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setWa({ file, parsed: null, saved: false, error: null })
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const result = parseWhatsAppChat(ev.target.result)
        setWa(s => ({ ...s, parsed: result }))
      } catch (err) {
        setWa(s => ({ ...s, error: err.message }))
      }
    }
    reader.readAsText(file, 'utf-8')
  }

  async function handleBankFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setBank({ file, parsed: null, saved: false, error: null, loading: false })

    const isPDF = file.name.toLowerCase().endsWith('.pdf')

    if (isPDF) {
      setBank(s => ({ ...s, loading: true }))
      try {
        const result = await parseHDFCPDF(file)
        setBank(s => ({ ...s, parsed: result, loading: false }))
      } catch (err) {
        setBank(s => ({ ...s, error: err.message, loading: false }))
      }
    } else {
      const reader = new FileReader()
      reader.onload = ev => {
        try {
          const result = parseBankCSV(ev.target.result)
          setBank(s => ({ ...s, parsed: result }))
        } catch (err) {
          setBank(s => ({ ...s, error: err.message }))
        }
      }
      reader.readAsText(file, 'utf-8')
    }
  }

  function importWA() {
    if (!wa.parsed) return
    mergeServiceRecords(wa.parsed.records)
    mergeAttendance(wa.parsed.attendance)
    setWa(s => ({ ...s, saved: true }))
  }

  function importBank() {
    if (!bank.parsed) return
    mergeBankTransactions(bank.parsed)
    setBank(s => ({ ...s, saved: true }))
  }

  function handleClearAll() {
    if (window.confirm('This will delete all imported data from this device. Continue?')) {
      clearAll()
      setWa({ file: null, parsed: null, saved: false, error: null })
      setBank({ file: null, parsed: null, saved: false, error: null })
    }
  }

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="font-serif text-2xl text-zinc-100 mb-1">Import Data</h1>
      <p className="text-zinc-500 text-sm mb-8">
        Upload WhatsApp chat export (.txt) and HDFC bank statement (PDF or CSV).
      </p>

      <div className="space-y-5">
        {/* ── WhatsApp ── */}
        <Section title="WhatsApp Chat Export" hint="WhatsApp → ⋮ → More → Export Chat → Without Media → upload the .txt file">
          <DropZone
            label={wa.file ? wa.file.name : 'Click to select .txt file'}
            hasFile={!!wa.file}
            onClick={() => { waRef.current.value = ''; waRef.current.click() }}
          />
          <input ref={waRef} type="file" accept=".txt" className="hidden" onChange={handleWAFile} />

          {wa.error && <p className="mt-3 text-red-400 text-sm">{wa.error}</p>}

          {wa.parsed && (
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <Stat label="Service entries" value={wa.parsed.records.filter(r => r.entry_type === 'service').length} />
                <Stat label="Tips" value={wa.parsed.records.filter(r => r.entry_type === 'tip').length} />
                <Stat label="Attendance rows" value={wa.parsed.attendance.length} />
              </div>

              <PreviewTable
                headers={['Date', 'Staff', 'Amount', 'Payment', 'Type']}
                rows={wa.parsed.records.slice(0, 6).map(r => [
                  r.date, r.staff_name, `₹${r.amount}`, r.payment_type, r.entry_type,
                ])}
                total={wa.parsed.records.length}
              />

              {wa.saved ? (
                <SavedBadge count={wa.parsed.records.length} unit="records" />
              ) : (
                <ImportButton onClick={importWA} count={wa.parsed.records.length} unit="records" />
              )}
            </div>
          )}
        </Section>

        {/* ── Bank Statement ── */}
        <Section title="Bank Statement — HDFC" hint="Accepts PDF (downloaded from HDFC NetBanking) or CSV export. PDF is parsed automatically.">
          <DropZone
            label={bank.file ? bank.file.name : 'Click to select PDF or CSV file'}
            hasFile={!!bank.file}
            loading={bank.loading}
            onClick={() => { bankRef.current.value = ''; bankRef.current.click() }}
          />
          <input ref={bankRef} type="file" accept=".pdf,.csv,.txt" className="hidden" onChange={handleBankFile} />

          {bank.error && <p className="mt-3 text-red-400 text-sm">{bank.error}</p>}

          {bank.parsed && (
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <Stat label="Transactions" value={bank.parsed.length} />
                <Stat
                  label="Total credits"
                  value={`₹${bank.parsed.reduce((s, t) => s + t.credit, 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                />
                <Stat
                  label="Total debits"
                  value={`₹${bank.parsed.reduce((s, t) => s + t.debit, 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                />
              </div>

              <PreviewTable
                headers={['Date', 'Narration', 'Debit', 'Credit', 'Category']}
                rows={bank.parsed.slice(0, 6).map(t => [
                  t.date,
                  t.narration.length > 35 ? t.narration.slice(0, 35) + '…' : t.narration,
                  t.debit > 0 ? `₹${t.debit.toLocaleString('en-IN')}` : '—',
                  t.credit > 0 ? `₹${t.credit.toLocaleString('en-IN')}` : '—',
                  t.category,
                ])}
                total={bank.parsed.length}
              />

              {bank.saved ? (
                <SavedBadge count={bank.parsed.length} unit="transactions" />
              ) : (
                <ImportButton onClick={importBank} count={bank.parsed.length} unit="transactions" />
              )}
            </div>
          )}
        </Section>

        {/* ── Clear all ── */}
        <Section title="Clear All Data" hint="Removes all imported data stored in this browser.">
          <button
            onClick={handleClearAll}
            className="flex items-center gap-2 bg-red-950/40 hover:bg-red-950/70 border border-red-900/40 text-red-400 text-sm px-4 py-2 rounded-md transition-colors"
          >
            <Trash2 size={14} />
            Clear Everything
          </button>
        </Section>
      </div>
    </div>
  )
}

// ─── sub-components ──────────────────────────────────────────────────────────

function Section({ title, hint, children }) {
  return (
    <section className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
      <h2 className="text-zinc-200 font-medium mb-0.5">{title}</h2>
      <p className="text-zinc-500 text-xs mb-4">{hint}</p>
      {children}
    </section>
  )
}

function DropZone({ label, hasFile, loading, onClick }) {
  return (
    <div
      onClick={loading ? undefined : onClick}
      className={`border-2 border-dashed rounded-lg px-6 py-5 text-center transition-colors
        ${loading ? 'border-zinc-700 cursor-wait' : 'cursor-pointer'}
        ${hasFile && !loading ? 'border-zinc-600 bg-zinc-800/30' : 'border-zinc-700 hover:border-zinc-500'}`}
    >
      {loading ? (
        <>
          <Loader2 className="mx-auto text-zinc-500 mb-2 animate-spin" size={22} />
          <p className="text-sm text-zinc-500">Parsing PDF…</p>
        </>
      ) : (
        <>
          <Upload className="mx-auto text-zinc-600 mb-2" size={22} />
          <p className={`text-sm ${hasFile ? 'text-zinc-300' : 'text-zinc-500'}`}>{label}</p>
        </>
      )}
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="bg-zinc-800/50 rounded-md px-3 py-2">
      <div className="text-zinc-500 text-xs mb-0.5">{label}</div>
      <div className="text-zinc-100 font-medium">{value}</div>
    </div>
  )
}

function PreviewTable({ headers, rows, total }) {
  return (
    <div className="border border-zinc-800 rounded-md overflow-hidden">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-zinc-800/60 text-zinc-400">
            {headers.map(h => (
              <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {rows.map((row, i) => (
            <tr key={i} className="text-zinc-300">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-1.5">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {total > rows.length && (
        <div className="px-3 py-1.5 text-zinc-500 text-xs border-t border-zinc-800">
          +{total - rows.length} more
        </div>
      )}
    </div>
  )
}

function ImportButton({ onClick, count, unit }) {
  return (
    <button
      onClick={onClick}
      className="bg-zinc-700 hover:bg-zinc-600 text-zinc-100 text-sm px-4 py-2 rounded-md transition-colors"
    >
      Import {count} {unit}
    </button>
  )
}

function SavedBadge({ count, unit }) {
  return (
    <div className="flex items-center gap-2 text-green-400 text-sm">
      <Check size={15} />
      {count} {unit} imported
    </div>
  )
}
