import { ApiError } from "@/lib/http/ApiError";
import { handler, readJson } from "@/lib/http/handler";
import { fail, ok } from "@/lib/http/response";
import { requireAuth } from "@/lib/auth/guard";
import {
  clearAuthCookies, isWebClient, readAccessToken, readRefreshCookie, setAuthCookies,
} from "@/lib/auth/cookies";
import { accessTtlSeconds, verifyAccessToken, verifyRefreshToken } from "@/lib/auth/tokens";
import {
  forgotPasswordSchema, loginSchema, refreshSchema, resetPasswordSchema,
} from "@/lib/validation/auth.schemas";
import * as authService from "@/services/auth.service";
import { env } from "@/config/env";

/**
 * Route handler factories — one implementation, used by all three portals:
 *   app/api/v1/(auth)/admin/login/route.js  →  export const POST = login(ROLES.ADMIN);
 */

const requestMeta = (request) => ({
  userAgent: request.headers.get("user-agent") ?? undefined,
  ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined,
});

/** Web → httpOnly cookies. Mobile → tokens in the JSON body. */
function tokenResponse(request, role, { user, tokens }, message) {
  if (isWebClient(request)) {
    return setAuthCookies(ok({ user, expiresIn: accessTtlSeconds() }, { message }), role, tokens);
  }
  return ok(
    {
      user,
      tokenType: "Bearer",
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: accessTtlSeconds(),
    },
    { message },
  );
}

/** POST /api/v1/{role}/login — { email, password } */
export const login = (role) =>
  handler(async (request) => {
    const body = loginSchema.parse(await readJson(request));
    const result = await authService.login({ role, ...body, meta: requestMeta(request) });
    return tokenResponse(request, role, result, "Signed in");
  });

/** POST /api/v1/{role}/refresh — { refreshToken } (mobile) or refresh cookie (web) */
export const refresh = (role) =>
  handler(async (request) => {
    const body = refreshSchema.parse(await readJson(request).catch(() => ({})));
    const refreshToken = body.refreshToken ?? readRefreshCookie(request, role);
    try {
      const result = await authService.refresh({ role, refreshToken, meta: requestMeta(request) });
      return tokenResponse(request, role, result);
    } catch (error) {
      if (error instanceof ApiError && isWebClient(request)) {
        // Clear dead cookies so the portal redirects to its login page
        return clearAuthCookies(fail(error.status, error.code, error.message), role);
      }
      throw error;
    }
  });

/** POST /api/v1/{role}/logout — ends the current session; always succeeds. */
export const logout = (role) =>
  handler(async (request) => {
    const body = await readJson(request).catch(() => ({}));
    let sessionId;

    const refreshToken = body?.refreshToken ?? readRefreshCookie(request, role);
    if (refreshToken) {
      sessionId = (await verifyRefreshToken(refreshToken, role).catch(() => null))?.sid;
    }
    if (!sessionId) {
      const accessToken = readAccessToken(request, role);
      if (accessToken) sessionId = (await verifyAccessToken(accessToken, role).catch(() => null))?.sid;
    }

    await authService.logout({ sessionId });
    return clearAuthCookies(ok(null, { message: "Signed out" }), role);
  });

/** GET /api/v1/{role}/me — the signed-in user */
export const me = (role) =>
  handler(async (request) => {
    const { user } = await requireAuth(request, role);
    return ok({ user: authService.toPublicUser(user) });
  });

/** POST /api/v1/{role}/forgot-password — { email } */
export const forgotPassword = (role) =>
  handler(async (request) => {
    const { email } = forgotPasswordSchema.parse(await readJson(request));
    const { resetUrl } = await authService.forgotPassword({ role, email });
    return ok(
      // The reset link is only exposed in development, to test without an email provider.
      env.isDevelopment && resetUrl ? { devResetUrl: resetUrl } : null,
      { message: "If an account exists for this email, we've sent a reset link." },
    );
  });

/** POST /api/v1/{role}/reset-password — { token, password } */
export const resetPassword = (role) =>
  handler(async (request) => {
    const body = resetPasswordSchema.parse(await readJson(request));
    await authService.resetPassword({ role, ...body });
    return clearAuthCookies(
      ok(null, { message: "Password updated. Please sign in with your new password." }),
      role,
    );
  });
