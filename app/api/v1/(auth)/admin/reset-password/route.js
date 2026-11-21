import { resetPassword } from "@/controllers/auth.controller";
import { ROLES } from "@/constants/roles";

// POST /api/v1/admin/reset-password
export const POST = resetPassword(ROLES.ADMIN);
