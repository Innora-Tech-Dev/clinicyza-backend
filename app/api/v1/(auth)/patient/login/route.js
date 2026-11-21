import { login } from "@/controllers/auth.controller";
import { ROLES } from "@/constants/roles";

// POST /api/v1/patient/login
export const POST = login(ROLES.PATIENT);
