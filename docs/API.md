# Clinicyza API — v1

Base URL: `{BACKEND_URL}/api/v1` (local: `http://localhost:5050/api/v1`)

One API serves the web portals **and** the Android / iOS apps.
Every endpoint exists for each role — replace `{role}` with `admin`, `doctor` or `patient`.

## Response format

```json
// success
{ "success": true, "message": "optional", "data": { ... } }

// error
{ "success": false, "error": { "code": "INVALID_CREDENTIALS", "message": "Incorrect email or password", "details": [ { "field": "email", "message": "..." } ] } }
```

Use `error.code` in app logic; `error.message` is safe to show to users. `details` is only present on `VALIDATION_ERROR`.

## Authentication

| Client | How it sends the token | How it receives tokens |
|---|---|---|
| **Mobile apps** | `Authorization: Bearer <accessToken>` | In the JSON body (`accessToken`, `refreshToken`) — store in Keychain / EncryptedSharedPreferences |
| **Web portals** | httpOnly cookies, sent automatically (`credentials: "include"`) | Send header `X-Client: web` → tokens are set as cookies, never in the body |

- Access token: 15 minutes. Refresh token: 30 days.
- When a request returns `401` with `TOKEN_EXPIRED`, call `/{role}/refresh` once, then retry.
- Refresh tokens **rotate**: each refresh returns a new refresh token; the old one stops working. Re-using an old refresh token ends the session (theft protection).
- Tokens are bound to their role: an admin token is rejected by `/patient/...` endpoints.

## Endpoints

| Method | Path | Auth | Body | Returns |
|---|---|---|---|---|
| POST | `/{role}/login` | — | `{ email, password }` | `user`, tokens |
| POST | `/{role}/refresh` | — | `{ refreshToken }` (mobile) | `user`, new tokens |
| POST | `/{role}/logout` | — | `{ refreshToken }` (mobile) | `null` — always succeeds |
| GET | `/{role}/me` | ✅ | — | `{ user }` |
| POST | `/{role}/forgot-password` | — | `{ email }` | `null` — same response whether or not the email exists |
| POST | `/{role}/reset-password` | — | `{ token, password }` | `null` — signs out all devices |
| GET | `/{role}/dashboard` | ✅ | — | `{ user, stats[], ... }` |
| GET | `/api/health` | — | — | service + database status |

Password rules: 8–128 characters, at least one letter and one number.

### Login (mobile) — example

```http
POST /api/v1/patient/login
Content-Type: application/json

{ "email": "patient@clinicyza.test", "password": "Clinicyza123" }
```

```json
{
  "success": true,
  "message": "Signed in",
  "data": {
    "user": { "id": "…", "name": "Marco Bianchi", "email": "patient@clinicyza.test", "role": "patient", "lastLoginAt": "…" },
    "tokenType": "Bearer",
    "accessToken": "eyJ…",
    "refreshToken": "eyJ…",
    "expiresIn": 900
  }
}
```

### Password reset links

The email links to `{PORTALS_URL}/{role}/reset-password?token=…`.
Mobile apps can open the same URL as a universal link / app link and call `/{role}/reset-password` with the token.
**Email sending is not configured yet** — in development the link is printed in the server console and returned as `data.devResetUrl`.

## Error codes

| Code | Status | Meaning |
|---|---|---|
| `VALIDATION_ERROR` | 422 | Field errors in `details` |
| `INVALID_JSON` | 400 | Body isn't valid JSON |
| `INVALID_CREDENTIALS` | 401 | Wrong email / password (or wrong portal) |
| `UNAUTHORIZED` / `INVALID_TOKEN` | 401 | Missing or bad token → sign in |
| `TOKEN_EXPIRED` | 401 | Access token expired → refresh and retry |
| `SESSION_REVOKED` | 401 | Signed out / password changed → sign in |
| `ACCOUNT_DISABLED` | 403 | Account switched off by an admin |
| `INVALID_RESET_TOKEN` | 400 | Reset link used, expired, or for another portal |
| `INTERNAL_ERROR` | 500 | Unexpected — check server logs |

## Test accounts

`npm run seed` creates (password `Clinicyza123`):
`admin@clinicyza.test` · `doctor@clinicyza.test` · `patient@clinicyza.test`
