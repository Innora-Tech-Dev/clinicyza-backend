import { z } from "zod";
import { ROLES } from "@/constants/roles";
import { requireAuth } from "@/lib/auth/guard";
import { handler } from "@/lib/http/handler";
import { ok } from "@/lib/http/response";
import { ApiLog } from "@/models/ApiLog";
import { ErrorLog } from "@/models/ErrorLog";

const pageQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

async function paginate(Model, filter, { page, pageSize }) {
  const [items, total] = await Promise.all([
    Model.find(filter).sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean(),
    Model.countDocuments(filter),
  ]);
  return { items, page, pageSize, total };
}

/** GET /api/v1/admin/logs/api?status=500&page=1 — request log. */
export const adminApiLogs = handler(async (request) => {
  await requireAuth(request, ROLES.ADMIN);
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const query = pageQuery
    .extend({ status: z.coerce.number().int().optional(), method: z.string().max(10).optional() })
    .parse(params);
  const filter = {
    ...(query.status && { status: query.status }),
    ...(query.method && { method: query.method.toUpperCase() }),
  };
  return ok(await paginate(ApiLog, filter, query));
});

/** GET /api/v1/admin/logs/errors?source=worker&page=1 — unhandled errors. */
export const adminErrorLogs = handler(async (request) => {
  await requireAuth(request, ROLES.ADMIN);
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const query = pageQuery.extend({ source: z.enum(["api", "worker", "realtime"]).optional() }).parse(params);
  return ok(await paginate(ErrorLog, query.source ? { source: query.source } : {}, query));
});
