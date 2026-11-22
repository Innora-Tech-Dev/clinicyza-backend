import crypto from "node:crypto";
import { after } from "next/server";
import { ZodError } from "zod";
import { ROLE_LIST, CLIENT_HEADER, WEB_CLIENT } from "@/constants/roles";
import { env } from "@/config/env";
import { connectDB } from "@/lib/db/connect";
import { logger } from "@/lib/logger";
import { reportError } from "@/lib/monitoring/reportError";
import { ApiLog } from "@/models/ApiLog";
import { ApiError } from "./ApiError";
import { fail } from "./response";

/** Map a thrown error to the standard error envelope. Unexpected errors become a generic 500. */
export function toErrorResponse(error) {
  if (error instanceof ApiError) {
    return fail(error.status, error.code, error.message, error.details);
  }
  if (error instanceof ZodError) {
    const details = error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
    return fail(422, "VALIDATION_ERROR", "Some fields are invalid", details);
  }
  return fail(500, "INTERNAL_ERROR", "Something went wrong. Please try again.");
}

/** "/api/v1/doctor/me" → "doctor" */
export function roleFromPath(pathname) {
  const segment = pathname.split("/")[3];
  return ROLE_LIST.includes(segment) ? segment : null;
}

/** Run work after the response is sent; falls back to fire-and-forget outside Next. */
function runAfter(task) {
  const safe = () => Promise.resolve().then(task).catch(() => {});
  try {
    after(safe);
  } catch {
    safe();
  }
}

/**
 * Wraps a route handler:
 *  - gives every request an id (returned as the X-Request-Id header),
 *  - converts thrown ApiError / ZodError into the standard error envelope,
 *  - reports unexpected errors (ErrorLog + structured log) behind a generic 500,
 *  - writes an ApiLog row after the response has been sent.
 */
export function handler(fn) {
  return async (request, context) => {
    const startedAt = performance.now();
    const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
    const { pathname } = new URL(request.url);

    let response;
    let errorCode;
    try {
      response = await fn(request, context);
    } catch (error) {
      response = toErrorResponse(error);
      errorCode = error instanceof ApiError ? error.code : error instanceof ZodError ? "VALIDATION_ERROR" : "INTERNAL_ERROR";
      if (errorCode === "INTERNAL_ERROR") {
        runAfter(() => reportError(error, { source: "api", requestId, method: request.method, path: pathname }));
      }
    }

    response.headers.set("X-Request-Id", requestId);
    const durationMs = Math.round(performance.now() - startedAt);
    const entry = {
      requestId,
      method: request.method,
      path: pathname,
      status: response.status,
      durationMs,
      role: roleFromPath(pathname),
      client: request.headers.get(CLIENT_HEADER) === WEB_CLIENT ? "web" : "mobile",
      errorCode,
    };
    logger.debug("request", entry);

    if (env.apiLogEnabled) {
      runAfter(async () => {
        await connectDB();
        await ApiLog.create({
          ...entry,
          ip: request.headers.get("x-forwarded-for")?.split(",")[0].trim(),
          userAgent: request.headers.get("user-agent")?.slice(0, 500),
        });
      });
    }
    return response;
  };
}

/** Parse a JSON body, turning malformed JSON into a 400 instead of a 500. */
export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    throw ApiError.badRequest("Request body must be valid JSON", "INVALID_JSON");
  }
}
