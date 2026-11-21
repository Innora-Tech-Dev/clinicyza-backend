import { logout } from "@/controllers/auth.controller";
import { ROLES } from "@/constants/roles";

// POST /api/v1/admin/logout
export const POST = logout(ROLES.ADMIN);
