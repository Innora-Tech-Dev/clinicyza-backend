import { dashboard } from "@/controllers/dashboard.controller";
import { ROLES } from "@/constants/roles";

// GET /api/v1/patient/dashboard
export const GET = dashboard(ROLES.PATIENT);
