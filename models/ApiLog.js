import mongoose from "mongoose";

/**
 * One row per API request (Admin › System › Logs › API).
 * Never stores request bodies, tokens or health data — only request metadata.
 * Rows are deleted automatically after 30 days.
 */
const apiLogSchema = new mongoose.Schema(
  {
    requestId: { type: String, required: true },
    method: { type: String, required: true },
    path: { type: String, required: true, maxlength: 500 },
    status: { type: Number, required: true },
    durationMs: { type: Number, required: true },
    role: { type: String, enum: ["admin", "doctor", "patient", null], default: null },
    client: { type: String, enum: ["web", "mobile"], default: "mobile" },
    errorCode: { type: String },
    ip: { type: String, maxlength: 100 },
    userAgent: { type: String, maxlength: 500 },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

apiLogSchema.index({ createdAt: -1 });
apiLogSchema.index({ status: 1, createdAt: -1 });
apiLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export const ApiLog = mongoose.models.ApiLog || mongoose.model("ApiLog", apiLogSchema);
