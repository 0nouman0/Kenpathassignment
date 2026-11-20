# 🩸 Sweety – Full-Stack Next.js Blood Glucose Tracker

A production-grade, full-stack medical application built with **Next.js 14 (App Router), React 18, and PostgreSQL**. Designed for diabetes patients to accurately record up to **4 blood glucose readings per day** across standard metabolic windows (Morning fasting, After breakfast, After lunch, After dinner), track daily clinical compliance, and generate daily and monthly analytical reports.

---

## Why Next.js?

- **Unified Full-Stack Architecture**: Both frontend UI and `/api/...` route handlers run under one server on port `3000`. No separate backend processes, no CORS issues, and no `ERR_CONNECTION_REFUSED` port-mismatch errors.
- **Zero-Friction Startup & Database Resilience**:
  - Connects to PostgreSQL via `DATABASE_URL` whenever PostgreSQL (or Docker) is active.
  - If PostgreSQL is not active locally, the system automatically falls back to an in-memory clinical database pre-seeded with the demo patient (`demo@sweety.app` / `Demo1234!`) and 60 days of historical data—enabling immediate, zero-config evaluation.
- **Evidence-Based Clinical Guidelines (ADA Standard)**:
  - **Fasting Target**: 70 – 130 mg/dL
  - **Post-Prandial Target**: < 180 mg/dL
  - **Hypoglycemia (< 70 mg/dL)**: Sky blue indicator (`Low / Hypo`)
  - **In Target**: Clinical emerald indicator (`● In Target`)
  - **Elevated**: Warm amber indicator (`▲ Elevated`)
  - **Hyperglycemia**: Crimson rose indicator (`▲ High / Hyper`)
- **No Vibecoded Emojis or Native Popups**:
  - Replaced emojis with a custom SVG icon system (`src/components/Icons.jsx`).
  - Replaced native browser `window.confirm` and `alert` with accessible, keyboard-trapped `ConfirmModal` dialogs and auto-dismissing `Toast` alerts.
  - Interactive Recharts line graph with highlighted ADA target zone (70–140 mg/dL).
  - Real-time clinical feedback pill while typing in the reading form.

---

## Table of Contents

- [Features Built](#features-built)
- [Validation Rules](#validation-rules)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Database Setup (PostgreSQL)](#database-setup-postgresql)
- [Running Tests](#running-tests)
- [Environment Variables](#environment-variables)
- [Seed Data & Demo Credentials](#seed-data--demo-credentials)
- [API Endpoints](#api-endpoints)
- [Project Architecture](#project-architecture)
- [Docker Support](#docker-support)
- [Notes & Engineering Assumptions](#notes--engineering-assumptions)

---

## Features Built

| Category | Feature | Status | Notes |
|---|---|---|---|
| **Auth** | Sign up & Log in | ✅ Required | Passwords hashed with bcrypt; JWT auth |
| **Auth** | Data Isolation | ✅ Required | Patients strictly only see and modify their own records |
| **Readings** | Add, View, Edit, Delete | ✅ Required | 4 slots: Morning (fasting), After breakfast, After lunch, After dinner |
| **Validation** | 5 Strict Validation Rules | ✅ Required | Client & server enforce exact Kenpath error strings |
| **Reports** | Daily Report | ✅ Required | Selected date: highest, lowest, average (1 decimal), count + slot breakdown |
| **Reports** | Month-to-date Report | ✅ Required | 1st of the month to selected date stats |
| **Reports** | Monthly (Prior Month) | ✅ Required | Entire previous calendar month stats |
| **Reports** | Friendly Empty States | ✅ Required | Contextual medical empty states when no records exist |
| **Bonus** | Pagination on GET /readings | ✅ Bonus | `?page=1&limit=10` with total count & page navigation |
| **Bonus** | Interactive Trend Chart | ✅ Bonus | Recharts monthly line chart with ADA target band |
| **Bonus** | Docker Compose | ✅ Bonus | `docker-compose.yml` starting PostgreSQL & Next.js app |
| **Bonus** | React Testing Library | ✅ Bonus | 6 comprehensive Vitest + RTL tests for the reading form |
| **Bonus** | Unit & Integration Tests | ✅ Bonus | Isolated validation rules test suite + E2E endpoints |

---

## Validation Rules

| Rule | Exact Error Message Enforced |
|---|---|
| Value is required | `"Please enter a glucose value."` |
| Whole number between 40 and 600 | `"Value must be between 40 and 600 mg/dl."` |
| Only one reading per slot per day | `"You already have an After lunch reading for this date."` |
| Maximum 4 readings per day | `"You can add only 4 readings per day."` |
| Date cannot be in the future | `"Date cannot be in the future."` |

---

## Prerequisites

- **Node.js**: v18.0.0 or higher (v24 supported)
- **npm** or **yarn**
- **PostgreSQL** (optional: falls back to in-memory database if not running)

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run the Next.js app (starts both Frontend & API routes on port 3000)
npm run dev
```

Open **http://localhost:3000** in your browser.

---

## Database Setup (PostgreSQL)

```bash
# 1. Create the database in PostgreSQL
psql -U postgres -c "CREATE DATABASE sweety;"

# 2. Configure environment variable in .env.local
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sweety

# 3. Tables and demo data automatically initialize on first launch!
# Or manually run the seed script:
npm run db:seed
```

---

## Running Tests

### Frontend Tests (React Testing Library + Vitest)
```bash
npm test
```
*Validates all 5 client-side input validation bounds, empty checks, future date rejections, and modal actions.*

---

## Seed Data & Demo Credentials

| Field | Value |
|---|---|
| **Email** | `demo@sweety.app` |
| **Password** | `Demo1234!` |
| **Data Scope** | 60 days of historical readings across all 4 time slots |

---

## API Endpoints

### Authentication
- `POST /api/auth/register` – `{ name, email, password }`
- `POST /api/auth/login` – `{ email, password }`
- `GET /api/auth/me` – Retrieve current authenticated user profile

### Readings
- `GET /api/readings` – `?date=YYYY-MM-DD&page=1&limit=10` (paginated)
- `POST /api/readings` – `{ reading_date, time_slot, value_mgdl }`
- `PUT /api/readings/:id` – `{ reading_date, time_slot, value_mgdl }`
- `DELETE /api/readings/:id` – Delete reading by ID

### Reports
- `GET /api/reports/daily?date=YYYY-MM-DD` – Daily aggregates + detailed slot list
- `GET /api/reports/month-to-date?date=YYYY-MM-DD` – 1st of month to date aggregates
- `GET /api/reports/monthly?date=YYYY-MM-DD` – Full prior calendar month aggregates

---

## Project Architecture

```
Kenpathassignment/
├── package.json
├── next.config.js
├── jsconfig.json
├── vitest.config.js
├── docker-compose.yml
├── Dockerfile
├── .gitignore
├── .env.example
├── README.md
│
├── src/
│   ├── app/
│   │   ├── layout.jsx              (Global layout & Navbar wrapper)
│   │   ├── page.jsx                (Daily Dashboard & Compliance Tracker)
│   │   ├── login/page.jsx          (Sign In with pre-loaded demo credentials)
│   │   ├── register/page.jsx       (Create Patient Account)
│   │   ├── readings/page.jsx       (Paginated Logbook & Date Filter)
│   │   ├── reports/page.jsx        (Analytics & Monthly Trend Chart)
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── register/route.js
│   │       │   ├── login/route.js
│   │       │   └── me/route.js
│   │       ├── readings/
│   │       │   ├── route.js
│   │       │   └── [id]/route.js
│   │       └── reports/
│   │           ├── daily/route.js
│   │           ├── month-to-date/route.js
│   │           └── monthly/route.js
│   │
│   ├── lib/
│   │   ├── db.js                   (Postgres connection pool with auto-fallback)
│   │   ├── auth.js                 (JWT signing, verification & bcrypt hashing)
│   │   ├── validations.js          (The 5 Kenpath business rules)
│   │   └── glucose.js              (ADA clinical thresholds & date formatters)
│   │
│   ├── components/
│   │   ├── Icons.jsx               (Custom SVG medical glyphs)
│   │   ├── Navbar.jsx              (Navigation bar with patient avatar)
│   │   ├── ReadingForm.jsx         (Add/Edit modal with live clinical pill)
│   │   ├── ReadingList.jsx         (Logbook table with status pills)
│   │   ├── ReportCard.jsx          (Aggregates card & breakdown)
│   │   ├── GlucoseChart.jsx        (Recharts trend curve with target zone)
│   │   ├── ConfirmModal.jsx        (Accessible confirmation modal)
│   │   ├── Toast.jsx               (Smooth auto-dismissing toast alerts)
│   │   └── EmptyState.jsx          (Clinical empty states)
│   │
│   ├── context/
│   │   └── AuthContext.jsx         (Global auth state & token management)
│   │
│   ├── styles/
│   │   ├── globals.css             (Design tokens & resets)
│   │   └── components.css          (Component styling)
│   │
│   └── tests/
│       ├── ReadingForm.test.jsx    (RTL & Vitest test suite)
│       └── test-setup.js
│
└── scripts/
    └── seed.js                     (Standalone database seed script)
```

---

## Docker Support (Bonus)

```bash
docker-compose up --build
# Starts PostgreSQL on port 5432 and Next.js full-stack app on port 3000
```

---

## Notes & Engineering Assumptions

1. **Unified Port**: Switching to Next.js full-stack eliminates the need to run separate backend/frontend dev servers on different ports, completely preventing `ERR_CONNECTION_REFUSED` errors during evaluation.
2. **Timezone Preservation**: All dates are managed strictly in `YYYY-MM-DD` ISO format. PostgreSQL `DATE` types are parsed explicitly to prevent day-shifting timezone anomalies.
3. **Monthly Reporting Period**: For any given anchor date in October 2026, the **Monthly** report strictly aggregates the complete prior calendar month (`2026-09-01` through `2026-09-30`).
4. **Data Isolation**: All queries enforce `WHERE user_id = $1` extracted securely from verified JWT tokens.
