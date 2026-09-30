# The Clinic

Arabic-first healthcare navigation platform: patients find doctors, book real appointments, and get guided by SAL, an AI care-navigation assistant. Doctors manage their availability and appointments; administrators run the catalog and the knowledge base.

Next.js (App Router, TypeScript, Tailwind) frontend · FastAPI backend · Supabase (PostgreSQL + pgvector + Auth + Storage) · Gemini API.

## Architecture

```
Next.js frontend (port 3107)
        │  /api/* proxy (src/app/api/[...path]/route.ts)
        ▼
FastAPI backend (port 8000, backend/app)
        │  service_role key, server-side only
        ▼
Supabase ──── PostgreSQL + RLS + pgvector + Storage buckets
        └──── Gemini API (SAL chat + embeddings)
```

- The browser never talks to Supabase or Gemini directly. All data access goes through FastAPI, which authenticates users with HttpOnly session cookies and server-verified roles.
- The Next.js route at `src/app/api/[...path]/route.ts` forwards `/api/*` to the backend, forwards cookies, and adds security headers.
- All writes go through transactional Postgres functions (`clinic_*`) that re-check roles, ownership, slot locks and transitions — the API layer cannot be bypassed.

## Project layout

```
backend/app/            FastAPI application
    main.py             app setup, CSRF-origin middleware, error handlers
    config.py           settings from backend/.env
    database.py         Supabase client factory + audit helper
    auth/               register, login, confirm, refresh, logout, profile, roles
    doctors/            public search/detail, doctor self-service, admin CRUD
    services/           public + admin services and specialties
    appointments/       booking, listings, status transitions
    payments/           PaymentService abstraction + TestPaymentProvider
    sal/                SAL chat (Gemini), conversations, history
    knowledge/          RAG ingestion + vector search
    storage/            private file upload/download per account
backend/tests/          security unit tests (pytest)
src/app/                Next.js routes (public pages, /auth, /dashboard, /admin, /api proxy)
src/components/         UI + feature components (provider, auth guard, admin, SAL, booking…)
src/lib/api/            typed frontend API clients (auth, doctors, services, appointments, sal, admin)
supabase/migrations/    additive database migration (columns, indexes, clinic_* functions, RLS)
tests/flows.spec.ts     Playwright smoke suite for the real app
```

## Setup

### 1. Frontend

Requires Node.js 22+.

```sh
npm ci
cp .env.example .env.local        # optional; BACKEND_URL defaults to http://127.0.0.1:8000
npm run dev                       # http://127.0.0.1:3107
```

### 2. Backend

Requires Python 3.12+.

```sh
cd backend
python -m venv venv
venv/Scripts/pip install -r requirements.txt      # Windows
# venv/bin/pip install -r requirements.txt        # macOS/Linux
cp .env.example .env                              # then fill in the real values
venv/Scripts/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Interactive API docs: http://127.0.0.1:8000/docs

### 3. Environment variables

`backend/.env` (see `backend/.env.example`):

| Variable | Purpose |
| --- | --- |
| `SUPABASE_URL` | Project URL (Dashboard → Project Settings → API) |
| `SUPABASE_SECRET_KEY` | `service_role` secret key — server only, never commit |
| `GEMINI_API_KEY` | Google AI Studio key for SAL and embeddings |
| `APP_ORIGIN` | Frontend origin, used for CSRF origin checks and email-confirmation redirects |
| `COOKIE_SECURE` | `true` when served over HTTPS |
| `PAYMENT_PROVIDER` | `disabled` (default) or `test` |

`.env.local` (frontend): `BACKEND_URL` — where the proxy sends `/api/*`.

Secrets are loaded only from environment variables; never print them, commit them, or expose them to the frontend.

### 4. Database (Supabase)

The base schema (profiles, specialties, doctors, doctor_locations, services, doctor_services, availability_slots, appointments, payments, sal_conversations, sal_messages, knowledge_documents, knowledge_chunks, audit_logs) already exists in the Supabase project.

The additive migration in `supabase/migrations/20260925222717_clinic_fullstack_integrity.sql` must be applied **once**. It adds booking/payment/knowledge columns, performance indexes, the transactional `clinic_*` functions, and locks all tables down to the service role. Booking, SAL, payments and knowledge features return "Database upgrade is required" until it is applied.

To apply it, either paste the file into **Supabase Dashboard → SQL Editor → Run**, or link the CLI and push:

```sh
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```

Also check in **Dashboard → Auth → URL Configuration** that the redirect URL list contains `http://127.0.0.1:3107/auth/confirm` (and the production origin later), so email-confirmation links work.

### 5. Gemini

Set `GEMINI_API_KEY` in `backend/.env`. SAL uses `gemini-2.5-flash` with a JSON response schema; the knowledge base uses `gemini-embedding-001` (1536-dim, retrieved via the `clinic_match_knowledge` pgvector function). Models and the clinic timezone are overridable in `backend/.env`.

## Features by role

### Patient (`/dashboard`, `/sal`, `/booking/[id]`)
- Register with email confirmation, sign in/out, edit profile and language.
- Search doctors (specialty, city, language, consultation type, free text), view profiles and real availability.
- Book a service + slot (idempotent via a client request key; double-booking and overlapping appointments are rejected by the database).
- Chat with SAL: organizes concerns, suggests a specialty filter and real doctors, flags urgent situations, cites knowledge-base sources. Rate-limited, conversations saved per account.
- Upload private documents (per-account storage, signed download URLs).

### Doctor (`/doctor-dashboard`)
- Manage professional profile (edits go back to `pending` for administrator review).
- Add/remove availability slots (Jerusalem timezone, overlap-checked).
- View appointments, confirm pending requests, complete or cancel visits.
- Upload doctor documents.

### Administrator (`/admin/*`, roles: `admin`, `super_admin`)
- **Doctors**: create/update doctors (with linked doctor accounts, services, clinic location), approve or deactivate. New doctor profiles need approval to appear publicly.
- **Services & specialties**: trilingual CRUD, active/inactive.
- **Knowledge base**: upload PDF/DOCX/TXT (≤ 8 MB), automatic chunking → Gemini embeddings → pgvector; activate, replace, or delete documents.
- **Appointments**: view all bookings.
- Every admin mutation writes an audit-log row.

## API overview

Full interactive documentation at `/docs` (Swagger). Main groups:

| Method & path | Who | Purpose |
| --- | --- | --- |
| `POST /auth/register` · `/auth/login` · `/auth/confirm` · `/auth/refresh` · `/auth/logout` | public | Session lifecycle (HttpOnly cookies) |
| `GET/PATCH /auth/me` | signed in | Profile |
| `GET /doctors` · `/doctors/{id}` · `/doctors/{id}/availability` | public | Directory and real availability |
| `GET/PATCH /doctor/profile`, `GET/POST/DELETE /doctor/availability` | doctor | Self-service |
| `GET /services`, `GET /specialties` | public | Active catalog |
| `POST/PATCH/DELETE /admin/services\|specialties\|doctors…` | admin | Catalog management |
| `POST /appointments` | patient | Book (transactional, idempotent) |
| `GET /patient/appointments` · `/doctor/appointments` · `/admin/appointments` | role-scoped | Listings |
| `PATCH /appointments/{id}` | participant/admin | Status transitions (pending → confirmed → completed / cancelled) |
| `POST /sal/chat`, `GET /sal/conversations[/{id}]` | patient | SAL navigation assistant |
| `POST /admin/knowledge`, `PATCH /admin/knowledge/{id}`, `DELETE …`, `POST …/{id}/replace` | admin | RAG knowledge base |
| `POST /payments`, `POST /payments/{id}/verify\|refund` | patient/admin | Payment abstraction (disabled unless `PAYMENT_PROVIDER=test`) |
| `GET/POST /files/{bucket}`, `GET /files/{bucket}/download` | owner | Private file storage |

Error handling: validation errors never echo input; Postgres constraint violations map to 403/409/503 responses; unexpected failures return a generic 503.

## Knowledge base workflow

1. Admin opens `/admin/knowledge`, uploads a PDF/DOCX/TXT with title, language, optional doctor/specialty tags.
2. The backend extracts text (pypdf / python-docx / UTF-8), chunks it (~1800 chars with overlap), embeds chunks with Gemini, stores vectors in `knowledge_chunks` with metadata, and marks the document `completed`.
3. SAL retrieves the top matching chunks (cosine similarity ≥ 0.35) for a patient question and cites only the sources it used.
4. Documents can be deactivated, replaced, or deleted (chunks and storage object removed).

## Doctor onboarding

1. The doctor registers through `/auth` (creating a `patient`-role account by default).
2. An administrator opens `/admin/doctors`, creates the doctor record, and links the account via the **doctor account** selector — this upgrades the profile role to `doctor`.
3. The doctor signs in, completes the professional profile and availability in `/doctor-dashboard`.
4. The administrator approves the doctor; the profile then appears in the public directory.

## Tests

Backend security unit tests:

```sh
cd backend && venv/Scripts/python -m pytest tests/ -q
```

Frontend typecheck, lint, production build:

```sh
npm run typecheck && npm run lint && npm run build
```

Playwright smoke suite (needs the backend on :8000 and the frontend on :3107 running):

```sh
npx playwright install chromium
npm run test:e2e
```

To use an existing Chrome installation instead of Playwright Chromium, set `PLAYWRIGHT_CHANNEL=chrome`.

## Security model

- HttpOnly `SameSite=Lax` cookies carry short-lived access + refresh tokens; the frontend auto-refreshes on 401.
- Mutating requests require an exact same-origin `Origin` header (CSRF).
- Roles come from the server-side `profiles` table on every request; role assignment cannot be influenced by client metadata.
- RLS is enabled and all direct `anon`/`authenticated` table and function access is revoked — the FastAPI service role is the only write path.
- Uploads are type- and size-validated (avatars are re-encoded PNG/JPEG only), stored under per-user paths, and downloads are owner-checked signed URLs.

## Protected brand assets

The two original PNG files at the project root remain untouched. Exact copies are served from `public/brand/`. Both have alpha transparency.

| Original | Role | Dimensions | SHA-256 |
| --- | --- | --- | --- |
| `logo.png` | Primary The Clinic wordmark; header and footer | 1672 × 941 | `1396DD8BA1BAF91D31698CBE7C2FA63EC574DEC86FE96A3B9ABA27A62D896659` |
| `sal.png` | SAL standalone mark; assistant, journey, loading, mobile navigation, favicon/apple icon | 1254 × 1254 | `17704C3DFA42C763F8BF8D2C7B58E137AC71DB025B74FC4CE5DDED60D43C6E40` |

The wordmark component displays the complete original transparent canvas with proportional sizing and no clipping. SAL's standalone mark is the app icon. Doctor avatars are initials placeholders until real photos are approved. See `docs/image-generation.md` for the generated consultation photo's source.

## Production checklist

- Serve over HTTPS and set `COOKIE_SECURE=true`, `APP_ORIGIN=https://your-domain`, and the frontend `BACKEND_URL`.
- Add the production origin to Supabase Auth redirect URLs.
- Point the Next.js proxy (or a reverse proxy) at the deployed backend.
- Switch `PAYMENT_PROVIDER` only when a real gateway (Tranzila / Grow / CardCom) is implemented behind the existing `PaymentProvider` interface.
