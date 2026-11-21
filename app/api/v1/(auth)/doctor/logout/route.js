import { logout } from "@/controllers/auth.controller";
import { ROLES } from "@/constants/roles";

// POST /api/v1/doctor/logout
export const POST = logout(ROLES.DOCTOR);
