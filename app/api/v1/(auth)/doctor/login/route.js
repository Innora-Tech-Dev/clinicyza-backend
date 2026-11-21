import { login } from "@/controllers/auth.controller";
import { ROLES } from "@/constants/roles";

// POST /api/v1/doctor/login
export const POST = login(ROLES.DOCTOR);
