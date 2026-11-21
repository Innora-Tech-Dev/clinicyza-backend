import mongoose from "mongoose";
import { connectDB } from "@/lib/db/connect";
import { ok, fail } from "@/lib/http/response";

// GET /api/health — service + database status (for uptime checks)
export async function GET() {
  try {
    await connectDB();
    await mongoose.connection.db.admin().ping();
    return ok({
      status: "ok",
      service: "clinicyza-server",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[health] Database check failed:", error.message);
    return fail(503, "DB_UNAVAILABLE", "Database is not reachable");
  }
}
