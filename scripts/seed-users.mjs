/**
 * Creates one test account per portal (skips accounts that already exist).
 *   npm run seed
 * Uses .env.local for MONGODB_URI / MONGODB_DB_NAME.
 */
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";

process.loadEnvFile(new URL("../.env.local", import.meta.url));

const PASSWORD = process.env.SEED_PASSWORD || "Clinicyza123";

const USERS = [
  { role: "admin", name: "Admin User", email: "admin@clinicyza.test" },
  { role: "doctor", name: "Dr. Giulia Romano", email: "doctor@clinicyza.test" },
  { role: "patient", name: "Marco Bianchi", email: "patient@clinicyza.test" },
];

await mongoose.connect(process.env.MONGODB_URI, {
  dbName: process.env.MONGODB_DB_NAME || "clinicyza",
  serverSelectionTimeoutMS: 10000,
});
await User.syncIndexes();

const passwordHash = await bcrypt.hash(PASSWORD, 12);
for (const u of USERS) {
  const exists = await User.exists({ email: u.email, role: u.role });
  if (exists) {
    console.log(`• ${u.role.padEnd(7)} ${u.email} — already exists`);
    continue;
  }
  await User.create({ ...u, passwordHash });
  console.log(`✓ ${u.role.padEnd(7)} ${u.email} — created`);
}
console.log(`\nPassword for new accounts: ${PASSWORD}`);
await mongoose.disconnect();
