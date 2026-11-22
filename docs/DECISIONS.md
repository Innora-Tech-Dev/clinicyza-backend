# Decisions

Questions raised while building and the choice made. Change a line here if the product owner disagrees.

| # | Date | Question | Decision |
|---|---|---|---|
| 1 | 2026-11-22 | Spec asks for one monorepo with a shared business-logic layer. | Keep **3 repos** (web, portals, server). Business rules (pricing, slots, refunds, chat) live only in `clinicyza-server`; web, portals and future mobile apps call its API. |
| 2 | 2026-11-22 | Spec lists Tailwind; the apps use antd. | Keep **antd + CSS variables + CSS modules**. No Tailwind. |
| 3 | 2026-11-22 | Spec tokens (§2) differ from the earlier UI PDF. | Spec wins: Space Grotesk 600 headings, Inter body, Instrument Serif accent, card radius 16 (patient 20), input radius 12, canvas #F8F6FC (patient #FBF8FF), info/neutral status colours, eyebrow tracking 0.08em. |
| 4 | 2026-11-22 | Internationalisation (5 locales). | **Removed for now** by the product owner. Platform languages (EN, IT, FR, ES, DE) stay as data, e.g. consultation language. |
| 5 | 2026-11-22 | Where do the WebSocket server and job worker run? Vercel can't host them. | **Local only for now.** They're plain Node processes (`npm run worker`, `npm run realtime`) ready to deploy to an EU host later. Production features must not depend on them until then. |
| 6 | 2026-11-22 | Job queue technology. | MongoDB-backed queue (`models/Job.js`): no extra infrastructure, atomic claim, exponential backoff, dedupe keys, stale-lock recovery. |
| 7 | 2026-11-22 | Realtime transport. | Socket.IO (client libraries exist for web, iOS and Android). Clients authenticate with a 60-second ticket from `POST /{role}/realtime-token`, so the same flow works for cookies (web) and Bearer tokens (mobile). |
| 8 | 2026-11-22 | Error monitoring service. | Errors go to the structured log + `ErrorLog` collection through `lib/monitoring/reportError.js`. An external service (e.g. Sentry, EU region) plugs into that one function in the hardening milestone. |
| 9 | 2026-11-22 | Spec asks for type checking; the project is JavaScript. | Stay on JavaScript. Quality gates: ESLint, unit tests (`node --test`), production build in CI. |
| 10 | 2026-11-22 | Local mail catcher. | Mailpit (`brew install mailpit`); `npm run dev` starts it automatically when installed. Without it, emails print to the console. |
| 11 | 2026-11-22 | Demo/seed names. | Use names from the design files (Dr. Marco Bellini, Laura Conti) for `@clinicyza.test` accounts. |
