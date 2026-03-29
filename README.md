# Radiant Rue — Salon Management App

A mobile app that turns **WhatsApp staff chat exports** and **bank statements** into clear business reports — built for salon owners who manage staff remotely.

Staff log every service and payment via WhatsApp throughout the day. This app parses those chats, tracks revenue, attendance, and reconciles with bank statements — all from your phone.

---

## Download

- **Android:** [Google Play Store](https://play.google.com/store/apps/details?id=com.radiantrue.salon) *(under review)*
- **iOS:** Coming soon

---

## Features

- **WhatsApp chat parsing** — upload staff chat exports (.txt), auto-extracts every service, tip, cash/online payment, and attendance
- **Dashboard** — revenue KPIs, daily trends, payment split (cash vs online), top staff ranking, expense breakdown
- **Staff performance** — per-staff: services count, revenue, cash vs online, tips, average per service, attendance
- **Service log** — searchable, filterable list of every transaction
- **Bank statement import** — parse HDFC statements, auto-categorise expenses (rent, salary, products, etc.)
- **Admin & Staff views** — admin sees everything, staff sees only their own data
- **Supabase backend** — data syncs across devices, no data loss

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Mobile | React Native + Expo |
| Backend | Supabase (PostgreSQL + Auth) |
| Navigation | React Navigation v6 |
| Build | EAS Build (cloud) |
| Android | Play Store (com.radiantrue.salon) |
| iOS | App Store (coming soon) |

---

## Project Structure

```
radiant-rue/
├── mobile/                        ← Main app (Expo/React Native)
│   ├── App.js                     # Entry point
│   ├── app.json                   # Expo config
│   ├── eas.json                   # EAS Build profiles
│   ├── src/
│   │   ├── lib/
│   │   │   └── storage.js         # Supabase CRUD + data helpers
│   │   ├── navigation/
│   │   │   ├── RootNavigator.js   # Auth flow (login → admin/staff)
│   │   │   ├── AdminNavigator.js  # Admin tab navigation
│   │   │   └── StaffNavigator.js  # Staff tab navigation
│   │   └── screens/
│   │       ├── LoginScreen.js     # PIN-based login
│   │       ├── admin/
│   │       │   ├── DashboardScreen.js
│   │       │   ├── StaffScreen.js
│   │       │   ├── ServiceLogScreen.js
│   │       │   └── SettingsScreen.js
│   │       └── staff/
│   │           ├── HomeScreen.js      # Log services
│   │           ├── HistoryScreen.js   # View own records
│   │           └── ProfileScreen.js   # Attendance & profile
│   └── assets/                    # App icons, screenshots
├── web/                           ← Legacy web dashboard (not actively maintained)
├── shared/                        ← Shared parser logic
├── docs/                          # Database schema
└── CLAUDE.md                      # AI assistant instructions
```

---

## WhatsApp Message Format

Staff send payments in WhatsApp groups. The parser understands:

| Message | Parsed as |
|---------|-----------|
| `500 Paytm` | ₹500 service, online |
| `100 cash` | ₹100 service, cash |
| `50 TIP paytm` | ₹50 tip, online |
| `150 50 TIP` | ₹150 service + ₹50 tip |
| `Login` / `Logout` | Attendance marker (not revenue) |
| `Total 3646` | Skipped — daily summary, avoids double-counting |

---

## Development

```bash
# Install dependencies
cd mobile
npm install

# Start Expo dev server
npx expo start

# Build for Android (production)
npx eas build --platform android --profile production

# Build for iOS (production)
npx eas build --platform ios --profile production

# Submit to Play Store
npx eas submit --platform android --profile production

# Submit to App Store
npx eas submit --platform ios --profile production
```

---

## License

Private — not open source.
