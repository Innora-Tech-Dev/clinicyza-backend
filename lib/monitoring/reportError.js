import { connectDB } from "@/lib/db/connect";
import { logger, serializeError } from "@/lib/logger";
import { ErrorLog } from "@/models/ErrorLog";

/**
 * Single entry point for unexpected errors (API, worker, realtime).
 * 1. Logs a structured error line (picked up by the host's log drain).
 * 2. Stores an ErrorLog row for Admin › Logs › Error.
 * An external monitoring service (e.g. Sentry) plugs in here later — see docs/DECISIONS.md.
 * Never throws: monitoring must not break the request that failed.
 */
export async function reportError(error, { source = "api", requestId, method, path, context } = {}) {
  const err = error instanceof Error ? error : new Error(String(error));
  logger.error(err.message, { source, requestId, method, path, context, error: serializeError(err) });

  try {
    await connectDB();
    await ErrorLog.create({
      source,
      name: err.name,
      message: err.message.slice(0, 2000),
      stack: err.stack?.slice(0, 10000),
      requestId,
      method,
      path,
      context,
    });
  } catch (storeError) {
    logger.warn("could not store ErrorLog", { error: serializeError(storeError) });
  }
}
