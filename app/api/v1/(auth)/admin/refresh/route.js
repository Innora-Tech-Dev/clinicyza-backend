import { refresh } from "@/controllers/auth.controller";
import { ROLES } from "@/constants/roles";

// POST /api/v1/admin/refresh
export const POST = refresh(ROLES.ADMIN);
