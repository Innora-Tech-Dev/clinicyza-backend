import { connectDB } from "@/lib/db/connect";
import { Job } from "@/models/Job";

const KEEP_FINISHED_MS = 14 * 24 * 60 * 60 * 1000;
/** A running job whose worker died is picked up again after this long. */
export const STALE_LOCK_MS = 5 * 60 * 1000;

/** Delay before retry n (1-based): 30s, 2m, 8m, 32m… capped at 6h. */
export function retryDelayMs(attempt) {
  return Math.min(30_000 * 4 ** (attempt - 1), 6 * 60 * 60 * 1000);
}

/**
 * Queue a job. Returns the job, or null when a job with the same dedupeKey
 * is already queued/running.
 *   await enqueue("email.send", { to, subject, text }, { maxAttempts: 8 });
 */
export async function enqueue(name, payload = {}, { runAt = new Date(), maxAttempts = 5, dedupeKey } = {}) {
  await connectDB();
  try {
    return await Job.create({ name, payload, runAt, maxAttempts, ...(dedupeKey && { dedupeKey }) });
  } catch (error) {
    if (error?.code === 11000 && dedupeKey) return null;
    throw error;
  }
}

/** Atomically claim the next due job (or a running one whose lock went stale). */
export async function claimNext(workerId, now = new Date()) {
  return Job.findOneAndUpdate(
    {
      $or: [
        { status: "queued", runAt: { $lte: now } },
        { status: "running", lockedAt: { $lte: new Date(now.getTime() - STALE_LOCK_MS) } },
      ],
    },
    { $set: { status: "running", lockedAt: now, lockedBy: workerId }, $inc: { attempts: 1 } },
    { sort: { runAt: 1 }, returnDocument: "after" },
  );
}

export async function markSucceeded(job) {
  const now = new Date();
  await Job.updateOne(
    { _id: job._id },
    {
      $set: { status: "succeeded", finishedAt: now, expireAt: new Date(now.getTime() + KEEP_FINISHED_MS) },
      $unset: { lockedAt: 1, lockedBy: 1, active: 1 },
    },
  );
}

/** Retry later, or mark failed once maxAttempts is reached. Returns "retry" | "failed". */
export async function markFailed(job, error) {
  const now = new Date();
  const lastError = String(error?.message || error).slice(0, 2000);
  if (job.attempts < job.maxAttempts) {
    await Job.updateOne(
      { _id: job._id },
      {
        $set: { status: "queued", runAt: new Date(now.getTime() + retryDelayMs(job.attempts)), lastError },
        $unset: { lockedAt: 1, lockedBy: 1 },
      },
    );
    return "retry";
  }
  await Job.updateOne(
    { _id: job._id },
    {
      $set: { status: "failed", finishedAt: now, lastError, expireAt: new Date(now.getTime() + KEEP_FINISHED_MS) },
      $unset: { lockedAt: 1, lockedBy: 1, active: 1 },
    },
  );
  return "failed";
}
