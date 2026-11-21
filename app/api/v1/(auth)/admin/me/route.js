import { me } from "@/controllers/auth.controller";
import { ROLES } from "@/constants/roles";

// GET /api/v1/admin/me
export const GET = me(ROLES.ADMIN);
