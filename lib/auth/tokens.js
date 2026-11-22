import crypto from "node:crypto";
import { SignJWT, errors, jwtVerify } from "jose";
import { env } from "@/config/env";
import { ApiError } from "@/lib/http/ApiError";

const ISSUER = "clinicyza-api";
const encoder = new TextEncoder();
const accessKey = () => encoder.encode(env.jwtAccessSecret);
const refreshKey = () => encoder.encode(env.jwtRefreshSecret);

export const accessTtlSeconds = () => env.accessTokenTtlMinutes * 60;
export const refreshTtlSeconds = () => env.refreshTokenTtlDays * 24 * 60 * 60;

/** SHA-256 for storing refresh / reset tokens (never stored in plain text). */
export const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");

export const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString("base64url");

/**
 * Access token — short-lived, sent on every request.
 * `aud` is the role, so an admin endpoint rejects a patient's token.
 */
export function signAccessToken({ userId, role, sessionId }) {
  return new SignJWT({ role, sid: sessionId })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuer(ISSUER)
    .setAudience(role)
    .setIssuedAt()
    .setExpirationTime(`${accessTtlSeconds()}s`)
    .sign(accessKey());
}

/** Refresh token — long-lived, only used to get a new access token. */
export function signRefreshToken({ userId, role, sessionId }) {
  return new SignJWT({ role, sid: sessionId, typ: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuer(ISSUER)
    .setAudience(role)
    .setIssuedAt()
    .setExpirationTime(`${refreshTtlSeconds()}s`)
    .sign(refreshKey());
}

async function verify(token, key, role) {
  try {
    const { payload } = await jwtVerify(token, key, { issuer: ISSUER, audience: role });
    return payload;
  } catch (error) {
    if (error instanceof errors.JWTExpired) {
      throw ApiError.unauthorized("Your session has expired", "TOKEN_EXPIRED");
    }
    throw ApiError.unauthorized("Invalid or missing token", "INVALID_TOKEN");
  }
}

export const verifyAccessToken = (token, role) => verify(token, accessKey(), role);

/**
 * Realtime ticket — very short-lived, only accepted by the WebSocket server.
 * Clients swap their normal session for one right before opening a socket, so the
 * same flow works for web portals (cookies) and mobile apps (Bearer).
 */
const REALTIME_AUDIENCE = "realtime";

export function signRealtimeTicket({ userId, role, sessionId }) {
  return new SignJWT({ role, sid: sessionId, typ: "realtime" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuer(ISSUER)
    .setAudience(REALTIME_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${env.realtimeTicketTtlSeconds}s`)
    .sign(accessKey());
}

export async function verifyRealtimeTicket(token) {
  const payload = await verify(token, accessKey(), REALTIME_AUDIENCE);
  if (payload.typ !== "realtime") throw ApiError.unauthorized("Invalid realtime ticket", "INVALID_TOKEN");
  return payload;
}

export async function verifyRefreshToken(token, role) {
  const payload = await verify(token, refreshKey(), role);
  if (payload.typ !== "refresh") throw ApiError.unauthorized("Invalid refresh token", "INVALID_TOKEN");
  return payload;
}
