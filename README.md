# Clinicyza Server

The Clinicyza API (Next.js route handlers), background worker and realtime server.
One API serves the website, the portals and the future iOS / Android apps.

## Getting started

Requires Node 22.15+.

```bash
cp .env.example .env.local   # fill in MONGODB_URI, JWT secrets, REALTIME_INTERNAL_SECRET
npm install
npm run seed                 # indexes, default settings, demo accounts
npm run dev                  # API :8000 + worker + realtime :8001 (+ Mailpit if installed)
npm run dev:all              # …plus ../clinicyza-web (:3001) and ../clinicyza-portals (:3002)
```

Optional local mail catcher: `brew install mailpit`, set `SMTP_HOST=localhost`, inbox at http://localhost:8025.

| Command | What it does |
|---|---|
| `npm run dev` | API, worker and realtime server together |
| `npm run dev:api` | API only |
| `npm run worker` / `npm run realtime` | One process on its own |
| `npm test` | Unit tests (`tests/*.test.js`) |
| `npm run lint` / `npm run build` | Same checks as CI |
| `npm run seed` | Safe to re-run; never overwrites data |

## Docs

- [docs/API.md](docs/API.md) — endpoints, auth, realtime, error codes
- [docs/MILESTONES.md](docs/MILESTONES.md) — build plan
- [docs/STATUS.md](docs/STATUS.md) — what's built, what's stubbed, how to demo
- [docs/DECISIONS.md](docs/DECISIONS.md) — decisions and assumptions
