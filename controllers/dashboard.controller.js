import { requireAuth } from "@/lib/auth/guard";
import { handler } from "@/lib/http/handler";
import { ok } from "@/lib/http/response";
import { ROLES } from "@/constants/roles";
import {
  getAdminDashboard, getDoctorDashboard, getPatientDashboard,
} from "@/services/dashboard.service";

const LOADERS = {
  [ROLES.ADMIN]: getAdminDashboard,
  [ROLES.DOCTOR]: getDoctorDashboard,
  [ROLES.PATIENT]: getPatientDashboard,
};

/** GET /api/v1/{role}/dashboard */
export const dashboard = (role) =>
  handler(async (request) => {
    const { user } = await requireAuth(request, role);
    return ok(await LOADERS[role](user));
  });
