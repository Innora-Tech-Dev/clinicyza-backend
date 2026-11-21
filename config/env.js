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
};
