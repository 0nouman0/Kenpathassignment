# Sweety

A small web app for people with diabetes. Record up to four blood glucose readings a day, then see daily, month-to-date and previous-month reports.

Built for the Kenpath Junior Full Stack Developer assignment with **Node.js + Express**, **PostgreSQL** and **React (Vite)**.

| Today | Reports |
| --- | --- |
| ![Today](docs/screenshots/02-today.png) | ![Reports](docs/screenshots/04-reports.png) |

More screenshots are in [`docs/screenshots`](docs/screenshots): login, readings history, a validation error, and the mobile dark theme.

## What it does

- **Sign up / log in.** Passwords are hashed with bcrypt. The login is an httpOnly cookie holding a JWT. Everyone sees only their own readings.
- **Add, view, edit, delete readings.** Each has a date, a time slot (Morning (fasting), After breakfast, After lunch, After dinner) and a value in mg/dl.
- **Validation** (checked in the browser for quick feedback and again on the server, which is the one that counts):

  | Rule | Message |
  | --- | --- |
  | Value required | Please enter a glucose value. |
  | Whole number, 40 to 600 | Value must be between 40 and 600 mg/dl. |
  | One reading per slot per day | You already have an After lunch reading for this date. |
  | Maximum 4 per day | You can add only 4 readings per day. |
  | Date not in the future | Date cannot be in the future. |

- **Reports** show highest, lowest, average (1 decimal) and number of readings, with a friendly empty state:

  | Report | Range (selected date 15 Oct 2026) |
  | --- | --- |
  | Daily (also lists each reading and its slot) | 15 Oct 2026 |
  | Month to date | 1 Oct to 15 Oct 2026 |
  | Previous month | 1 Sep to 30 Sep 2026 |

- **Bonus tasks done:** pagination on `GET /api/readings`, a chart of the month's readings (Recharts), `docker-compose.yml` (PostgreSQL and the app), and React Testing Library tests for the reading form.

## Project layout

```
server/   Express API
  src/routes/      auth, readings, reports
  src/lib/         validation, dates, stats (plain functions, easy to test)
  db/schema.sql    tables and constraints
  scripts/         init-db.js, seed.js
  tests/           Vitest + Supertest
client/   React app (Vite)
  src/pages/       Today, Readings, Reports, Login, Register
  src/components/  ReadingForm, Modal, Stats, TrendChart, ...
  src/styles/      app.css (all styling, with light and dark themes)
  src/tests/       Vitest + React Testing Library
```

## Install

You need **Node.js 20 or newer** and **PostgreSQL 14 or newer** (or Docker, see below).

```bash
git clone <this repository>
cd <folder>
npm run install:all          # installs server/ and client/ dependencies
cp .env.example .env         # then edit .env (see below)
```

## Set up the database

Create an empty database, then point `DATABASE_URL` in `.env` at it:

```bash
createdb sweety              # or: psql -U postgres -c "CREATE DATABASE sweety;"
```

In `.env`:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sweety
```

Create the tables and add the demo user with sample readings:

```bash
npm run db:init              # runs server/db/schema.sql (safe to repeat)
npm run db:seed              # demo user + about 70 days of readings (safe to repeat)
```

The server also runs the schema when it starts, so `db:init` is optional.

**Demo login:** `demo@sweety.app` / `Demo1234!`

## Run

Use two terminals:

```bash
npm run dev:server           # API on http://localhost:4000
npm run dev:client           # app on http://localhost:5173 (proxies /api to the API)
```

Open <http://localhost:5173>.

### Run with Docker instead

```bash
docker compose up --build    # PostgreSQL + the app on http://localhost:4000
docker compose exec app node scripts/seed.js    # optional: add the demo data
```

## Run the tests

```bash
npm test                     # server tests, then client tests
npm --prefix server test     # API only
npm --prefix client test     # React only
```

The server tests run against an in-memory PostgreSQL (pg-mem), so they need no database or `.env`. They cover registration and login, password hashing, every validation rule, ownership (user A cannot see or change user B's readings), pagination, and the three report date ranges including year and leap-year edges. The client tests cover the reading form's validation, submit, edit, and server error display.

## API

All routes except register and login need the login cookie. Errors look like `{ "error": "message", "field": "value_mgdl" }`.

| Method and path | Purpose |
| --- | --- |
| `POST /api/auth/register` | `{ name, email, password, timezone? }` |
| `POST /api/auth/login` | `{ email, password }` |
| `POST /api/auth/logout`, `GET /api/auth/me` | |
| `GET /api/readings?page=1&limit=20` | Newest first. Optional `date=` or `from=` and `to=`. Returns `{ data, pagination }` |
| `POST /api/readings` | `{ reading_date, time_slot, value_mgdl }` |
| `PUT /api/readings/:id`, `DELETE /api/readings/:id` | Another user's reading returns 404 |
| `GET /api/reports/daily?date=YYYY-MM-DD` | Stats plus the day's readings |
| `GET /api/reports/month-to-date?date=...` | |
| `GET /api/reports/monthly?date=...` | The whole month before the selected date's month |

`time_slot` is one of `morning`, `after_breakfast`, `after_lunch`, `after_dinner`.

## Notes

### Assumptions

- **"Future" depends on the user's timezone.** The browser's timezone is saved when someone registers, and the server uses it to decide what "today" is. A reading logged just after midnight in India is therefore not rejected just because it is still yesterday in UTC.
- **Dates are `YYYY-MM-DD` strings end to end.** Nothing is converted through a JS `Date` in the server's timezone, which avoids off-by-one-day errors.
- **"Previous month" means the month before the selected date's month**, as in the brief's example (selected 15 Oct gives 1 to 30 Sep).
- **Report dates in the future are allowed** (they simply return no readings). Only *readings* cannot be dated in the future.
- **The 4-per-day limit can never fire today.** There are exactly four slots and one reading per slot, so a full day already has every slot and the duplicate-slot message wins. The check is still implemented (and used when editing) as a safety net if more slots are added. This is why the form only ever shows the "already have" message in practice.
- **Slots are fixed**, and the value is always mg/dl (no mmol/l toggle).
- **The "In range / Low / High" labels** use common adult guidance (fasting 70 to 130, after meals under 180). They are only a visual aid, not medical advice, and are not part of the required rules.
- The JWT lives in an httpOnly, SameSite=Lax cookie (not localStorage) so page scripts cannot read it. The Vite dev server proxies `/api`, which keeps the browser on a single origin so the cookie just works.

### What I would improve with more time

- **Test against real PostgreSQL in CI.** The server tests use pg-mem for speed and zero setup; the SQL used is plain, but a real-database run would catch driver and type differences.
- Rate limiting and lockout on login, email verification, and password reset.
- Optimistic UI updates and a proper data-fetching layer (for example TanStack Query) instead of per-page `useEffect` loading.
- Remaining bonus tasks: Redis caching for reports, a BullMQ reminder job, and a doctor role.
- A browser end-to-end test (Playwright) for the full add, edit, delete flow, and a short screen recording.
- Accessibility pass with a screen reader, and a localised date input.
