# Changelog – Sweety Blood Glucose Tracker

All notable changes and architectural upgrades to the Sweety application are documented in this file.

---

## [2.0.0] – Production-Grade Engineering Upgrade (November 2026)

### Phase 1: Security Hardening
- **HTTP-Only Cookie Authentication**: Migrated JWT storage from client-accessible `localStorage` to `httpOnly`, `SameSite=Lax`, `Secure` (in production) cookies (`sweety_token`) with a 7-day expiration.
- **Fail-Fast Secret Validation**: Configured runtime startup to fail immediately in production if `JWT_SECRET` is unset.
- **Sliding-Window Rate Limiting**: Added in-memory rate limiting to `/api/auth/login` and `/api/auth/register` (10 requests per 15 minutes per IP/email) returning HTTP 429 with `Retry-After`.
- **Demo Mode Isolation**: Gated demo credentials and prefill behind `DEMO_MODE=true` environment flag.
- **Security Response Headers**: Configured strict security headers via Next.js (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, CSP).
- **Server-Side Input Sanitization**: Added strict server-side validation and trimming for name, email, password length, and injection resistance.

### Phase 2: Data Integrity & Persistence
- **Database Schema Constraints**:
  - Enforced `CHECK (value_mgdl BETWEEN 40 AND 600)`.
  - Enforced `CHECK (time_slot IN ('morning_fasting', 'after_breakfast', 'after_lunch', 'after_dinner'))`.
  - Enforced `UNIQUE (user_id, reading_date, time_slot)` with named constraint `uq_user_date_slot`.
  - Foreign key cascade: `user_id REFERENCES users(id) ON DELETE CASCADE`.
  - B-tree composite index: `CREATE INDEX idx_readings_user_date ON readings (user_id, reading_date)`.
- **Postgres Error Code Mapping**: Mapped PostgreSQL constraint violation `23505` to the exact assignment message: `"You already have an {Slot label} reading for this date."`.
- **Transaction Safety**: Wrapped the 4-readings-per-day check and insert in atomic SQL transactions (`BEGIN ... COMMIT`) to prevent race conditions.
- **Health Check & In-Memory Warning**:
  - Exposed `GET /api/health` returning `{ status: 'ok', db: 'postgres' | 'memory', demoMode: boolean }`.
  - Added dismissible amber notice banner `<MemoryNoticeBanner />` alerting users when running on ephemeral in-memory storage.

### Phase 3: Time Zone Correctness
- **Localized Date Engine (`src/lib/date.js`)**:
  - Implemented `getTodayInTimezone(timezone)` using standard `Intl.DateTimeFormat`.
  - Future date validation strictly evaluated against user's localized calendar date.
  - Pure functions for calendar boundaries: `getMonthToDateRange()`, `getPreviousMonthRange()`, and leap year calculations (`isLeapYear()`).
  - Tested December-to-January year rollover (e.g. Jan 2026 -> full Dec 2025 month).
  - Tested leap-day handling (Feb 2024 with 29 days vs Feb 2023 with 28 days).
- **Timezone Schema Persistence**: Added `timezone VARCHAR(50) DEFAULT 'UTC'` column to `users` and client registration payload.

### Phase 4: Test Automation
- **API Integration Tests (`src/tests/api.test.js`)**:
  - All 5 exact non-negotiable validation messages tested.
  - 401 Unauthorized handling.
  - Cross-user data isolation: confirms patients cannot access other patients' records (returns HTTP 404).
  - Server-side pagination metadata (`page`, `limit`, `total`, `totalPages`).
  - Daily, Month-to-date, and Monthly report aggregations (highest, lowest, 1-decimal average, empty state).
- **Component Tests (`src/tests/components.test.jsx`)**:
  - `ConfirmModal`: verified Escape key listener, backdrop dismissal, and focus trapping (Tab / Shift+Tab cycling).
  - `Toast`: verified `role="status"`, `aria-live` polite/assertive announcement, and dismissal.
- **End-to-End Test Suite (`e2e/reading-flow.spec.js`)**:
  - Playwright test automating login, adding readings, viewing daily reports, editing readings, and deleting via accessible `ConfirmModal`.

### Phase 5: CI/CD & Code Quality
- **ESLint & Prettier**: Configured flat config `eslint.config.mjs`, `.prettierrc`, and `.prettierignore`.
- **GitHub Actions Workflow (`.github/workflows/ci.yml`)**:
  - Automated CI running on push/PR to `main`.
  - Spins up PostgreSQL 15 service container, installs dependencies, lints codebase, runs unit & integration tests, and builds Next.js production bundle.
- **CI Status Badge**: Displayed in `README.md`.

### Phase 6: Product & Clinical Features
- **Notes & Clinical Tags**:
  - Added optional clinical note (up to 200 characters) with real-time counter.
  - Added 4 preset context tags (`After Exercise`, `Missed Insulin`, `High Stress`, `Illness / Infection`).
  - Added tag filtering dropdown in Readings logbook.
- **Advanced Metabolic Metrics**:
  - **Time-in-Range (TIR)**: Percentage of readings within the 70–180 mg/dL target zone with animated compliance bar.
  - **Estimated HbA1c**: Calculated via ADAG formula $HbA1c = (eAG + 46.7) / 28.7$.
  - **Trend Insights**: Rolling comparison of recent 7 readings vs prior cohort.
- **Export & Print Summary**:
  - Instant CSV export download for readings logbook and monthly reports.
  - Print-friendly CSS stylesheet (`@media print`) for clean "Save as PDF" doctor summary sheets.
- **Unit Toggle (mg/dL <-> mmol/L)**:
  - Global unit toggle in Navbar with persistent `localStorage` preference.
  - Display-only conversion ($÷ 18.016$) preserving integer mg/dL database storage.
- **Clinical Citations**: Centralized in `src/config/clinical.js` with ADA citations and medical disclaimers.

### Phase 7: UX, Accessibility & PWA
- **Loading Skeletons (`src/components/Skeletons.jsx`)**: Replaced raw spinners with smooth CSS pulse skeletons for tables, report cards, and trend charts.
- **Optimistic UI Updates**: Implemented instantaneous optimistic removal in Readings logbook with automatic state rollback on network failure.
- **Accessibility (a11y)**:
  - Form inputs wired with `aria-describedby` pointing to error spans.
  - Dynamic glucose status preview with `role="status"` and `aria-live="polite"`.
  - Accessible modal dialogs with focus traps.
- **Mobile-First UX**:
  - Added `inputMode="numeric"` and `pattern="[0-9]*"` for mobile numeric keyboards.
  - Dynamic default time slot based on current time of day.
- **Dark Mode**: Fully themed via CSS custom properties and persistent theme toggle.
- **PWA Capabilities**: Added `manifest.json`, high-resolution SVG blood drop icon, and offline Service Worker (`sw.js`).
