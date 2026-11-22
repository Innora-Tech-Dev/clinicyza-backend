import { adminGetSettings, adminUpdateSettings } from "@/controllers/settings.controller";

// GET   /api/v1/admin/settings — all settings groups
// PATCH /api/v1/admin/settings — partial update
export const GET = adminGetSettings;
export const PATCH = adminUpdateSettings;
