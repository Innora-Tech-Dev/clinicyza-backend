/**
 * Single place to read server environment variables (.env.local).
 * Fails fast on missing required values so misconfiguration is obvious.
 */

const required = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

const number = (name, fallback) => {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

export const env = {
  isProduction: process.env.NODE_ENV === "production",
  isDevelopment: process.env.NODE_ENV === "development",
  appName: process.env.APP_NAME || "Clinicyza",

  get mongoUri() {
    return required("MONGODB_URI");
  },
  mongoDbName: process.env.MONGODB_DB_NAME || "clinicyza",

  get jwtAccessSecret() {
    return required("JWT_ACCESS_SECRET");
  },
  get jwtRefreshSecret() {
    return required("JWT_REFRESH_SECRET");
  },
  accessTokenTtlMinutes: number("ACCESS_TOKEN_TTL_MINUTES", 15),
  refreshTokenTtlDays: number("REFRESH_TOKEN_TTL_DAYS", 30),
  passwordResetTtlMinutes: number("PASSWORD_RESET_TTL_MINUTES", 30),

  cookieDomain: process.env.COOKIE_DOMAIN || undefined,
  corsOrigins: (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
  portalsUrl: process.env.PORTALS_URL || "http://localhost:3002",

  // ---- Logging & monitoring ----
  logLevel: process.env.LOG_LEVEL || "info",
  apiLogEnabled: process.env.API_LOG_ENABLED !== "false",

  // ---- Realtime (WebSocket) server ----
  realtimePort: number("REALTIME_PORT", 8001),
  /** Public URL clients connect to; empty = realtime disabled (e.g. on Vercel today). */
  realtimePublicUrl: process.env.REALTIME_PUBLIC_URL || "",
  /** Where the API reaches the realtime server to broadcast events. */
  realtimeInternalUrl: process.env.REALTIME_INTERNAL_URL || "",
  get realtimeInternalSecret() {
    return required("REALTIME_INTERNAL_SECRET");
  },
  realtimeTicketTtlSeconds: number("REALTIME_TICKET_TTL_SECONDS", 60),

  // ---- Background worker ----
  workerPollMs: number("WORKER_POLL_MS", 2000),
  workerConcurrency: number("WORKER_CONCURRENCY", 4),

  // ---- Email (SMTP). Empty SMTP_HOST = print emails to the console. ----
  smtpHost: process.env.SMTP_HOST || "",
  smtpPort: number("SMTP_PORT", 1025),
  smtpUser: process.env.SMTP_USER || "",
  smtpPass: process.env.SMTP_PASS || "",
  smtpSecure: process.env.SMTP_SECURE === "true",
  emailFrom: process.env.EMAIL_FROM || "Clinicyza <no-reply@clinicyza.com>",
  emailReplyTo: process.env.EMAIL_REPLY_TO || "care@clinicyza.com",
};
