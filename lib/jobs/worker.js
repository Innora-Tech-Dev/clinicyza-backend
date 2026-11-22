import os from "node:os";
import { env } from "@/config/env";
import { connectDB } from "@/lib/db/connect";
import { logger } from "@/lib/logger";
import { reportError } from "@/lib/monitoring/reportError";
import { claimNext, enqueue, markFailed, markSucceeded } from "./queue";
import { getHandler, RECURRING_JOBS } from "./registry";

/**
 * Background worker loop: schedules recurring jobs, claims due jobs and runs up to
 * WORKER_CONCURRENCY of them at once. Returns stop() for graceful shutdown.
 */
export async function startWorker() {
  const workerId = `${os.hostname()}:${process.pid}`;
  const log = logger.child({ service: "worker", workerId });
  await connectDB();

  let stopping = false;
  const running = new Set();
  const lastScheduled = new Map();

  async function scheduleRecurring() {
    const now = Date.now();
    for (const { name, everyMs } of RECURRING_JOBS) {
      if (now - (lastScheduled.get(name) ?? 0) < everyMs) continue;
      lastScheduled.set(name, now);
      await enqueue(name, {}, { dedupeKey: `recurring:${name}`, maxAttempts: 1 });
    }
  }

  async function runJob(job) {
    const jobLog = log.child({ job: job.name, jobId: String(job._id), attempt: job.attempts });
    const fn = getHandler(job.name);
    try {
      if (!fn) throw new Error(`No handler registered for "${job.name}"`);
      await fn(job.payload, { job, log: jobLog });
      await markSucceeded(job);
      jobLog.debug("job succeeded");
    } catch (error) {
      if (!fn) job.attempts = job.maxAttempts; // unknown job: don't retry
      const outcome = await markFailed(job, error);
      jobLog.warn(`job ${outcome === "retry" ? "failed, will retry" : "failed permanently"}`, {
        error: error.message,
      });
      if (outcome === "failed") {
        await reportError(error, { source: "worker", context: { job: job.name, jobId: String(job._id) } });
      }
    }
  }

  async function tick() {
    if (stopping) return;
    try {
      await scheduleRecurring();
      while (!stopping && running.size < env.workerConcurrency) {
        const job = await claimNext(workerId);
        if (!job) break;
        const task = runJob(job).finally(() => running.delete(task));
        running.add(task);
      }
    } catch (error) {
      await reportError(error, { source: "worker", context: { phase: "tick" } });
    }
  }

  const timer = setInterval(tick, env.workerPollMs);
  await tick();
  log.info("worker started", { pollMs: env.workerPollMs, concurrency: env.workerConcurrency });

  return async function stop() {
    stopping = true;
    clearInterval(timer);
    await Promise.allSettled(running);
    log.info("worker stopped");
  };
}
