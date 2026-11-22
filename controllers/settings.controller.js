import { ROLES } from "@/constants/roles";
import { requireAuth } from "@/lib/auth/guard";
import { handler, readJson } from "@/lib/http/handler";
import { ok } from "@/lib/http/response";
import { getPublicSettings, getSettings, updateSettings } from "@/services/settings.service";

/** GET /api/v1/public/settings — marketing figures, contact, emergency line, maintenance flag. */
export const publicSettings = handler(async () => {
  const data = await getPublicSettings();
  const response = ok(data);
  response.headers.set("Cache-Control", "public, max-age=30, stale-while-revalidate=300");
  return response;
});

/** GET /api/v1/admin/settings — every group. */
export const adminGetSettings = handler(async (request) => {
  await requireAuth(request, ROLES.ADMIN);
  return ok({ settings: await getSettings() });
});

/** PATCH /api/v1/admin/settings — partial update, e.g. { booking: { holdMinutes: 12 } }. */
export const adminUpdateSettings = handler(async (request) => {
  const { user } = await requireAuth(request, ROLES.ADMIN);
  const settings = await updateSettings(await readJson(request), { userId: user.id });
  return ok({ settings }, { message: "Settings saved" });
});
