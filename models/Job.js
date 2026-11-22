import mongoose from "mongoose";

/**
 * Background job queue stored in MongoDB (no extra infrastructure).
 * The worker (scripts/worker.mjs) claims due jobs atomically, runs them and retries
 * failures with exponential backoff. Finished jobs are deleted after 14 days.
 */
const jobSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: {
      type: String,
      enum: ["queued", "running", "succeeded", "failed"],
      default: "queued",
    },
    runAt: { type: Date, default: Date.now },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 5 },
    lockedAt: { type: Date },
    lockedBy: { type: String },
    lastError: { type: String, maxlength: 2000 },
    finishedAt: { type: Date },
    /**
     * Optional de-duplication key: only one queued/running job per key
     * (e.g. "appointment-expire:<id>", "recurring:earnings.release").
     */
    dedupeKey: { type: String },
    /** true while queued/running — backs the partial unique index on dedupeKey. */
    active: { type: Boolean, default: true },
    expireAt: { type: Date },
  },
  { timestamps: true },
);

jobSchema.index({ status: 1, runAt: 1 });
jobSchema.index({ dedupeKey: 1 }, { unique: true, partialFilterExpression: { active: true, dedupeKey: { $exists: true } } });
jobSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

export const Job = mongoose.models.Job || mongoose.model("Job", jobSchema);
