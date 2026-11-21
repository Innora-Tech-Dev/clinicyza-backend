import { dashboard } from "@/controllers/dashboard.controller";
import { ROLES } from "@/constants/roles";

// GET /api/v1/admin/dashboard
export const GET = dashboard(ROLES.ADMIN);
