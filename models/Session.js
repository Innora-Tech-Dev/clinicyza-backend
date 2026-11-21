import mongoose from "mongoose";

/**
 * A signed-in device/browser. The refresh token is stored only as a SHA-256 hash.
 * Revoking a session (logout, password reset) invalidates its tokens immediately.
 * Expired sessions are deleted automatically by the TTL index.
 */
const sessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    role: { type: String, enum: ["admin", "doctor", "patient"], required: true },
    refreshTokenHash: { type: String, required: true },
    userAgent: { type: String, maxlength: 500 },
    ip: { type: String, maxlength: 100 },
    lastUsedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date },
  },
  { timestamps: true },
);

sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Session = mongoose.models.Session || mongoose.model("Session", sessionSchema);
