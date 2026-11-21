import { ZodError } from "zod";
import { ApiError } from "./ApiError";
import { fail } from "./response";

/**
 * Wraps a route handler: converts thrown ApiError / ZodError into the standard
 * error envelope and hides unexpected errors behind a generic 500.
 */
export function handler(fn) {
  return async (request, context) => {
    try {
      return await fn(request, context);
    } catch (error) {
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
      console.error("[api] Unhandled error:", error);
      return fail(500, "INTERNAL_ERROR", "Something went wrong. Please try again.");
    }
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
