import mongoose from "mongoose";

/**
 * One-time password reset token (stored only as a SHA-256 hash).
 * Deleted automatically after it expires (TTL index).
 */
const passwordResetSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    role: { type: String, enum: ["admin", "doctor", "patient"], required: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date },
  },
  { timestamps: true },
);

passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const PasswordReset =
  mongoose.models.PasswordReset || mongoose.model("PasswordReset", passwordResetSchema);
