import { env } from "@/config/env";
import { handler } from "@/lib/http/handler";
import { ApiError } from "@/lib/http/ApiError";

// GET /api/dev/error — development only: throws on purpose to test error monitoring.
export const GET = handler(async () => {
  if (!env.isDevelopment) throw ApiError.notFound();
  throw new Error("Test error from /api/dev/error");
});
