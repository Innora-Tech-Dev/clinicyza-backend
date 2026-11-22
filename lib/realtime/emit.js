import { env } from "@/config/env";
import { logger } from "@/lib/logger";

/**
 * Broadcast an event from the API to connected clients via the realtime server.
 *   await emitRealtime(rooms.user(userId), "notification:new", { id });
 * Never throws — live updates are best-effort; the data is always in the database first.
 */
export async function emitRealtime(room, event, data) {
  if (!env.realtimeInternalUrl) return false;
  try {
    const res = await fetch(`${env.realtimeInternalUrl.replace(/\/$/, "")}/internal/emit`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Internal-Secret": env.realtimeInternalSecret },
      body: JSON.stringify({ room, event, data }),
      signal: AbortSignal.timeout(3000),
    });
    return res.ok;
  } catch (error) {
    logger.warn("realtime emit failed", { room, event, error: error.message });
    return false;
  }
}
