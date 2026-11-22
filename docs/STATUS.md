# Build status

## M1 · Foundation & design tokens — ✅ done (2026-11-22)

### Built
**Server (`clinicyza-server`)**
- One-command local start: `npm run dev` → API :8000 + background worker + realtime server :8001
  (+ Mailpit if installed). `npm run dev:all` also starts the website (:3001) and portals (:3002).
- Background worker (`scripts/worker.mjs`, `lib/jobs/`): MongoDB job queue with retries
  (30s → 2m → 8m … max 6h), dedupe keys, stale-lock recovery, recurring jobs. Jobs: `email.send`,
  `system.heartbeat` (every minute; shown in `/api/health`).
- Realtime server (`scripts/realtime.mjs`, `lib/realtime/`): Socket.IO, ticket authentication,
  private `user:<id>` / `role:<role>` rooms, revoked sessions disconnected within 30s,
  internal `/internal/emit` for API broadcasts (`lib/realtime/emit.js`).
- Structured JSON logging (`lib/logger.js`); every API request gets an `X-Request-Id` and an
  `ApiLog` row; unexpected errors are hidden behind a generic 500 and stored in `ErrorLog`.
- Platform settings (`Setting` model, `constants/settings.js`): marketing figures, contact,
  booking rules, commission (35%, range 30-40), chat and security rules — all editable, validated.
- Email over SMTP (nodemailer) with console fallback.
- Seed script `npm run seed`: indexes, default settings, demo users (idempotent).
- Unit tests `npm test` (19 tests: settings, job backoff, realtime tickets, error mapping).
- CI: `.github/workflows/ci.yml` (lint, tests, build) in all three repos.

**Web + portals**
- Spec §2 tokens: Space Grotesk 600 headings, card radius 16 / patient 20, inputs 12, canvas colours,
  info/neutral status colours, chart series colours, tabular numbers, table densities, sidebar widths.
- `EMERGENCY` constant (112 line); platform languages EN/IT/FR/ES/DE.
- Portals: `useRealtime` hook + "Live" indicator in the top bar (`NEXT_PUBLIC_REALTIME_ENABLED`).

### New API endpoints
`GET /api/v1/public/settings` · `GET|PATCH /api/v1/admin/settings` · `GET /api/v1/admin/logs/api` ·
`GET /api/v1/admin/logs/errors` · `POST /api/v1/{role}/realtime-token` · `GET /api/dev/error` (dev only)

### Stubbed / deferred
- Worker and realtime server are **not deployed** (local only, decision 5). On Vercel, keep
  `NEXT_PUBLIC_REALTIME_ENABLED=false` in portals and leave `REALTIME_*` unset on the server.
- External error monitoring (Sentry) — hardening milestone (decision 8).
- i18n — removed for now (decision 4).
- Admin pages for settings and logs — APIs exist; screens come with the admin operations milestone.
- Website still reads marketing figures from `src/data/stats.js`; switches to `/public/settings` in M4.
- "CI blocks merges" needs a branch-protection rule on GitHub (one-time setting, see ci.yml header).

### How to demo
1. `cd clinicyza-server && npm run dev:all`
2. http://localhost:8000/api/health → `worker.status: "running"`
3. Sign in at http://localhost:3002/doctor/login → "Live" badge in the top bar.
4. http://localhost:8000/api/dev/error → generic 500; the error appears in
   `GET /api/v1/admin/logs/errors` (admin token) and in the terminal.
5. Accounts: `admin|doctor|patient@clinicyza.test` / `Clinicyza123` (seed) or the `@gmail.com` accounts.
