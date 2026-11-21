import { resetPassword } from "@/controllers/auth.controller";
import { ROLES } from "@/constants/roles";

// POST /api/v1/patient/reset-password
export const POST = resetPassword(ROLES.PATIENT);
