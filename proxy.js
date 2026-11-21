import { NextResponse } from "next/server";

/**
 * CORS for the API.
 * Browsers (web portals) must be on the CORS_ORIGINS allow-list; credentials (cookies) are allowed.
 * Mobile apps don't send an Origin header, so CORS doesn't apply to them.
 */
const allowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const CORS_HEADERS = {
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Max-Age": "600",
};

export function proxy(request) {
  const origin = request.headers.get("origin");
  const isAllowed = origin && allowedOrigins.includes(origin);

  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: isAllowed ? 204 : 403,
      headers: isAllowed
        ? { "Access-Control-Allow-Origin": origin, Vary: "Origin", ...CORS_HEADERS }
        : { Vary: "Origin" },
    });
  }

  const response = NextResponse.next();
  response.headers.set("Vary", "Origin");
  if (isAllowed) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    Object.entries(CORS_HEADERS).forEach(([key, value]) => response.headers.set(key, value));
  }
  return response;
}

export const config = {
  matcher: "/api/:path*",
};
