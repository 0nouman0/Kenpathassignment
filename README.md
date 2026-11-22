# Sweety — Blood Glucose Tracker

A full-stack clinical blood glucose logging application for diabetes management. Patients record up to 4 structured metabolic readings a day (fasting, after breakfast, after lunch, after dinner) and view comprehensive daily, month-to-date, and previous-month reports with ADA glycemic target tracking.

Built for the **Kenpath Junior Full Stack Developer** assignment using **Node.js + Express**, **PostgreSQL**, and **React (Vite)**.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Demo Credentials](#demo-credentials)
- [Prerequisites](#prerequisites)
- [Quick Start Guide](#quick-start-guide)
  - [1. Clone and Install](#1-clone-and-install)
  - [2. Environment Configuration](#2-environment-configuration)
  - [3. Database Setup](#3-database-setup)
  - [4. Seed Sample Data](#4-seed-sample-data)
  - [5. Run the Application](#5-run-the-application)
- [Docker Deployment](#docker-deployment)
- [Validation Rules](#validation-rules)
- [Reporting Engine](#reporting-engine)
- [Running Tests](#running-tests)
- [API Reference](#api-reference)
- [Project Architecture](#project-architecture)
- [Notes](#notes)
  - [Assumptions](#assumptions)
  - [What I'd Improve with More Time](#what-id-improve-with-more-time)

---

## Features

- **Authentication & Security**: Secure user registration and login with passwords hashed using `bcryptjs`. Session management via `httpOnly`, `SameSite=Lax` JWT cookies (preventing XSS token extraction).
- **Tenant Isolation**: Strict user-level isolation in all queries — users can only view, edit, or delete their own readings. Cross-user access returns `404 Not Found`.
- **4 Metabolic Slots**: Morning (fasting), After breakfast, After lunch, and After dinner.
- **Strict Clinical Validation**: Instant browser feedback backed by identical server-side database enforcement (40–600 mg/dl range, whole numbers, unique slot per day, 4-reading daily ceiling, no future dates).
- **Dynamic Reports**:
  - **Daily Report**: All slot readings for the selected date + Highest, Lowest, Average (rounded to 1 decimal), and reading count.
  - **Month-to-Date Report**: Rolling statistics from the 1st of the month through the selected anchor date.
  - **Monthly Report**: Complete statistics for the whole previous calendar month.
- **Interactive Trajectory Chart**: Visual line chart (Recharts) plotting daily average glucose against shaded American Diabetes Association (ADA) healthy target bands (70–180 mg/dl).
- **Server-Side Pagination**: Full history table with date filtering and paginated retrieval (`?page=1&limit=15`).
- **Modern Responsive UI**: Clean clinical design system with light/dark theme adaptation, accessible keyboard navigation, and zero external emoji.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, React Router v6, Recharts, CSS Variables (Design Tokens) |
| **Backend** | Node.js (v20+), Express 4, jsonwebtoken, cookie-parser, bcryptjs |
| **Database** | PostgreSQL 14+ (via `pg` pool), Docker Compose |
| **Testing** | Vitest, Supertest, `pg-mem` (in-memory PostgreSQL), React Testing Library |

---

## Demo Credentials

For evaluation and testing, a pre-configured demo account populated with ~70 days of clinical readings is available:

| Field | Value |
|---|---|
| **Email** | `demo@sweety.app` |
| **Password** | `Demo1234!` |

*(Note: In accordance with security best practices, demo credentials are kept in documentation and hidden from the public production login UI).*

---

## Prerequisites

Ensure you have the following installed locally:
- **Node.js**: `v20.0.0` or higher
- **npm**: `v10.0.0` or higher
- **PostgreSQL**: `v14` or higher (OR **Docker** / **Docker Desktop** if running containerized)

---

## Quick Start Guide

### 1. Clone and Install

Clone the repository and install dependencies for both `server` and `client` workspaces:

```bash
git clone https://github.com/mohammed-adnan260/kenpathassignment.git
cd kenpathassignment
npm run install:all
```

*(This command executes `npm install` inside both `./server` and `./client`).*

### 2. Environment Configuration

Copy the example environment template to `.env` in the repository root:

```bash
cp .env.example .env
```

Review the `.env` settings. The default values match local development and Docker:

```env
PORT=4000
DATABASE_URL=postgresql://sweety:sweety@127.0.0.1:5432/sweety
JWT_SECRET=sweety-super-secret-jwt-key-for-development-only-replace-in-prod
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

### 3. Database Setup

You can use either a Docker-based PostgreSQL instance or your local PostgreSQL service:

#### Option A: Quick PostgreSQL via Docker (Recommended)
Start a standalone PostgreSQL container with the correct credentials:

```bash
docker compose up -d db
```

#### Option B: Local PostgreSQL Installation
If using a native PostgreSQL service, create the database and user:

```bash
psql -U postgres -c "CREATE USER sweety WITH PASSWORD 'sweety';"
psql -U postgres -c "CREATE DATABASE sweety OWNER sweety;"
```

#### Initialize Database Schema
Run the migration script to create the `users` and `readings` tables with all constraints and indices:

```bash
npm run db:init
```

*(Note: The server also auto-verifies and applies the schema on startup if the tables do not exist).*

### 4. Seed Sample Data

Populate the database with the demo account and ~70 days of realistic blood glucose readings:

```bash
npm run db:seed
```

### 5. Run the Application

Launch both the Express API and the Vite React client concurrently with **one single command**:

```bash
npm run dev
```

- **Frontend Client**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:4000](http://localhost:4000)
- **Marketing / Landing Page**: [http://localhost:5173/welcome](http://localhost:5173/welcome)

*(Alternatively, you can run them in separate terminals with `npm run dev:server` and `npm run dev:client`).*

---

## Docker Deployment

To build and run the entire application (PostgreSQL + Express API + Static React Frontend) in containerized production mode:

```bash
# Build and spin up containers
docker compose up --build -d

# Seed initial demo data inside the container
docker compose exec app node scripts/seed.js
```

The application will be live at:
- **Full App (Docker)**: [http://localhost:4000](http://localhost:4000)

To stop the containers:
```bash
docker compose down
```

---

## Validation Rules

Validation rules are strictly verified on the client for immediate UX feedback and enforced on the server/database layer for absolute data integrity.

| Rule | Condition | Exact Error Message |
|---|---|---|
| **Value is required** | Input is empty or whitespace | `"Please enter a glucose value."` |
| **Valid whole number** | Non-integer, `< 40`, or `> 600` | `"Value must be between 40 and 600 mg/dl."` |
| **One reading per slot** | Slot already recorded for date | `"You already have an {Slot label} reading for this date."` |
| **Max 4 per day** | Daily ceiling reached | `"You can add only 4 readings per day."` |
| **Date not in future** | Date > user's current local date | `"Date cannot be in the future."` |

---

## Reporting Engine

The reports compute summary statistics:
$$\text{Average} = \text{round}\left(\frac{\sum \text{values}}{N}, 1\right)$$
along with the Highest, Lowest, and total Count. Friendly empty states are rendered when no readings exist.

| Report Type | Period Calculation | Example (Anchor: 15 Oct 2026) |
|---|---|---|
| **Daily** | The selected anchor date | `15 Oct 2026` |
| **Month-to-date** | 1st of month through selected date | `1 Oct – 15 Oct 2026` |
| **Monthly** | Full previous calendar month | `1 Sep – 30 Sep 2026` |

The Daily report additionally provides a slot-by-slot breakdown with clinical target classification.

---

## Running Tests

Sweety includes test suites covering both unit logic and end-to-end integration:

```bash
# Run all tests (Server + Client)
npm test

# Run server API tests only
npm --prefix server test

# Run React frontend tests only
npm --prefix client test
```

### Test Suite Highlights
- **Server Tests (35 passed)**: Run against an in-memory database (`pg-mem`) without requiring network connectivity. Covers authentication, password hashing, multi-tenant isolation, slot validation, edge-case leap years, and pagination.
- **Client Tests (16 passed)**: Uses Vitest and React Testing Library (`@testing-library/react`) to test form validation, instant error dismissal, API error mapping, and keyboard navigation.

---

## API Reference

All protected endpoints require the `token` cookie established on login.

### Authentication
- `POST /api/auth/register` — Register user `{ name, email, password, timezone? }`
- `POST /api/auth/login` — Sign in `{ email, password }` (sets `httpOnly` cookie)
- `POST /api/auth/logout` — Invalidate session and clear cookie
- `GET /api/auth/me` — Retrieve currently authenticated user profile

### Readings
- `GET /api/readings?page=1&limit=15&date=YYYY-MM-DD` — Paginated readings list
- `POST /api/readings` — Create reading `{ reading_date, time_slot, value_mgdl }`
- `GET /api/readings/:id` — Get single reading (404 if not owned by user)
- `PUT /api/readings/:id` — Update reading `{ reading_date, time_slot, value_mgdl }`
- `DELETE /api/readings/:id` — Delete reading (404 if not owned by user)

### Reports
- `GET /api/reports/daily?date=YYYY-MM-DD` — Daily stats & slot breakdown
- `GET /api/reports/month-to-date?date=YYYY-MM-DD` — Month-to-date statistics
- `GET /api/reports/monthly?date=YYYY-MM-DD` — Previous calendar month summary

---

## Project Architecture

```
kenpathassignment/
├── .env.example              # Environment variables template
├── docker-compose.yml        # Docker compose definition for DB & App
├── Dockerfile                # Production multi-stage Docker build
├── package.json              # Root package config (concurrently, test scripts)
├── client/                   # Frontend React + Vite application
│   ├── src/
│   │   ├── components/       # Layout, ReadingForm, Modal, TrendChart, Stats, Toast
│   │   ├── pages/            # Today, Readings, Reports, Login, Register, Landing
│   │   ├── lib/              # Dates, glucose validation helpers, summary calculations
│   │   ├── styles/           # Modern medical healthtech CSS tokens and animations
│   │   └── tests/            # Vitest + RTL tests for form and helpers
│   └── vite.config.js        # Vite config with API proxy to localhost:4000
└── server/                   # Backend Express + PostgreSQL API
    ├── db/
    │   └── schema.sql        # Table definitions, UNIQUE indices, CHECK constraints
    ├── scripts/
    │   ├── init-db.js        # Schema initialization runner
    │   └── seed.js           # Demo user and ~70 days reading generator
    ├── src/
    │   ├── routes/           # auth.js, readings.js, reports.js
    │   ├── middleware/       # JWT verification & ownership middleware
    │   ├── lib/              # Validation, date calculations, SQL helpers
    │   └── app.js            # Express application setup
    └── tests/                # 35 Vitest + Supertest integration tests
```

---

## Notes

### Assumptions

- **Timezone Awareness**: "Future" is determined relative to the user's registered timezone (captured via `Intl.DateTimeFormat().resolvedOptions().timeZone` during sign-up), ensuring patients logging readings past midnight in their local time are not falsely rejected.
- **Date Storage as Canonical Strings**: Dates are maintained as strict `YYYY-MM-DD` strings end-to-end from HTML inputs to PostgreSQL `DATE` columns, preventing timezone drift or off-by-one errors.
- **Report Date Boundaries**:
  - **Daily**: Covers exclusively the selected anchor date.
  - **Month-to-date**: Covers the 1st of the month through the selected anchor date.
  - **Monthly**: Covers the full previous calendar month relative to the selected anchor date (e.g., Selecting `15 Oct 2026` generates the report for `1 Sep – 30 Sep 2026`). Future report dates are allowed (returning 0 readings); only reading creation/edits cannot be dated in the future.
- **Single Unit System**: Readings are recorded in `mg/dl` as whole numbers between 40 and 600 (without unit conversion toggles).
- **Daily Ceiling vs. Slot Constraint**: With exactly 4 slots per day and 1 reading per slot, the 4th reading naturally fills the day. Both constraints are enforced in the schema (`UNIQUE (user_id, reading_date, time_slot)` and a max-4 check during inserts).
- **Session Security**: Authentication tokens are stored exclusively in `httpOnly, SameSite=Lax` cookies rather than `localStorage` to safeguard against cross-site scripting (XSS) token exfiltration.
- **Clinical Target Guidance**: The "In target / High / Low" status badges use standard American Diabetes Association (ADA) guidance (fasting 70–130 mg/dl, post-meal < 180 mg/dl) as visual aids for the patient.

### What I'd Improve with More Time

- **Redis Caching Layer**: Cache computed monthly and month-to-date report aggregates in Redis, invalidated automatically whenever a reading is created, updated, or deleted.
- **Background Jobs with BullMQ**: Implement scheduled cron reminders (e.g. at 8:00 PM) notifying users who have logged fewer than 4 readings for the day.
- **Healthcare Provider / Doctor Role**: Extend role-based access control (RBAC) allowing physicians to monitor assigned patients' daily reports and glycemic trajectory charts.
- **End-to-End Test Suite**: Add automated Playwright or Cypress browser test suites verifying complete patient flows across login, form validation, error states, and report generation.
- **Export & Print Formats**: Add clean PDF and CSV export utilities formatted specifically for physician consultations.
- **Offline Sync & PWA Support**: Implement service worker caching and IndexedDB offline queueing to allow patients to record readings without an active internet connection.
