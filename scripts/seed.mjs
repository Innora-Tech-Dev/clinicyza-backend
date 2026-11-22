/**
 * Seed script — safe to run repeatedly (never overwrites existing data).
 *   npm run seed
 * Uses .env.local for MONGODB_URI / MONGODB_DB_NAME.
 *
 * Steps (later milestones add theirs to STEPS):
 *   indexes  → builds the indexes of every model
 *   settings → stores the default settings groups that don't exist yet
 *   users    → one demo account per portal (names match the design files)
 */
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db/connect";
import { DEFAULT_SETTINGS } from "@/constants/settings";
import { ApiLog } from "@/models/ApiLog";
import { ErrorLog } from "@/models/ErrorLog";
import { Job } from "@/models/Job";
import { PasswordReset } from "@/models/PasswordReset";
import { Session } from "@/models/Session";
import { Setting } from "@/models/Setting";
import { User } from "@/models/User";

const PASSWORD = process.env.SEED_PASSWORD || "Clinicyza123";

const DEMO_USERS = [
  { role: "admin", name: "Admin User", email: "admin@clinicyza.test" },
  { role: "doctor", name: "Dr. Marco Bellini", email: "doctor@clinicyza.test" },
  { role: "patient", name: "Laura Conti", email: "patient@clinicyza.test" },
];

const STEPS = {
  async indexes() {
    for (const Model of [User, Session, PasswordReset, Setting, Job, ApiLog, ErrorLog]) {
      await Model.syncIndexes();
    }
    return "all model indexes in sync";
  },

  async settings() {
    const created = [];
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
      const result = await Setting.updateOne({ key }, { $setOnInsert: { key, value } }, { upsert: true });
      if (result.upsertedCount) created.push(key);
    }
    return created.length ? `created ${created.join(", ")}` : "already present";
  },

  async users() {
    const passwordHash = await bcrypt.hash(PASSWORD, 12);
    const lines = [];
    for (const u of DEMO_USERS) {
      const exists = await User.exists({ email: u.email, role: u.role });
      if (!exists) await User.create({ ...u, passwordHash });
      lines.push(`${exists ? "•" : "✓"} ${u.role.padEnd(7)} ${u.email}${exists ? " (exists)" : ""}`);
    }
    return `\n    ${lines.join("\n    ")}\n    password for new accounts: ${PASSWORD}`;
  },
};

await connectDB();
for (const [name, run] of Object.entries(STEPS)) {
  console.log(`▸ ${name}: ${await run()}`);
}
await mongoose.disconnect();
console.log("Seed finished.");
