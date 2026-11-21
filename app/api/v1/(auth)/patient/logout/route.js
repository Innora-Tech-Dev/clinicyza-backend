import { logout } from "@/controllers/auth.controller";
import { ROLES } from "@/constants/roles";

// POST /api/v1/patient/logout
export const POST = logout(ROLES.PATIENT);
