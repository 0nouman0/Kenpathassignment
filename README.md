# 🩸 Sweety – Production-Grade Blood Glucose Tracker

[![CI](https://github.com/mohammed/sweety/actions/workflows/ci.yml/badge.svg)](https://github.com/mohammed/sweety/actions)
![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=flat&logo=next.js)
![React](https://img.shields.io/badge/React-18-blue?style=flat&logo=react)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?style=flat&logo=postgresql)
![Vitest](https://img.shields.io/badge/Tests-51%20Passed-emerald?style=flat&logo=vitest)

A medical-grade, full-stack application built with **Next.js 14 (App Router), React 18, and PostgreSQL**. Designed for diabetes patients to record up to **4 blood glucose readings per day** across standard metabolic windows (Morning fasting, After breakfast, After lunch, After dinner), track daily clinical compliance, and generate daily and monthly analytical reports.

---

## 🏛️ Architecture & System Design

Sweety runs as a **unified full-stack application on a single port (`:3000`)**. The Next.js 14 App Router co-locates the React server/client components and the backend route handlers under `src/app/`, eliminating CORS issues, port-mismatch headaches, and dual-server orchestration problems.

```mermaid
flowchart TD
    subgraph Client["Frontend Client (Port :3000)"]
        UI["React 18 Components\n(Logbook, Reports, Recharts)"]
        Context["AuthContext & UnitContext\n(HTTP-only Cookies, mg/dL ↔ mmol/L)"]
        PWA["Service Worker & Manifest\n(Offline Shell)"]
    end

    subgraph Server["Next.js Server Runtime (Port :3000)"]
        Middleware["Security Headers & CSP Middleware"]
        AuthModule["Auth & Rate Limiter\n(bcryptjs, JWT, 10 req/15min)"]
        Routes["API Route Handlers\n(/api/readings, /api/reports, /api/health)"]
        DateEngine["Date & Timezone Engine\n(Intl.DateTimeFormat)"]
    end

    subgraph Storage["Data Persistence Layer"]
        DBPool["Universal DB Engine (src/lib/db.js)"]
        PG[("PostgreSQL 16\n(Transactions, Cascade, CHECK, UNIQUE)")]
        MEM[("In-Memory Fallback Engine\n(Pre-seeded 60 days, Zero-Config)")]
    end

    UI --> Context
    Context --> Routes
    Routes --> Middleware
    Routes --> AuthModule
    Routes --> DateEngine
    Routes --> DBPool
    DBPool -->|DATABASE_URL connected| PG
    DBPool -->|Postgres offline| MEM
```

---

## 🎯 Features

### 1. Authentication & Security
- **Secure Authentication**: User registration and login with passwords hashed using `bcryptjs` (salt rounds: 10).
- **HTTP-Only Cookies**: JWT tokens stored exclusively in `httpOnly`, `SameSite=Lax`, `Secure` (in production) cookies (`sweety_token`).
- **Data Isolation**: Patients strictly access and manipulate only their own records. Cross-patient resource requests return `404 Not Found`.
- **Sliding-Window Rate Limiting**: In-memory rate limiting on `/api/auth/login` and `/api/auth/register` (10 requests / 15 minutes per IP/email) returning HTTP `429 Too Many Requests`.
- **Demo Mode Isolation**: Demo pre-fills and test accounts are strictly gated behind `DEMO_MODE=true`.
- **Security Headers**: Injected via Next.js middleware and config (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, CSP).

### 2. Blood Glucose Tracking & Validation
- **4 Metabolic Slots**: Morning (fasting), After breakfast, After lunch, After dinner.
- **Smart Time-of-Day Default**: Automatically selects the appropriate slot based on the current hour:
  - `05:00 – 10:00`: Morning (fasting)
  - `10:00 – 14:00`: After breakfast
  - `14:00 – 19:00`: After lunch
  - `19:00 – 05:00`: After dinner
- **Notes & Clinical Tags**: Optional notes (up to 200 characters) and 4 preset medical tags (`After Exercise`, `Missed Insulin`, `High Stress`, `Illness / Infection`).
- **Optimistic UI Updates**: Immediate client updates on record deletion with automatic state rollback on network failure.
- **Accessible UI**: All inputs wired with `aria-describedby` for validation errors, keyboard focus traps in modal dialogs (`ConfirmModal`), and `aria-live` announcements for toasts and status pills.

### 3. Metabolic Reports & Clinical Analytics
- **Daily Report**: Aggregates highest, lowest, average (rounded to 1 decimal place), count of readings, and slot-by-slot breakdown for any selected date.
- **Month-to-Date Report**: Aggregates all readings from the 1st of the month through the selected anchor date.
- **Monthly Report**: Automatically aggregates the full previous calendar month relative to the selected date (accurately handles Dec→Jan rollovers and leap years).
- **Time-in-Range (TIR)**: Percentage of readings within 70–180 mg/dL target zone with progress bar.
- **Estimated HbA1c (ADAG Formula)**: Calculated using the clinical formula $HbA1c = (eAG + 46.7) / 28.7$.
- **Trend Insights**: Rolling comparison of the recent 7 readings against the prior period.
- **Interactive Chart**: Recharts line visualization with highlighted ADA target zone (70–140 mg/dL).
- **Export & Print**: One-click CSV export and print-ready CSS (`@media print`) for doctor summary reports.
- **Unit Toggle**: Display switch between `mg/dL` and `mmol/L` ($÷ 18.016$) stored in user preferences.

---

## 🔒 Exact Non-Negotiable Validation Rules

All validation rules are strictly enforced identically on the client and server:

| Validation Rule | Exact Error Message |
|---|---|
| **Value is required** | `"Please enter a glucose value."` |
| **Value range (whole integer 40–600)** | `"Value must be between 40 and 600 mg/dl."` |
| **Only one reading per slot per day** | `"You already have an {Slot label} reading for this date."` |
| **Maximum 4 readings per day** | `"You can add only 4 readings per day."` |
| **Date cannot be in the future** | `"Date cannot be in the future."` |

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 18.x or 20.x
- npm 9+
- *(Optional)* PostgreSQL 14+ or Docker (if PostgreSQL is not running, Sweety runs zero-config with its in-memory database!)

### Option A: Zero-Config Startup (Instant Evaluation)

Sweety features a dual-mode database engine. If PostgreSQL is not active locally, the application automatically falls back to an in-memory database pre-seeded with **60 days of realistic clinical readings** (178 records) and the demo user (`demo@sweety.app` / `Demo1234!`):

```bash
# 1. Clone the repository
git clone https://github.com/mohammed/sweety.git
cd sweety

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### Option B: With Local PostgreSQL

1. **Create Database**:
   ```sql
   CREATE DATABASE sweety;
   ```

2. **Configure `.env`**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Update `DATABASE_URL`:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sweety
   JWT_SECRET=sweety_super_secret_jwt_key_at_least_32_chars_12345
   DEMO_MODE=true
   ```

3. **Apply Schema & Seed Demo Patient**:
   ```bash
   # Initialize tables, CHECK constraints, and unique indexes
   psql $DATABASE_URL -f db/schema.sql

   # Seed demo user and 60 days of clinical data
   npm run db:seed
   ```

4. **Start the Application**:
   ```bash
   npm run dev
   ```

---

### Option C: Docker Compose

Spin up both PostgreSQL and the Next.js production container with a single command:

```bash
docker compose up --build
```

Access the app at [http://localhost:3000](http://localhost:3000).

---

## 🧪 Testing Suite

Sweety includes a test suite covering unit calculations, component accessibility, and full API integration tests:

```bash
# Run all 51 Vitest unit & integration tests
npm test

# Run tests with coverage
npm run test:coverage

# Run ESLint check
npm run lint

# Run Playwright End-to-End tests (optional)
npx playwright test
```

### Test Coverage Highlights:
- **`src/tests/api.test.js`** (14 tests): Verifies all 5 exact error messages, 401 unauthorized, cross-user data isolation (404), server-side pagination, and daily/monthly report math.
- **`src/tests/components.test.jsx`** (8 tests): Verifies `ConfirmModal` keyboard trapping (Tab/Shift-Tab) and Escape key listener, and `Toast` polite/assertive ARIA live regions.
- **`src/tests/clinical.test.js`** (10 tests): Verifies unit conversion formulas, Time-in-Range (TIR) calculations, and ADAG estimated HbA1c formula.
- **`src/tests/date.test.js`** (13 tests): Verifies leap year handling, Dec→Jan year rollover, and timezone boundary checks.
- **`src/tests/ReadingForm.test.jsx`** (6 tests): Verifies client-side form validation and interactive error rendering.

---

## 📡 API Reference

All endpoints return JSON and require authentication (via HTTP-only cookie `sweety_token` or `Authorization: Bearer <token>`):

| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new patient account | `201`, `400`, `409`, `429` |
| `POST` | `/api/auth/login` | Authenticate patient & set HTTP-only cookie | `200`, `400`, `401`, `429` |
| `POST` | `/api/auth/logout` | Clear auth cookie | `200` |
| `GET` | `/api/auth/me` | Fetch currently logged-in user profile | `200`, `401` |
| `GET` | `/api/auth/config` | Returns client configuration (`{ demoMode: boolean }`) | `200` |
| `GET` | `/api/health` | Health check (`{ status: "ok", db: "postgres" \| "memory" }`) | `200` |
| `GET` | `/api/readings` | Paginated list of readings (`?page=1&limit=20&date=YYYY-MM-DD&tag=X`) | `200`, `401` |
| `POST` | `/api/readings` | Create reading with atomic transaction check | `201`, `400`, `409` |
| `GET` | `/api/readings/:id` | Get single reading by ID (isolated to authenticated user) | `200`, `401`, `404` |
| `PUT` | `/api/readings/:id` | Update reading (isolated to authenticated user) | `200`, `400`, `404`, `409` |
| `DELETE` | `/api/readings/:id` | Delete reading (isolated to authenticated user) | `200`, `401`, `404` |
| `GET` | `/api/reports/daily` | Daily glycemic stats & readings list (`?date=YYYY-MM-DD`) | `200`, `401` |
| `GET` | `/api/reports/month-to-date` | 1st of month to anchor date stats (`?date=YYYY-MM-DD`) | `200`, `401` |
| `GET` | `/api/reports/monthly` | Full previous calendar month stats (`?date=YYYY-MM-DD`) | `200`, `401` |

---

## 🔑 Environment Variables

| Variable | Required in Prod | Default | Purpose |
|---|---|---|---|
| `DATABASE_URL` | Optional (falls back to memory) | `postgresql://postgres:postgres@localhost:5432/sweety` | PostgreSQL connection string |
| `JWT_SECRET` | **Yes** (fails fast if unset) | *None* | Key used for signing JWTs |
| `JWT_EXPIRES_IN` | No | `7d` | Token expiration duration |
| `DEMO_MODE` | No | `false` | Enables demo hints and prefill on login |
| `NODE_ENV` | No | `development` | Node environment (`development` / `production`) |
| `PORT` | No | `3000` | Application port |

---

## 💡 Design Decisions & Engineering Assumptions

1. **Unified Next.js 14 Architecture**:
   - *Decision*: Consolidate frontend and API route handlers into Next.js 14 App Router instead of separate Express and Vite servers.
   - *Rationale*: Eliminates cross-origin cookie issues, simplifies production deployment to a single container, and guarantees zero port mismatch errors.
2. **Dual-Mode Persistence (Postgres + In-Memory Fallback)**:
   - *Decision*: Provide automatic fallback to an in-memory clinical database if PostgreSQL is not active.
   - *Rationale*: Allows evaluators to clone and review the application with `npm run dev` with zero setup, while supporting real PostgreSQL instances in Docker and production.
3. **UTC Date Parsing Fix**:
   - *Decision*: Configure `types.setTypeParser(1082, (str) => str)` on `pg`.
   - *Rationale*: Default PostgreSQL Node driver converts `DATE` columns into JavaScript `Date` instances in UTC midnight, shifting dates back by 1 day in local timezones. Retaining `YYYY-MM-DD` strings avoids timezone corruption.
4. **Data Isolation (404 instead of 403)**:
   - *Decision*: Return `404 Not Found` when a patient attempts to access another patient's reading.
   - *Rationale*: Returning `403 Forbidden` confirms to malicious users that an ID exists. `404` ensures complete privacy and zero data leakage.
5. **Database Unique Violation Code `23505` Mapping**:
   - *Decision*: Map PostgreSQL error code `23505` directly to `"You already have an {Slot label} reading for this date."`.
   - *Rationale*: Guarantees that concurrent requests triggering a database race condition return the exact assignment validation error message.

---

## 📝 Notes & What We'd Improve With More Time

1. **Continuous Glucose Monitor (CGM) Sync**: Integration with Dexcom or FreeStyle Libre APIs to ingest readings continuously.
2. **Push Notifications**: Web Push API alerts reminding patients to log readings 2 hours after standard meal windows.
3. **Role-Based Doctor Portal**: A clinician dashboard allowing endocrinologists to view anonymized glycemic trend cohorts across assigned patient lists.
4. **Redis Cache Layer**: Caching heavy monthly analytical reports in Redis, automatically invalidated on reading mutation.

---

## 👨‍💻 Submission Details
- **Candidate:** Mohammed
- **Position:** Junior Full Stack Developer – JavaScript & AI
- **Company:** Kenpath
- **Demo Account:** `demo@sweety.app` / `Demo1234!`
