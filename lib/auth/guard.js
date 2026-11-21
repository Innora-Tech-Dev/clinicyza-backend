import { connectDB } from "@/lib/db/connect";
import { ApiError } from "@/lib/http/ApiError";
import { Session } from "@/models/Session";
import { User } from "@/models/User";
import { readAccessToken } from "./cookies";
import { verifyAccessToken } from "./tokens";

/**
 * Protect a route for one role. Returns { user, session } or throws 401/403.
 *   const { user } = await requireAuth(request, ROLES.ADMIN);
 */
export async function requireAuth(request, role) {
  const token = readAccessToken(request, role);
  if (!token) throw ApiError.unauthorized();

  const payload = await verifyAccessToken(token, role);

  await connectDB();
  const [user, session] = await Promise.all([
    User.findById(payload.sub),
    Session.findById(payload.sid),
  ]);

  if (!session || session.revokedAt || session.user.toString() !== payload.sub) {
    throw ApiError.unauthorized("Your session has ended. Please sign in again.", "SESSION_REVOKED");
  }
  if (!user || user.role !== role) throw ApiError.unauthorized();
  if (!user.isActive) throw ApiError.forbidden("This account has been disabled", "ACCOUNT_DISABLED");

  return { user, session };
}
