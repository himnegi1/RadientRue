# CLAUDE.md — Radiant Rue Salon Dashboard
> This file is the single source of truth for Claude Code (and any AI assistant) working on this project.
> Read this FIRST before touching any code.

---

## 🏠 Business Context

**Salon name:** Radiant Rue
**Location:** Unit G1, Premises 25, Puttappa Layout, Srinidhi Corner, 1st Cross, New Thippasandra, Bengaluru 560075
**Bank:** HDFC Bank — A/C XX8614, Kaggadaspura Branch (BIZ LITE PLUS)
**Paytm:** Daily NEFT settlements from Paytm Payments Services Ltd → RADIANT RUE
**Owner:** Anita Negi (ANI.NEGI1968@GMAIL.COM)

### The Problem
- No manager at the salon
- Each staff member has a separate WhatsApp group with the owner
- Staff post every service/payment as a WhatsApp message throughout the day
- Owner needs automated reports: daily totals, weekly, monthly, per-staff performance
- Bank statement (HDFC) needs to be reconciled against WhatsApp-reported Paytm collections

---

## 👥 Staff

| Name | WhatsApp Group | Salary | Notes |
|------|---------------|--------|-------|
| Azad | "C & B Azad daily work" | — | Phone: +91 6395 493 609 |
| Akram | — | ₹2,100/month | Posts Login/Logout for attendance |
| Sawan / Sawan Kumar | — | ₹7,233/month | Two salary payments seen |
| Sonu | — | — | Umer's chat references Sonu's work |
| Umer | "C& B umar daily expenses" | — | Phone: notyans848 |
| Shabana Begam | — | ₹18,000/month | Advance ₹4,000 on 18 Feb |
| Azam | — | ₹17,000/month (paid 05 Mar) | — |

---

## 📱 WhatsApp Message Format

Staff messages come in two variants — with and without `~` prefix:

```
[DD/MM/YY, HH:MM:SS AM/PM] ~ SenderName: <message>     ← older export format
[DD/MM/YY, HH:MM:SS AM/PM] SenderName: <message>       ← newer export format
```

Sender name may also be a phone number with invisible Unicode LTR/RTL marks, e.g.:
```
[01/02/26, 5:54:37 PM] ‪+91 6395 493 609‬: 100 hear cut
```

### Parsing Rules
| Message | Parsed as |
|---------|-----------|
| `500 Paytm` | ₹500, type: service, payment: paytm |
| `100 cash` / `100 c` | ₹100, type: service, payment: cash |
| `200 p` / `200 online` | ₹200, type: service, payment: paytm |
| `50 TIP paytm` | ₹50, type: tip, payment: paytm |
| `150 50 TIP` | ₹150 service + ₹50 tip (both paytm) |
| `Login` / `Logout` / `Loguot` | Attendance marker — ignored for revenue |
| `Total 1200` / `My total 1200` | Daily summary — skipped (avoid double-counting) |
| Numbers ≥ 10,00,000 | Skipped — phone numbers shared in chat (e.g., "9790702167") |

**Default payment type:** If no keyword (cash/paytm/online) is present, defaults to `paytm`.

**Key insight:** "Login" = staff clock-in. Can be used for attendance tracking.

---

## 🏦 Bank Statement Analysis (Feb 01 – Mar 05, 2026)

### Summary
- Opening Balance: ₹0 (new account, opened 03 Feb 2026)
- Total Credits: ₹1,22,778.12
- Total Debits: ₹1,17,896.60
- Closing Balance: ₹4,881.52

### Income Sources
- **Paytm NEFT settlements** (daily, from YESB/UTIB): ~₹97,768 total across ~27 days
- **Opening transfer from Anita Negi:** ₹25,000 (07 Feb)
- **Paytm UPI credit:** ₹11,010 (06 Feb) + ₹2,955 (21 Feb)

### Expense Categories (identified)
| Category | Amount |
|----------|--------|
| Rent | ₹52,000 (Anvesh Nalamati, 24 Feb) |
| Salaries | ₹35,000 Azam + ₹18,000 Shabana + ₹7,233×2 Sawan + ₹2,100 Akram + ₹4,000 advance = ~₹73,566 |
| Products | ₹2,430 (Kalu Ram — Salon Product) |
| Electricity | ₹3,509 (Bangalore EL) |
| Paytm/AWS PG | ₹2,955 |
| Office (Prints) | ₹300 + ₹700 = ₹1,000 |
| Supplies | ₹316 + ₹127 = ₹443 |
| Food/Staff | ₹50 + ₹1,000 = ₹1,050 |
| Bank Charges | ₹413 (debit card) |
| Staff Settlements | ₹405 + ₹300 + ₹330 = ₹1,035 |
| Misc | ₹1 + ₹1 + ₹30 + ₹418.60 = ₹450.60 |

---

## 🧱 Phase 1 — Prototype (complete)

A single `RadiantRue_Salon_Dashboard.html` was built with:
- WhatsApp `.txt` export parser (auto-detects Sadiq's format)
- Sadiq's real data pre-loaded (Mar 11–21, 2026)
- HDFC bank statement hardcoded
- Tabs: Overview, Staff Performance, Service Log, Bank Statement, Reconciliation, Import/Add
- Charts via Chart.js (CDN)
- LocalStorage for persistence
- CSV export + Print

---

## 🚀 Phase 2 — React App (this project, in progress)

### Tech Stack
| Layer | Choice | Status |
|-------|--------|--------|
| Frontend | React + Vite | ✅ Built |
| Styling | Tailwind CSS | ✅ Built |
| Storage | localStorage (→ Supabase later) | ✅ localStorage done |
| Charts | Recharts | ✅ Built |
| Auth | Supabase Auth | ⏳ Not yet |
| Hosting | Netlify | ⏳ Not deployed |
| PDF parsing | pdfjs-dist | ⏳ Partial |
| File export | xlsx + jsPDF | ⏳ Not yet |

### Pages Built
| Page | Route | Status |
|------|-------|--------|
| Dashboard / Overview | `/` | ✅ KPI cards, revenue trend chart, payment split donut, daily breakdown table, top staff, expenses |
| Staff Performance | `/staff` | ✅ Per-staff cards with revenue/cash/paytm/tips/avg/attendance, period filter, comparison bar chart |
| Service Log | `/service-log` | ✅ Full table, filter by date range / staff / payment type / entry type |
| Bank Statement | `/bank` | ✅ Table + category summary (needs bank data imported) |
| Import | `/import` | ✅ WhatsApp .txt upload + Bank PDF/CSV upload |

### What's NOT built yet
- Report Generator (PDF/Excel export)
- Supabase migration (currently all localStorage)
- Netlify deployment
- Staff PIN login

---

## 📁 Actual Project Structure

```
radiant-rue/
├── CLAUDE.md
├── README.md
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── index.html
├── data/                        ← sample WhatsApp exports + bank PDF (gitignored)
├── public/
│   └── sample-data.json         ← pre-parsed test data (gitignored)
└── src/
    ├── main.jsx
    ├── App.jsx                  ← React Router setup
    ├── index.css
    ├── lib/
    │   ├── parser.js            ← WhatsApp chat parser (core logic)
    │   ├── bankParser.js        ← HDFC CSV parser
    │   ├── pdfExtractor.js      ← HDFC PDF parser (pdfjs-dist)
    │   ├── analytics.js         ← filterByPeriod, computeStats, groupByDate/Staff
    │   └── storage.js           ← localStorage CRUD (keys: rr_service_records, rr_bank_transactions, rr_attendance)
    ├── components/
    │   └── Sidebar.jsx
    └── pages/
        ├── Dashboard.jsx
        ├── Staff.jsx
        ├── ServiceLog.jsx
        ├── Bank.jsx
        └── Import.jsx
```

---

## 🗄️ Database Schema (Supabase / PostgreSQL — future migration)

```sql
-- Staff table
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  whatsapp_name TEXT,
  phone TEXT,
  pin TEXT,
  monthly_salary NUMERIC,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Service records (from WhatsApp)
CREATE TABLE service_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staff(id),
  staff_name TEXT,
  date DATE NOT NULL,
  time TIME,
  amount NUMERIC NOT NULL,
  payment_type TEXT CHECK (payment_type IN ('paytm', 'cash')),
  entry_type TEXT CHECK (entry_type IN ('service', 'tip')),
  source TEXT DEFAULT 'whatsapp',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Attendance
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staff(id),
  date DATE NOT NULL,
  login_time TIME,
  logout_time TIME,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Bank transactions
CREATE TABLE bank_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  narration TEXT,
  ref_no TEXT,
  value_date DATE,
  debit NUMERIC DEFAULT 0,
  credit NUMERIC DEFAULT 0,
  balance NUMERIC,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 📊 Reports to Generate

1. **Daily Report** — Date, staff, services count, Paytm total, Cash total, Tips, Grand total
2. **Weekly Report** — Week-over-week comparison, top staff, top days
3. **Monthly Report** — Full month summary, salary deduction view, net profit estimate
4. **Staff Performance** — Per staff: revenue, services, avg per service, attendance days, tips earned
5. **Reconciliation Report** — WhatsApp Paytm reported vs Bank Paytm received, gaps flagged
6. **P&L Summary** — Revenue (bank credits) vs Expenses (salaries + rent + products) = estimated profit

---

## 🎨 Design System

- **Theme:** Dark luxury — `#0f0e0c` background, gold accent
- **Primary accent:** Gold `#C9A84C` / Tailwind `amber-400/500`
- **Success:** `emerald-400`
- **Danger:** `red-400`
- **Text:** `zinc-100` (primary) / `zinc-400` (secondary) / `zinc-500` (muted)
- **Cards:** `zinc-900` bg, `zinc-800` border
- **Fonts:** DM Serif Display (headings via `font-serif`) + DM Sans (body)

---

## 🔜 Next Steps

1. ~~Scaffold React + Vite project~~ ✅
2. ~~Install dependencies~~ ✅
3. ~~Port WhatsApp parser~~ ✅
4. ~~Build Layout + all pages~~ ✅
5. ~~Test with real data~~ ✅
6. Fix KPI card text overflow (numbers clip when ≥ 6 digits)
7. Build Report Generator (PDF/Excel export)
8. Set up Supabase + migrate from localStorage
9. Deploy to Netlify
10. Add staff PIN login

---

## ⚠️ Important Notes for Claude Code

- Always read this file first when starting a new session
- Supabase credentials will be in `.env` (never commit)
- **WhatsApp parser edge cases:**
  - Both `~` prefix and no-prefix formats exist in real data
  - Phone numbers can appear as standalone messages — already filtered (≥ 10,00,000 skipped)
  - Daily summary messages ("Total 1200", "My total 1200") are skipped to avoid double-counting
  - "Loguot" (typo) is treated same as "Logout"
  - Default payment type is `paytm` when no keyword present
- localStorage keys: `rr_service_records`, `rr_bank_transactions`, `rr_attendance`
- Bank statement Paytm settlements are T+1 or T+2 delayed vs actual service date
- Owner accesses from salon desktop browser — optimize for 1280px+ screens
- `data/` folder contains real WhatsApp exports — gitignored, never commit
