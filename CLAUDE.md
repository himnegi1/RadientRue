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

## 👥 Staff (known so far)

| Name | WhatsApp Group | Notes |
|------|---------------|-------|
| Sadiq Husain | "Individual Saddiq expense" | Active since 10 Mar 2026 |
| Azam | — | Salary ₹17,000/month (paid 05 Mar) |
| Akram | — | Salary ₹2,100/month |
| Sawan / Sawan Kumar | — | Salary ₹7,233/month (two payments seen) |
| Shabana Begam | — | Advance salary ₹4,000 on 18 Feb; full salary ₹18,000 on 05 Mar |

---

## 📱 WhatsApp Message Format

Sadiq's messages follow this pattern:
```
[DD/MM/YY, HH:MM:SS AM/PM] ~ Sadiq  Husain: <amount> <payment_type> [TIP]
```

### Parsing Rules
| Message | Parsed as |
|---------|-----------|
| `500 Paytm` | ₹500, type: service, payment: paytm |
| `100 cash` | ₹100, type: service, payment: cash |
| `50 TIP paytm` | ₹50, type: tip, payment: paytm |
| `150 50 TIP` | ₹150 service + ₹50 tip (both paytm) |
| `Login` / `Logout` | Ignored (attendance marker) |

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

## 🧱 Prototype Built (Phase 1 — Single HTML file)

A single `RadiantRue_Salon_Dashboard.html` was built with:
- WhatsApp `.txt` export parser (auto-detects Sadiq's format)
- Sadiq's real data pre-loaded (Mar 11–21, 2026)
- HDFC bank statement hardcoded
- Tabs: Overview, Staff Performance, Service Log, Bank Statement, Reconciliation, Import/Add
- Charts via Chart.js (CDN)
- LocalStorage for persistence
- CSV export + Print

**File location:** `/mnt/user-data/outputs/RadiantRue_Salon_Dashboard.html`

---

## 🚀 Full Product Plan (Phase 2 — This project)

### Tech Stack Decision
| Layer | Choice | Reason |
|-------|--------|--------|
| Frontend | **React + Vite** | Fast dev, component-based |
| Styling | **Tailwind CSS** | Utility-first, rapid UI |
| Database | **Supabase** (PostgreSQL) | Free tier, real-time, auth built-in |
| Auth | **Supabase Auth** | Owner login, staff PIN entry |
| Hosting | **Netlify** (free tier) | Drag-drop deploy, free |
| PDF parsing | **pdf-parse** | For HDFC bank statement PDF |
| Charts | **Recharts** | React-native charts |
| File export | **xlsx + jsPDF** | Excel + PDF reports |

### Why Supabase over localStorage?
- Data persists across devices (salon desktop + owner's phone)
- Multiple staff can log in simultaneously
- Real-time updates
- Free tier: 500MB DB, unlimited API calls
- Can add row-level security per staff

---

## 📁 Project Structure (target)

```
radiant-rue/
├── CLAUDE.md                  ← YOU ARE HERE
├── README.md
├── package.json
├── vite.config.js
├── tailwind.config.js
├── index.html
├── public/
│   └── favicon.ico
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css
    ├── lib/
    │   ├── supabase.js          ← Supabase client
    │   ├── parser.js            ← WhatsApp chat parser
    │   └── bankParser.js        ← HDFC PDF/text parser
    ├── components/
    │   ├── Layout/
    │   │   ├── Sidebar.jsx
    │   │   └── Topbar.jsx
    │   ├── Dashboard/
    │   │   ├── Overview.jsx
    │   │   ├── MetricCard.jsx
    │   │   └── Charts.jsx
    │   ├── Staff/
    │   │   ├── StaffList.jsx
    │   │   └── StaffDetail.jsx
    │   ├── ServiceLog/
    │   │   └── ServiceLog.jsx
    │   ├── Bank/
    │   │   ├── BankStatement.jsx
    │   │   └── Reconciliation.jsx
    │   ├── Import/
    │   │   ├── WhatsAppImport.jsx
    │   │   └── ManualEntry.jsx
    │   └── Reports/
    │       └── ReportGenerator.jsx
    ├── pages/
    │   ├── Overview.jsx
    │   ├── Staff.jsx
    │   ├── ServiceLog.jsx
    │   ├── Bank.jsx
    │   ├── Reconciliation.jsx
    │   ├── Reports.jsx
    │   └── Import.jsx
    ├── hooks/
    │   ├── useRecords.js
    │   ├── useStaff.js
    │   └── useBankData.js
    └── store/
        └── useAppStore.js       ← Zustand global state
```

---

## 🗄️ Database Schema (Supabase / PostgreSQL)

```sql
-- Staff table
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  whatsapp_name TEXT,         -- name as it appears in WhatsApp exports
  phone TEXT,
  pin TEXT,                   -- 4-digit PIN for staff login
  monthly_salary NUMERIC,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Service records (from WhatsApp)
CREATE TABLE service_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staff(id),
  staff_name TEXT,            -- denormalized for easy query
  date DATE NOT NULL,
  time TIME,
  amount NUMERIC NOT NULL,
  payment_type TEXT CHECK (payment_type IN ('paytm', 'cash')),
  entry_type TEXT CHECK (entry_type IN ('service', 'tip')),
  note TEXT,
  source TEXT DEFAULT 'whatsapp',  -- 'whatsapp' | 'manual'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Attendance (Login/Logout from WhatsApp)
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staff(id),
  date DATE NOT NULL,
  login_time TIME,
  logout_time TIME,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Bank transactions (from HDFC statement)
CREATE TABLE bank_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  narration TEXT,
  ref_no TEXT,
  value_date DATE,
  debit NUMERIC DEFAULT 0,
  credit NUMERIC DEFAULT 0,
  balance NUMERIC,
  category TEXT,   -- auto-categorized: 'salary','rent','paytm','products',etc.
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Monthly expenses (manual tracking)
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  description TEXT,
  category TEXT,
  amount NUMERIC,
  paid_to TEXT,
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

- **Theme:** Dark luxury (like the prototype) — `#0f0e0c` background, `#C9A84C` gold accent
- **Fonts:** DM Serif Display (headings) + DM Sans (body)
- **Primary accent:** Gold `#C9A84C`
- **Success:** Green `#4CAF7D`
- **Danger:** Red `#E07060`
- **Info:** Blue `#6090D0`

---

## 🔜 Next Steps (in order)

1. `npm create vite@latest` — scaffold React project
2. Install dependencies (Tailwind, Supabase, Recharts, Zustand, React Router)
3. Set up Supabase project + run schema migrations
4. Port parser logic from prototype to `src/lib/parser.js`
5. Build Layout (Sidebar + Topbar)
6. Build Overview page with real Supabase data
7. Build Import page (WhatsApp upload)
8. Build Staff Performance page
9. Build Bank Statement + Reconciliation
10. Build Report Generator (PDF/Excel export)
11. Deploy to Netlify

---

## ⚠️ Important Notes for Claude Code

- Always read this file first when starting a new session
- Supabase credentials will be in `.env` (never commit)
- The WhatsApp parser is the core logic — handle edge cases carefully
- "Login" messages = attendance, not revenue
- Tips are separate from service amounts
- Bank statement Paytm settlements are T+1 or T+2 delayed vs actual service date
- Owner accesses from salon desktop browser — optimize for 1280px+ screens
- Staff should be able to log entries from mobile (responsive design needed)
