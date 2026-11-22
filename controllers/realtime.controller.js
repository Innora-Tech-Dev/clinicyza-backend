import { env } from "@/config/env";
import { requireAuth } from "@/lib/auth/guard";
import { signRealtimeTicket } from "@/lib/auth/tokens";
import { handler } from "@/lib/http/handler";
import { ApiError } from "@/lib/http/ApiError";
import { ok } from "@/lib/http/response";

/**
 * POST /api/v1/{role}/realtime-token
 * Returns a 60-second ticket for opening the WebSocket connection:
 *   io(url, { auth: { token } })
 */
export const realtimeToken = (role) =>
  handler(async (request) => {
    const { user, session } = await requireAuth(request, role);
    if (!env.realtimePublicUrl) {
      throw new ApiError(503, "REALTIME_UNAVAILABLE", "Live updates are not available right now");
    }
    const token = await signRealtimeTicket({
      userId: user.id,
      role,
      sessionId: session.id,
    });
    return ok({ token, url: env.realtimePublicUrl, expiresIn: env.realtimeTicketTtlSeconds });
  });
