# Radiant Rue - Salon Management Platform

A complete salon management system with a **mobile app for staff** and a **web dashboard for the owner/admin**. Built for salon owners who manage staff remotely without an on-site manager.

Staff log every service and payment from their Android phones. The owner gets real-time dashboards, weekly settlement calculations, and full financial visibility from any browser.

---

## Live Links

| Platform | URL |
|----------|-----|
| **Web Dashboard** | [radientrue.netlify.app](https://radientrue.netlify.app) |
| **Android App** | [Google Play Store](https://play.google.com/store/apps/details?id=com.radiantrue.salon) |
| **iOS** | Not available (admin uses web dashboard instead) |

---

## Architecture

```
ADMIN (Owner)                           STAFF (Salon employees)
     |                                        |
 Web Dashboard                          Mobile App (Android)
 (React + Vite)                         (React Native + Expo)
 Email/password login                   4-digit PIN login
 (Supabase Auth)                        (Staff-only, no admin access)
     |                                        |
     +------------ Supabase DB ---------------+
                 (PostgreSQL + RLS)
                 Hosted on Supabase Cloud
```

- **Mobile app** = staff-only (log services, clock in/out, view own history)
- **Web dashboard** = admin-only (monitor revenue, manage staff, weekly settlements)
- Both share the same Supabase database in real-time

---

## Features

### Mobile App (Staff View)

| Feature | Description |
|---------|-------------|
| **Log Services** | Record each service with amount, payment type (cash/online), and entry type (service/tip/product) |
| **Clock In/Out** | Track attendance with login and logout timestamps |
| **Today's Summary** | View all entries logged today with running totals |
| **History** | Browse own service records grouped by date with daily stats |
| **Weekly Settlement** | See payout breakdown (target bonus, tips, product commission, overtime) |
| **PIN Login** | Secure 4-digit PIN per staff member (auto-generated) |

### Web Dashboard (Admin View)

| Feature | Description |
|---------|-------------|
| **Dashboard** | Revenue KPIs, daily trends, payment split (cash vs online), top 5 staff leaderboard |
| **Staff Performance** | Per-staff cards with revenue, tips, products, days worked, and OT input |
| **Service Log** | All transactions across all staff, filterable by type (service/tip/product) |
| **Weekly Settlement** | Calculate staff payouts with target bonus (10% on days >= 3k), tips, product commission (30/product), overtime |
| **Settings** | Add/disable/enable staff, generate PINs, reset data |
| **Email/Password Auth** | Secure admin login via Supabase Auth |

### Settlement Logic

Settlement runs on a **Tuesday-to-Monday** cycle (owner settles Monday night):

```
Total Payout = Target Bonus + Tips + Product Commission + Overtime

Where:
  Target Bonus  = 10% of daily service revenue on days >= Rs.3,000
  Tips          = Sum of all tip entries for the week
  Product Comm. = Rs.30 per product sold
  Overtime      = Admin-entered amount (Rs.)
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Mobile | React Native + Expo | Staff app (Android) |
| Web | React + Vite + Tailwind CSS | Admin dashboard |
| Backend | Supabase (PostgreSQL) | Database, auth, real-time sync |
| Auth | Supabase Auth | Email/password for admin |
| Charts | Recharts | Revenue trends, payment split |
| Build | EAS Build | Cloud builds for Android |
| Hosting | Netlify | Web dashboard deployment |
| Store | Google Play | Android distribution |

---

## Database Schema

All tables are in Supabase with Row Level Security (RLS) enabled.

```sql
-- Staff members (PIN login for mobile app)
staff (id, name, pin, phone, monthly_salary, active, created_at)

-- Service/tip/product entries logged by staff
service_records (id, staff_name, date, time, amount, payment_type, entry_type, source, created_at)
  -- payment_type: 'paytm' | 'cash' | 'online'
  -- entry_type: 'service' | 'tip' | 'product'

-- Clock in/out records
attendance (id, staff_name, date, login_time, logout_time, created_at)

-- Weekly overtime amounts (admin-entered)
ot_records (id, staff_name, week_start, ot_hours, created_at)
  -- ot_hours stores amount in Rs., not actual hours
  -- UNIQUE(staff_name, week_start)

-- Bank statement data (for reconciliation)
bank_transactions (id, date, narration, ref_no, value_date, debit, credit, balance, category, created_at)
```

---

## Project Structure

```
radiant-rue/
|
+-- mobile/                          <-- Staff mobile app (Expo / React Native)
|   +-- App.js                       # Entry point
|   +-- app.json                     # Expo config (com.radiantrue.salon)
|   +-- eas.json                     # EAS Build profiles + env vars
|   +-- src/
|       +-- lib/
|       |   +-- supabase.js          # Supabase client init
|       |   +-- storage.js           # All Supabase CRUD + business logic
|       +-- navigation/
|       |   +-- RootNavigator.js     # Auth flow (login -> staff screens)
|       |   +-- StaffNavigator.js    # Staff bottom tab navigation
|       |   +-- AdminNavigator.js    # Admin bottom tab navigation (legacy)
|       +-- screens/
|           +-- LoginScreen.js       # PIN-based login (staff only)
|           +-- staff/
|           |   +-- HomeScreen.js    # Log services, clock in/out
|           |   +-- HistoryScreen.js # View own records
|           |   +-- ProfileScreen.js # Weekly settlement view
|           +-- admin/
|               +-- DashboardScreen.js
|               +-- StaffScreen.js
|               +-- ServiceLogScreen.js
|               +-- SettingsScreen.js
|
+-- web/                             <-- Admin web dashboard (React + Vite)
|   +-- src/
|       +-- lib/
|       |   +-- supabase.js          # Supabase client init
|       |   +-- auth.js              # Supabase Auth (signIn, signUp, signOut)
|       |   +-- storage.js           # All Supabase CRUD + business logic
|       +-- components/
|       |   +-- Sidebar.jsx          # Navigation sidebar
|       +-- pages/
|           +-- Login.jsx            # Email/password login
|           +-- Dashboard.jsx        # KPIs, charts, leaderboard
|           +-- Staff.jsx            # Staff performance + OT
|           +-- ServiceLog.jsx       # All transactions
|           +-- Settlement.jsx       # Weekly payout calculator
|           +-- Settings.jsx         # Staff management, reset data
|
+-- netlify.toml                     # Netlify deploy config
+-- CLAUDE.md                        # AI assistant instructions
+-- README.md                        # This file
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI (`npm install -g eas-cli`)
- A Supabase project (free tier works)

### Environment Variables

**Mobile** (`mobile/eas.json` under `build.production.env`):
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Web** (`web/.env`):
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Netlify** (set via CLI or dashboard):
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Setup

```bash
# Clone the repo
git clone https://github.com/himnegi1/RadientRue.git
cd RadientRue

# --- Mobile App ---
cd mobile
npm install
npx expo start                    # Start dev server (scan QR with Expo Go)

# --- Web Dashboard ---
cd ../web
npm install
cp .env.example .env              # Add your Supabase credentials
npm run dev                       # Start at http://localhost:5173

# --- Supabase ---
# Run the SQL files in your Supabase SQL editor:
#   mobile/supabase-setup.sql         (creates tables + RLS + seed data)
#   mobile/supabase-migration-2.sql   (adds ot_records table)
```

### Build & Deploy

```bash
# --- Android Production Build ---
cd mobile
npx eas build --platform android --profile production

# --- Submit to Play Store ---
npx eas submit --platform android --latest

# --- Deploy Web to Netlify ---
cd ../web
npx netlify-cli deploy --prod

# --- Or auto-deploy via git push ---
git push origin master    # Netlify auto-builds from GitHub
```

---

## Design System

| Element | Value |
|---------|-------|
| Background | `#0f0e0c` (near black) |
| Cards | `zinc-900` bg, `zinc-800` border |
| Primary Accent | Gold `#C9A84C` / `amber-400` |
| Success | `emerald-400` |
| Danger | `red-400` |
| Text Primary | `zinc-100` |
| Text Secondary | `zinc-400` |
| Heading Font | DM Serif Display |
| Body Font | DM Sans |
| Theme | Dark luxury |

---

## How It Works

1. **Owner** creates staff accounts via web dashboard Settings (each staff gets a unique 4-digit PIN)
2. **Staff** download the Android app and log in with their PIN
3. **Staff** clock in at start of day, log every service/tip/product with amount and payment type
4. **Owner** monitors everything in real-time from the web dashboard on any device
5. Every **Monday night**, owner opens Settlement page and calculates each staff's weekly payout

---

## License

MIT License - see [LICENSE](LICENSE) for details.
