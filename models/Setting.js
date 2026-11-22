import mongoose from "mongoose";

/**
 * Platform settings, one document per group ("general", "booking", "commission", …).
 * Only the values an admin changed are stored; defaults live in
 * services/settings.service.js, so new settings work without a migration.
 */
const settingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: mongoose.Schema.Types.Mixed, default: {} },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, minimize: false },
);

export const Setting = mongoose.models.Setting || mongoose.model("Setting", settingSchema);
