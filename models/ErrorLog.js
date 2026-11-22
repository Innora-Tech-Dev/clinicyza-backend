import mongoose from "mongoose";

/**
 * Unhandled errors from the API, the background worker and the realtime server
 * (Admin › System › Logs › Error). Deleted automatically after 90 days.
 */
const errorLogSchema = new mongoose.Schema(
  {
    source: { type: String, enum: ["api", "worker", "realtime"], required: true },
    level: { type: String, enum: ["error", "fatal"], default: "error" },
    name: { type: String },
    message: { type: String, required: true, maxlength: 2000 },
    stack: { type: String, maxlength: 10000 },
    requestId: { type: String },
    method: { type: String },
    path: { type: String, maxlength: 500 },
    /** Small, non-sensitive context (job name, socket event…). Never health data. */
    context: { type: mongoose.Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

errorLogSchema.index({ createdAt: -1 });
errorLogSchema.index({ source: 1, createdAt: -1 });
errorLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const ErrorLog = mongoose.models.ErrorLog || mongoose.model("ErrorLog", errorLogSchema);
