# Radiant Rue — Salon Management App

A mobile app for salon staff and owners to log services, track revenue, and monitor performance — built for salon owners who manage staff remotely.

Staff log every service and payment directly in the app. The owner (admin) gets real-time dashboards with revenue, attendance, and per-staff performance — all from their phone.

---

## Download

- **Android:** [Google Play Store](https://play.google.com/store/apps/details?id=com.radiantrue.salon) *(under review)*
- **iOS:** Coming soon

---

## Features

### Staff View
- **Log services** — tap to record each service with amount, payment type (cash/online), and tips
- **Attendance** — clock in/out with login and logout
- **History** — view own service records and earnings
- **Profile** — view attendance and personal stats

### Admin View
- **Dashboard** — revenue KPIs, daily trends, payment split (cash vs online), top staff ranking
- **Staff management** — add/remove staff, view per-staff performance
- **Service log** — searchable, filterable list of all transactions across staff
- **Settings** — manage staff PINs, app configuration

### General
- **PIN-based login** — staff and admin authenticate with a PIN
- **Supabase backend** — data syncs across devices, no data loss
- **Dark theme** — gold accent luxury design

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
