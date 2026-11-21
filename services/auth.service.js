import mongoose from "mongoose";
import { env } from "@/config/env";
import { connectDB } from "@/lib/db/connect";
import { ApiError } from "@/lib/http/ApiError";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  randomToken, refreshTtlSeconds, sha256, signAccessToken, signRefreshToken, verifyRefreshToken,
} from "@/lib/auth/tokens";
import { sendEmail } from "@/lib/email/sendEmail";
import { PasswordReset } from "@/models/PasswordReset";
import { Session } from "@/models/Session";
import { User } from "@/models/User";

/** Public user shape returned by the API. */
export const toPublicUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  lastLoginAt: user.lastLoginAt ?? null,
});

async function issueTokens(user, sessionId) {
  const claims = { userId: user._id.toString(), role: user.role, sessionId: sessionId.toString() };
  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken(claims),
    signRefreshToken(claims),
  ]);
  return { accessToken, refreshToken };
}

async function createSession(user, meta) {
  const sessionId = new mongoose.Types.ObjectId();
  const tokens = await issueTokens(user, sessionId);
  await Session.create({
    _id: sessionId,
    user: user._id,
    role: user.role,
    refreshTokenHash: sha256(tokens.refreshToken),
    userAgent: meta.userAgent?.slice(0, 500),
    ip: meta.ip?.slice(0, 100),
    expiresAt: new Date(Date.now() + refreshTtlSeconds() * 1000),
  });
  return tokens;
}

/** Email + password sign-in for one portal. */
export async function login({ role, email, password, meta }) {
  await connectDB();
  const user = await User.findOne({ email, role }).select("+passwordHash");

  // Always run the hash compare (even for unknown emails) — same response time either way.
  const valid = await verifyPassword(password, user?.passwordHash);
  if (!user || !valid) {
    throw ApiError.unauthorized("Incorrect email or password", "INVALID_CREDENTIALS");
  }
  if (!user.isActive) throw ApiError.forbidden("This account has been disabled", "ACCOUNT_DISABLED");

  user.lastLoginAt = new Date();
  await user.save();

  const tokens = await createSession(user, meta);
  return { user: toPublicUser(user), tokens };
}

/**
 * Swap a refresh token for a new access + refresh token (rotation).
 * Re-using an old refresh token revokes the whole session (token theft protection).
 */
export async function refresh({ role, refreshToken, meta }) {
  if (!refreshToken) throw ApiError.unauthorized("Refresh token missing", "INVALID_TOKEN");
  const payload = await verifyRefreshToken(refreshToken, role);

  await connectDB();
  const session = await Session.findById(payload.sid);
  if (!session || session.revokedAt || session.expiresAt < new Date()) {
    throw ApiError.unauthorized("Your session has ended. Please sign in again.", "SESSION_REVOKED");
  }
  if (session.refreshTokenHash !== sha256(refreshToken)) {
    session.revokedAt = new Date();
    await session.save();
    throw ApiError.unauthorized("Your session has ended. Please sign in again.", "SESSION_REVOKED");
  }

  const user = await User.findById(payload.sub);
  if (!user || user.role !== role) throw ApiError.unauthorized();
  if (!user.isActive) throw ApiError.forbidden("This account has been disabled", "ACCOUNT_DISABLED");

  const tokens = await issueTokens(user, session._id);
  session.refreshTokenHash = sha256(tokens.refreshToken);
  session.lastUsedAt = new Date();
  if (meta.userAgent) session.userAgent = meta.userAgent.slice(0, 500);
  await session.save();

  return { user: toPublicUser(user), tokens };
}

/** End one session. Safe to call more than once. */
export async function logout({ sessionId }) {
  if (!sessionId || !mongoose.isValidObjectId(sessionId)) return;
  await connectDB();
  await Session.updateOne({ _id: sessionId, revokedAt: null }, { $set: { revokedAt: new Date() } });
}

/**
 * Start a password reset. Always succeeds from the caller's view —
 * never reveals whether the email is registered.
 * Returns the reset URL only so development can show it (never in production).
 */
export async function forgotPassword({ role, email }) {
  await connectDB();
  const user = await User.findOne({ email, role, isActive: true });
  if (!user) return { resetUrl: null };

  // Invalidate earlier unused links
  await PasswordReset.updateMany(
    { user: user._id, usedAt: null },
    { $set: { usedAt: new Date() } },
  );

  const token = randomToken();
  await PasswordReset.create({
    user: user._id,
    role,
    tokenHash: sha256(token),
    expiresAt: new Date(Date.now() + env.passwordResetTtlMinutes * 60 * 1000),
  });

  const resetUrl = `${env.portalsUrl}/${role}/reset-password?token=${token}`;
  await sendEmail({
    to: user.email,
    subject: `Reset your ${env.appName} password`,
    text: `Hi ${user.name},\n\nUse this link to set a new password (valid for ${env.passwordResetTtlMinutes} minutes):\n${resetUrl}\n\nIf you didn't ask for this, you can ignore this email.`,
  });

  return { resetUrl };
}

/** Finish a password reset: set the new password and sign out every device. */
export async function resetPassword({ role, token, password }) {
  await connectDB();
  const reset = await PasswordReset.findOne({
    tokenHash: sha256(token),
    role,
    usedAt: null,
    expiresAt: { $gt: new Date() },
  });
  if (!reset) {
    throw ApiError.badRequest(
      "This reset link is invalid or has expired. Please request a new one.",
      "INVALID_RESET_TOKEN",
    );
  }

  const user = await User.findById(reset.user);
  if (!user || !user.isActive) {
    throw ApiError.badRequest("This reset link is invalid or has expired.", "INVALID_RESET_TOKEN");
  }

  user.passwordHash = await hashPassword(password);
  user.passwordChangedAt = new Date();
  await user.save();

  reset.usedAt = new Date();
  await reset.save();

  await Session.updateMany({ user: user._id, revokedAt: null }, { $set: { revokedAt: new Date() } });
}
