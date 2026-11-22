/**
 * Structured logger — one JSON line per entry, so hosting log drains and search tools
 * can filter by field. In development the line is shortened for readability.
 *
 *   logger.info("payment confirmed", { appointmentId, orderId });
 *   const log = logger.child({ service: "worker" });
 */
const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };

const minLevel = () => LEVELS[process.env.LOG_LEVEL] ?? LEVELS.info;
const pretty = process.env.NODE_ENV !== "production";

function write(level, message, fields, base) {
  if (LEVELS[level] < minLevel()) return;
  const entry = { time: new Date().toISOString(), level, msg: message, ...base, ...fields };
  if (entry.error instanceof Error) entry.error = serializeError(entry.error);

  const stream = level === "error" || level === "warn" ? console.error : console.log;
  if (pretty) {
    const { time, level: lvl, msg, ...rest } = entry;
    const extra = Object.keys(rest).length ? ` ${JSON.stringify(rest)}` : "";
    stream(`${time.slice(11, 19)} ${lvl.toUpperCase().padEnd(5)} ${msg}${extra}`);
  } else {
    stream(JSON.stringify(entry));
  }
}

export function serializeError(error) {
  return { name: error.name, message: error.message, stack: error.stack, code: error.code };
}

function createLogger(base = {}) {
  return {
    debug: (msg, fields) => write("debug", msg, fields, base),
    info: (msg, fields) => write("info", msg, fields, base),
    warn: (msg, fields) => write("warn", msg, fields, base),
    error: (msg, fields) => write("error", msg, fields, base),
    child: (more) => createLogger({ ...base, ...more }),
  };
}

export const logger = createLogger({ service: process.env.CZ_SERVICE || "api" });
