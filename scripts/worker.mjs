/**
 * Background job worker.
 *   npm run worker            (also started by `npm run dev`)
 * Runs outside Next.js because jobs must keep running between requests.
 */
import "./register-alias.mjs";

process.env.CZ_SERVICE = "worker";
const mongoose = (await import("mongoose")).default;
const { startWorker } = await import("@/lib/jobs/worker");

const stop = await startWorker();

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, async () => {
    await stop();
    await mongoose.disconnect();
    process.exit(0);
  });
}
