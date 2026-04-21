# Radiant Rue — Project TODO

> Items are added here as they come up. Pick a batch and say "do all todos" or "do todo #X".
> Status: 🔲 Pending · 🔄 In Progress · ✅ Done

---

## 🔲 Features & Enhancements

### #1 — Configurable Business Rules (Web Settings)
Make bonus/commission rules editable by admin from the Settings tab instead of hardcoded.
- Bonus threshold: default ₹3,000 (target applies only when daily services revenue ≥ this)
- Bonus rate: default 10% (of daily service revenue, tips & products excluded)
- Product commission: default ₹30 per product item
- Store in Supabase `business_config` table (single row, upsert)
- Web reads config before computing Settlement + Staff scorecard
- **Note:** Mobile app only logs services, does not compute bonuses — web-only change is fine

---

### #2 — Location-based Login/Logout (Mobile)
Staff login/logout should verify the device is physically near the salon.
- Use device GPS (`navigator.geolocation` / Expo Location)
- Define salon lat/long + allowed radius (e.g. 100m) — configurable in Settings
- On Login/Logout tap: check location first, block if outside radius, show error message
- Needs "Location" permission on Android
- Caveat: GPS indoors can be ±20–50m off, may need generous radius

---

### #3 — Salary onboarding + monthly salary in Settlement
- Add `monthly_salary` input field when adding a new staff member in Settings → New Staff form
- Settlement tab: show salary as a separate line item ("Salary — paid on 10th: ₹X/mo")
- Weekly settlement (Tue→Mon) covers: Target + Tips + Products commission + Overtime
- Monthly salary is separate, paid on 10th of each month
- Add `week_off` field per staff (paid/unpaid days off) — factor into settlement payout

---

### #4 — Mobile Responsiveness (Web)
The web dashboard does not display properly on mobile screen sizes — layout uses fixed/absolute sizing instead of responsive units.
- Audit all pages for fixed pixel widths, absolute positioning, and non-responsive layouts
- Switch to relative units (%, vw, rem) and Tailwind responsive prefixes (`sm:`, `md:`, `lg:`)
- Sidebar: collapse to bottom nav or hamburger menu on small screens
- Tables: make horizontally scrollable on mobile or switch to card view
- KPI cards, charts, and grids: stack vertically on small screens
- Test on 375px (iPhone SE) and 390px (iPhone 14) viewport widths
- **Owner note:** Primary use is 1280px+ desktop — mobile is secondary but should not break

---

### #5 — 12-Hour Time Format Everywhere
All timestamps displayed in the app (mobile) and web dashboard should use 12-hour format (e.g. 3:45 PM, not 15:45).
- Web: Service Log time column, Settlement timestamps, any other date-time display
- Mobile: Service entry timestamps, login/logout times, any time shown to staff
- Use a shared formatter utility (e.g. `formatTime(date)`) so the format is changed in one place
- Do not affect stored values — only the display layer changes

---

### #6 — Staff Advances + Monthly Settlement View
Track cash advances given to staff for daily needs or emergencies; deduct from monthly settlement.

**Advance tracking:**
- Add an "Advances" section (web, Settlement tab or dedicated sub-section)
- Record: staff name, amount, date, optional note (e.g. "emergency", "travel")
- Store in Supabase `staff_advances` table: `id, staff_id, amount, date, note, settled_at, created_at`
- Advances reset (mark as settled) on the 10th of each month, same as monthly salary payout

**Settlement tab — two views:**
- Toggle: **Weekly** (existing, Tue→Mon) | **Monthly** (new, 1st→10th payout cycle)
- Weekly view: unchanged — Target + Tips + Product commission + Overtime
- Monthly view: Salary (from `monthly_salary`) + Total advances given this month → Net payable = Salary − Advances
- Monthly view resets on the 10th; "current cycle" = last 10th → today

**Mobile app:**
- No advance entry on mobile — owner records advances from web only
- No changes needed to service logging flow

---

## ✅ Completed

- Dark/light theme with OS detection (web)
- Staff scorecard — contributed vs owner paid two-column layout
- Period filter on Staff tab (Today / This Week / This Month / All Time)
- OT input moved to Settlement tab
- Settlement layout fix — single card, no horizontal scroll
- Staff filter dropdown in Service Log
- Service Log summary strip (total entries + revenue + days)
- Settlement table: removed Revenue column, added Overtime column
- Rename "Target Bonus" → "Target" everywhere
- Admin email/password login on mobile app
- Play Store production build (versionCode 10/11)
- Netlify deploy switched to CLI (`--dir=dist`) — no build minutes used
