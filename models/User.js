import mongoose from "mongoose";

/**
 * One collection for all three user types, separated by `role`.
 * The same email may have a patient AND a doctor account (unique per role).
 * NOTE: imports only mongoose (no "@/" aliases) so scripts/ can load it with plain Node.
 */
const userSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["admin", "doctor", "patient"], required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    passwordHash: { type: String, required: true, select: false },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
    passwordChangedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.passwordHash;
        return ret;
      },
    },
  },
);

userSchema.index({ email: 1, role: 1 }, { unique: true });

export const User = mongoose.models.User || mongoose.model("User", userSchema);
