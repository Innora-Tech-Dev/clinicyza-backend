import { me } from "@/controllers/auth.controller";
import { ROLES } from "@/constants/roles";

// GET /api/v1/patient/me
export const GET = me(ROLES.PATIENT);
