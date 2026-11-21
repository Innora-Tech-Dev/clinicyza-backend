import { forgotPassword } from "@/controllers/auth.controller";
import { ROLES } from "@/constants/roles";

// POST /api/v1/admin/forgot-password
export const POST = forgotPassword(ROLES.ADMIN);
