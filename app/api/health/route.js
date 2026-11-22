import mongoose from "mongoose";
import { connectDB } from "@/lib/db/connect";
import { ok, fail } from "@/lib/http/response";
import { Job } from "@/models/Job";

// GET /api/health — service + database status (for uptime checks)
export async function GET() {
  try {
    await connectDB();
    await mongoose.connection.db.admin().ping();
    const heartbeat = await Job.findOne({ name: "system.heartbeat", status: "succeeded" })
      .sort({ finishedAt: -1 })
      .select("finishedAt")
      .lean();
    const lastBeat = heartbeat?.finishedAt;
    return ok({
      status: "ok",
      service: "clinicyza-server",
      database: "connected",
      worker: {
        // the worker runs a heartbeat job every minute
        status: lastBeat && Date.now() - lastBeat.getTime() < 3 * 60_000 ? "running" : "not running",
        lastHeartbeatAt: lastBeat ?? null,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[health] Database check failed:", error.message);
    return fail(503, "DB_UNAVAILABLE", "Database is not reachable");
  }
}
