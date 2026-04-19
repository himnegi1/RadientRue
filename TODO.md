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
