import { login } from "@/controllers/auth.controller";
import { ROLES } from "@/constants/roles";

// POST /api/v1/admin/login
export const POST = login(ROLES.ADMIN);
