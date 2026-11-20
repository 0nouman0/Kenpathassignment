# 🩸 Sweety – Clinical Blood Glucose Tracker

A production-grade, full-stack medical application built with **Node.js, Express, PostgreSQL, and React (Vite)**. Built for diabetes patients to accurately track up to **4 blood glucose readings per day** across standard metabolic windows (Morning fasting, After breakfast, After lunch, After dinner), monitor clinical compliance, and view daily and monthly analytical reports.

---

## Key Highlights & Clinical Design (Non-Vibecoded)

- **Evidence-Based Clinical Guidelines (ADA Standard)**:
  - **Fasting Target**: 70 – 130 mg/dL
  - **Post-Prandial (After Meal) Target**: < 180 mg/dL
  - **Hypoglycemia Alert**: < 70 mg/dL
  - **Hyperglycemia Alert**: > 180 (fasting) / > 240 (post-prandial)
- **Clinical Status Badges**: Dynamic status chips (`In Target`, `Elevated`, `High`, `Low`) based on standard glycemic thresholds.
- **Micro-Interaction & Safety**: Native `window.confirm` and `alert` dialogs are completely eliminated in favor of accessible, keyboard-trapped modal dialogs and smooth, auto-dismissing toast alerts.
- **SVG Iconography**: Custom SVG icons throughout (no emoji hacks in production UI).
- **Interactive Visualizations**: Recharts line charts featuring shaded ADA normal reference bands (70–140 mg/dL), daily mean curves, and custom diagnostic tooltips.
- **Real-Time Input Feedback**: Dynamic inline clinical feedback pill while typing glucose values.

---

## Table of Contents

- [Features Built](#features-built)
- [Validation Rules](#validation-rules)
- [Prerequisites](#prerequisites)
- [Installation & Quick Start](#installation--quick-start)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Running Tests](#running-tests)
- [Environment Variables](#environment-variables)
- [Seed Data & Demo Credentials](#seed-data--demo-credentials)
- [API Endpoints](#api-endpoints)
- [Project Architecture](#project-architecture)
- [Docker Support](#docker-support)
- [Notes & Engineering Decisions](#notes--engineering-decisions)

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
| **Bonus** | Docker Compose | ✅ Bonus | `docker-compose.yml` for PostgreSQL, Express API, & Vite Client |
| **Bonus** | React Testing Library | ✅ Bonus | 6 comprehensive Vitest + RTL tests for the reading form |
| **Bonus** | Unit & Integration Tests | ✅ Bonus | Jest unit tests for validations + Supertest E2E suite |

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

- **Node.js**: v18.0.0 or higher
- **PostgreSQL**: v14 or higher (or Docker)
- **npm** or **yarn**

---

## Installation & Quick Start

```bash
# 1. Clone repository
git clone https://github.com/your-username/sweety.git
cd sweety

# 2. Install backend dependencies
cd server
npm install

# 3. Install frontend dependencies
cd ../client
npm install
```

---

## Database Setup

```bash
# 1. Create database in PostgreSQL
psql -U postgres -c "CREATE DATABASE sweety;"

# 2. (Optional) Create user
psql -U postgres -c "CREATE USER sweety_user WITH PASSWORD 'sweety_pass';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE sweety TO sweety_user;"

# 3. Run schema migration
cd server
psql -U postgres -d sweety -f db/schema.sql

# 4. Run seed script (generates demo account + 60 days of realistic readings)
npm run db:seed
```

---

## Running the Application

### Option A: Local Dev Servers

**Terminal 1 – Backend:**
```bash
cd server
cp .env.example .env    # Configure DATABASE_URL and JWT_SECRET
npm run dev
# Running on http://localhost:5000
```

**Terminal 2 – Frontend:**
```bash
cd client
npm run dev
# Running on http://localhost:5173
```

### Option B: Docker Compose (Bonus)

```bash
docker-compose up --build
# Postgres at localhost:5432
# Backend API at http://localhost:5000
# Frontend Client at http://localhost:5173
```

---

## Running Tests

### 1. Frontend Tests (React Testing Library + Vitest)
```bash
cd client
npm test
```
*Executes 6 tests validating input bounds, future dates, required fields, and cancellation.*

### 2. Backend Unit Tests (Isolated Validation Suite)
```bash
cd server
npm run test:unit
```
*Validates all 5 Kenpath business rules in memory with zero external dependencies.*

### 3. Backend E2E Integration Tests (Requires test database)
```bash
cd server
# Ensure TEST_DATABASE_URL is set in .env
npm test
```

---

## Seed Data & Demo Credentials

After running `npm run db:seed` in `server/`:

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

### Readings
- `GET /api/readings` – Query params: `?date=YYYY-MM-DD&page=1&limit=20`
- `POST /api/readings` – `{ reading_date, time_slot, value_mgdl }`
- `PUT /api/readings/:id` – `{ reading_date, time_slot, value_mgdl }`
- `DELETE /api/readings/:id` – Delete by ID

### Reports
- `GET /api/reports/daily?date=YYYY-MM-DD` – Daily aggregates + detailed slot list
- `GET /api/reports/month-to-date?date=YYYY-MM-DD` – 1st of month to date aggregates
- `GET /api/reports/monthly?date=YYYY-MM-DD` – Full prior calendar month aggregates

---

## Project Architecture

```
Kenpathassignment/
├── README.md
├── docker-compose.yml
├── .gitignore
│
├── server/
│   ├── Dockerfile
│   ├── package.json
│   ├── .env.example
│   ├── db/
│   │   ├── schema.sql
│   │   └── seed.js
│   ├── src/
│   │   ├── index.js
│   │   ├── db.js
│   │   ├── middleware/        auth.js, errorHandler.js
│   │   ├── routes/            auth.js, readings.js, reports.js
│   │   ├── controllers/       authController.js, readingsController.js, reportsController.js
│   │   └── validations/       readingValidation.js
│   └── tests/
│       ├── validation.unit.test.js
│       ├── auth.test.js
│       └── readings.test.js
│
└── client/
    ├── Dockerfile
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── test-setup.js
        ├── api/               axios.js, auth.js, readings.js, reports.js
        ├── context/           AuthContext.jsx
        ├── utils/             glucose.js (ADA guidelines & status categorizer)
        ├── components/
        │   ├── Icons.jsx          (Custom SVG icons)
        │   ├── Layout.jsx         (Clinical navigation & patient pill)
        │   ├── ReadingForm.jsx    (Add/Edit modal with live clinical preview)
        │   ├── ReadingList.jsx    (Logbook table with status pills)
        │   ├── ReportCard.jsx     (Aggregates card & breakdown)
        │   ├── GlucoseChart.jsx   (Recharts monthly trend with target zone)
        │   ├── ConfirmModal.jsx   (Accessible confirmation dialog)
        │   ├── Toast.jsx          (Smooth notification toast)
        │   ├── EmptyState.jsx     (Clinical empty states)
        │   └── PrivateRoute.jsx   (Route protection)
        ├── pages/
        │   ├── LoginPage.jsx
        │   ├── RegisterPage.jsx
        │   ├── DashboardPage.jsx  (Today's 4 slots & compliance progress)
        │   ├── ReadingsPage.jsx   (Filterable logbook & pagination)
        │   └── ReportsPage.jsx    (Analytics & monthly trend)
        ├── styles/
        │   ├── global.css         (Slate/Teal clinical design tokens)
        │   └── components.css     (Polished component styling)
        └── tests/
            └── ReadingForm.test.jsx
```

---

## Notes & Engineering Decisions

### Assumptions
1. **Timezone Handling**: Dates are communicated strictly in `YYYY-MM-DD` ISO strings. PostgreSQL `DATE` types are parsed explicitly to prevent timezone-shift day drops.
2. **Prior Month Logic**: For the "Monthly" report, passing any date in October 2026 computes the window `2026-09-01` through `2026-09-30`.
3. **Data Integrity**: Enforced at both the database level (Postgres table constraints and composite unique index on `user_id, reading_date, time_slot`) and the Express application layer.
4. **Token Security**: Tokens are sent via standard `Authorization: Bearer <token>` headers with automatic 401 interception on expired sessions.

### What I'd Improve With More Time
1. **HttpOnly Cookie Storage**: Upgrade from `localStorage` JWT to secure, httpOnly, sameSite cookies for enhanced XSS defense.
2. **Redis In-Memory Caching**: Cache expensive monthly aggregation report queries with automatic key invalidation on new reading mutations.
3. **Doctor / Clinician Portal**: Multi-tenant role system allowing certified clinicians to review assigned patient charts, leave clinical notes, and export PDF summaries.
4. **Offline Sync & PWA**: Service Worker integration with IndexedDB for offline glucose entry when network connectivity is intermittent.
