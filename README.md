# BizReport — WhatsApp & Bank Statement Dashboard

A lightweight, browser-based dashboard that turns **WhatsApp staff chat exports** and **bank statements** into clear business reports — no server, no sign-up required.

Upload your files, get instant insights. Everything runs in the browser and is stored locally on your device.

---

## What it does

- **Parses WhatsApp chat exports** (.txt) — extracts every service entry, tip, cash/online payment, and staff attendance automatically
- **Parses bank statements** (PDF or CSV) — extracts all transactions and auto-categorises them (salary, rent, online payments, electricity, etc.)
- **Dashboard** — revenue KPIs, daily bar chart, payment split chart, top staff ranking, expense breakdown
- **Staff page** — per-staff performance: services count, revenue, cash vs online, tips, average per service, days present
- **Service Log** — filterable, sortable table of every transaction with per-row delete
- **Bank page** — full statement view with category filters and per-row delete
- **Import page** — re-upload the same file anytime, duplicates are automatically skipped

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| Charts | Recharts |
| PDF parsing | pdfjs-dist (runs in browser) |
| Routing | React Router v6 |
| Icons | lucide-react |
| Storage | Browser localStorage (no backend) |

---

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev
# → http://localhost:5173

# 3. Build for production
npm run build
```

---

## How to use

### Import WhatsApp chats
1. Open WhatsApp → open a staff group → ⋮ → More → Export Chat → **Without Media**
2. Go to `/import` in the app
3. Upload the `.txt` file → click **Import X records**
4. Repeat for each staff member — data merges, no duplicates

### Import bank statements
1. Download your bank statement as **PDF** or **CSV**
2. Go to `/import` → Bank Statement section
3. Upload → click **Import X transactions**
4. Upload each month separately — they accumulate without duplicates

### Delete incorrect records
- **Service Log** → trash icon on any row
- **Bank** → trash icon on any row

---

## WhatsApp message format supported

```
[DD/MM/YY, HH:MM:SS AM/PM] ~ Staff Name: <message>
```

| Message | Parsed as |
|---------|-----------|
| `500 Paytm` | ₹500 service, online |
| `100 cash` | ₹100 service, cash |
| `50 TIP paytm` | ₹50 tip, online |
| `150 50 TIP` | ₹150 service + ₹50 tip |
| `50cash 50online` | ₹50 cash + ₹50 online |
| `300 image omitted` | ₹300 service (amount captioned on image) |
| `Login` / `Logout` | Attendance marker — not counted as revenue |
| `Total 3646` | Skipped — daily summary, not a transaction |

---

## Project structure

```
src/
├── lib/
│   ├── parser.js         # WhatsApp chat parser
│   ├── pdfExtractor.js   # Bank statement PDF parser (pdfjs-dist)
│   ├── bankParser.js     # Bank statement CSV parser + auto-categoriser
│   ├── analytics.js      # Period filtering, stats, grouping helpers
│   └── storage.js        # localStorage CRUD + merge/delete
├── pages/
│   ├── Dashboard.jsx     # Overview with charts and KPIs
│   ├── Staff.jsx         # Per-staff performance
│   ├── ServiceLog.jsx    # Full transaction log
│   ├── Bank.jsx          # Bank statement view
│   └── Import.jsx        # File upload and import
└── components/
    └── Sidebar.jsx       # Navigation
```

---

## Data storage

All data is stored in **browser localStorage**:

| Key | Contents |
|-----|----------|
| `rr_service_records` | WhatsApp service and tip entries |
| `rr_bank_transactions` | Bank transactions |
| `rr_attendance` | Staff login/logout records |

Data persists across refreshes but is **per-browser**. Clearing browser data will remove it. For multi-device access, a backend database (e.g. Supabase) can be added.
