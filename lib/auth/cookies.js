import { env } from "@/config/env";
import { CLIENT_HEADER, WEB_CLIENT, cookieNames } from "@/constants/roles";
import { accessTtlSeconds, refreshTtlSeconds } from "./tokens";

const baseCookie = () => ({
  httpOnly: true,
  secure: env.isProduction,
  sameSite: "lax",
  path: "/",
  ...(env.cookieDomain && { domain: env.cookieDomain }),
});

/** Web portals send `X-Client: web`; mobile apps don't and receive tokens in the JSON body. */
export const isWebClient = (request) =>
  request.headers.get(CLIENT_HEADER)?.toLowerCase() === WEB_CLIENT;

/** Bearer header first (mobile), then the role's cookie (web). */
export function readAccessToken(request, role) {
  const header = request.headers.get("authorization");
  if (header?.startsWith("Bearer ")) return header.slice(7).trim();
  return request.cookies.get(cookieNames(role).access)?.value;
}

export function readRefreshCookie(request, role) {
  return request.cookies.get(cookieNames(role).refresh)?.value;
}

export function setAuthCookies(response, role, { accessToken, refreshToken }) {
  const names = cookieNames(role);
  response.cookies.set(names.access, accessToken, { ...baseCookie(), maxAge: accessTtlSeconds() });
  response.cookies.set(names.refresh, refreshToken, { ...baseCookie(), maxAge: refreshTtlSeconds() });
  return response;
}

export function clearAuthCookies(response, role) {
  const names = cookieNames(role);
  response.cookies.set(names.access, "", { ...baseCookie(), maxAge: 0 });
  response.cookies.set(names.refresh, "", { ...baseCookie(), maxAge: 0 });
  return response;
}
