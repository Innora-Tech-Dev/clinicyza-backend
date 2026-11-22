import { realtimeToken } from "@/controllers/realtime.controller";
import { ROLES } from "@/constants/roles";

// POST /api/v1/admin/realtime-token — short-lived ticket for the WebSocket server
export const POST = realtimeToken(ROLES.ADMIN);
