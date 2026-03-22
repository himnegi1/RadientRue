# Radiant Rue — Salon Dashboard

A lightweight, browser-based dashboard for **Radiant Rue** salon (Bengaluru) that turns WhatsApp staff chat exports and HDFC bank statements into actionable business insights — no server required.

---

## What it does

- **Parses WhatsApp chat exports** from staff (.txt) — extracts every service, tip, cash/Paytm payment, and attendance login/logout automatically
- **Parses HDFC bank statements** (PDF or CSV) — extracts all transactions and auto-categorises them (salary, rent, Paytm settlement, electricity, etc.)
- **Dashboard** — revenue KPIs, stacked bar chart by day, payment split donut chart, top staff ranking, expense breakdown
- **Staff page** — per-staff performance: services, revenue, cash vs Paytm, tips, avg per service, days present
- **Service Log** — filterable, sortable table of every transaction with per-row delete
- **Bank page** — full bank statement view with category filters and per-row delete
- **Import page** — upload multiple chats and monthly bank statements; re-uploading the same file never creates duplicates

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| Charts | Recharts |
| PDF parsing | pdfjs-dist (browser-side) |
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

### Importing WhatsApp chats
1. Open WhatsApp → open a staff group → ⋮ → More → Export Chat → **Without Media**
2. Go to `/import` in the app
3. Upload the `.txt` file → click **Import X records**
4. Repeat for each staff member — data merges, no duplicates

### Importing bank statements
1. Download the HDFC statement from NetBanking as **PDF** (or CSV)
2. Go to `/import` → Bank Statement section
3. Upload the file → click **Import X transactions**
4. Upload each month's statement independently — they accumulate correctly

### Deleting incorrect records
- **Service Log** → trash icon on every row
- **Bank** → trash icon on every row

---

## WhatsApp message format supported

Messages are parsed from this format:
```
[DD/MM/YY, HH:MM:SS AM/PM] ~ Staff Name: <message>
```

| Message | Parsed as |
|---------|-----------|
| `500 Paytm` | ₹500 service, Paytm |
| `100 cash` | ₹100 service, Cash |
| `50 TIP paytm` | ₹50 tip, Paytm |
| `150 50 TIP` | ₹150 service + ₹50 tip |
| `50cash 50online` | ₹50 cash + ₹50 Paytm |
| `300 image omitted` | ₹300 service (caption on Paytm screenshot) |
| `Login` / `Logout` | Attendance marker |
| `Total 3646` | Skipped (daily summary, not a transaction) |

---

## Project structure

```
src/
├── lib/
│   ├── parser.js         # WhatsApp chat parser
│   ├── pdfExtractor.js   # HDFC PDF parser (pdfjs-dist)
│   ├── bankParser.js     # HDFC CSV parser + transaction categoriser
│   ├── analytics.js      # Period filtering, stats, grouping
│   └── storage.js        # localStorage CRUD + merge/delete helpers
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

All data lives in **browser localStorage** under these keys:

| Key | Contents |
|-----|----------|
| `rr_service_records` | Parsed WhatsApp service/tip entries |
| `rr_bank_transactions` | Parsed bank transactions |
| `rr_attendance` | Staff login/logout records |

Data persists across page refreshes but is **per-browser**. To move data to another device, a backend (e.g. Supabase) would be needed.

---

## Salon details

- **Name:** Radiant Rue
- **Location:** Unit G1, Premises 25, Puttappa Layout, 1st Cross, New Thippasandra, Bengaluru 560075
- **Bank:** HDFC Bank — A/C XX8614, Kaggadaspura Branch
