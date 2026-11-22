import mongoose from "mongoose";
import { sendEmail } from "@/lib/email/sendEmail";
import { logger } from "@/lib/logger";

/**
 * Job handlers by name. Each receives (payload, { job, log }) and throws to trigger a retry.
 * Later milestones add: "appointment.expire-hold", "appointment.reminder",
 * "appointment.no-show", "earnings.release", "chat.unread-email", …
 */
export const JOB_HANDLERS = {
  /** Send one email with retries (SMTP outage → backoff). */
  "email.send": async ({ to, subject, text, html }) => {
    await sendEmail({ to, subject, text, html });
  },

  /** Recurring liveness check — proves the worker and database are up. */
  "system.heartbeat": async (_payload, { log }) => {
    await mongoose.connection.db.admin().ping();
    log.debug("heartbeat ok");
  },
};

/**
 * Recurring jobs: the worker enqueues each one every `everyMs`
 * (deduplicated, so several workers never double-schedule).
 */
export const RECURRING_JOBS = [{ name: "system.heartbeat", everyMs: 60_000 }];

export function getHandler(name) {
  const fn = JOB_HANDLERS[name];
  if (!fn) logger.warn("no handler for job", { name });
  return fn;
}
