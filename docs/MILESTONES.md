# Clinicyza — revised milestone plan

Rebuilt from *Clinicyza Build Specification v1.0* to match what already exists
(3 separate repos, auth for all three portals, basic portal shells, website pages).
Translations / i18n are **removed** from the plan for now (product owner decision).
Folder structure of the three repos stays as it is; new features add folders inside it.

| # | Milestone | Covers spec | Status |
|---|---|---|---|
| **M1** | **Foundation & design tokens** | M0 (minus i18n) + spec §2 tokens | ✅ Done — see STATUS.md |
| M2 | Design system & portal shells | M1 | Next — needs Patient/Doctor/Admin design PDFs |
| M3 | Authentication completion, roles & RBAC | M2 | |
| M4 | Website completion & content management | M3 (no translations) | |
| M5 | Catalogue, doctor profiles & availability | M4 | |
| M6 | Booking, payments (Revolut), coupons & refunds | M5 | |
| M7 | Video consultations (Daily.co) | M6 | |
| M8 | Doctor clinical workspace & documents | M7 | |
| M9 | Patient health hub | M8 | |
| M10 | Chat system (patient, doctor, admin) | M9 | |
| M11 | Notifications & email | M10 | |
| M12 | Admin operations, people & revenue | M11 | |
| M13 | Quick services | M12 | |
| M14 | Care programmes, physical clinic & clinical audit | M13 | |
| M15 | Hardening & launch (no translations) | M14 | |

Public launch (MVP) = M1–M12 + M15. M13 and M14 can follow as updates.

## M2 · Design system & portal shells (next)
- Complete shared components (spec M1): destructive/icon buttons, multi-select, date-range, tag input,
  segmented control, tabs, status badge, delta chip, KPI card with sparkline + skeleton, chart wrappers,
  data table (sort, column chooser, sticky column, bulk bar, density, saved views), filter bar, drawer,
  type-to-confirm modal, toast with undo, timeline row, file dropzone.
- Doctor components (identity strip, allergy/interaction alerts, signature pad, A4 preview, video tile) and
  patient components (appointment card, document card, medication card, time-slot picker, bottom sheet,
  emergency banner); chat bubbles.
- Shells: admin (navy sidebar 272 → 76px collapsible, ⌘K palette, Create menu, bell), doctor (navy sidebar,
  availability card, grouped nav), patient (white sidebar, mobile bottom tabs with raised Book button,
  persistent emergency line). Sidebar collapse persisted per user.
- `/dev/ui` page (development only) rendering every component and state.
- Acceptance: components match the designs; shells work at 1440/1024/390 with no horizontal scroll;
  logical tab order + visible focus ring; ⌘K opens the palette; the old design brand name appears nowhere.

## M3 · Authentication completion, roles & RBAC
Patient sign-up (2 steps, 18+ check, 6-digit email code), doctor & admin TOTP 2FA, admin lockout after
5 failures, "remember this device" 30 days, doctor application review → doctor account + set-password,
admin roles × modules permission matrix, permission-denied screen, sessions screen with force logout,
rate limiting on auth, AuditLog.
