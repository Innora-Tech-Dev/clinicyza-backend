import { dashboard } from "@/controllers/dashboard.controller";
import { ROLES } from "@/constants/roles";

// GET /api/v1/doctor/dashboard
export const GET = dashboard(ROLES.DOCTOR);
