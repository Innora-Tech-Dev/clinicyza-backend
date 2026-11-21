import { forgotPassword } from "@/controllers/auth.controller";
import { ROLES } from "@/constants/roles";

// POST /api/v1/patient/forgot-password
export const POST = forgotPassword(ROLES.PATIENT);
