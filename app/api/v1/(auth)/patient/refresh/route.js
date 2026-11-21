import { refresh } from "@/controllers/auth.controller";
import { ROLES } from "@/constants/roles";

// POST /api/v1/patient/refresh
export const POST = refresh(ROLES.PATIENT);
