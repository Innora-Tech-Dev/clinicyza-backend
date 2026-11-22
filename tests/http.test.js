import { test } from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import { ApiError } from "@/lib/http/ApiError";
import { roleFromPath, toErrorResponse } from "@/lib/http/handler";

test("roleFromPath reads the portal segment", () => {
  assert.equal(roleFromPath("/api/v1/doctor/me"), "doctor");
  assert.equal(roleFromPath("/api/v1/public/settings"), null);
  assert.equal(roleFromPath("/api/health"), null);
});

test("ApiError keeps its status and code", async () => {
  const res = toErrorResponse(ApiError.forbidden());
  assert.equal(res.status, 403);
  assert.equal((await res.json()).error.code, "FORBIDDEN");
});

test("ZodError becomes 422 VALIDATION_ERROR with field details", async () => {
  const result = z.object({ email: z.email() }).safeParse({ email: "nope" });
  const res = toErrorResponse(result.error);
  const body = await res.json();
  assert.equal(res.status, 422);
  assert.equal(body.error.code, "VALIDATION_ERROR");
  assert.equal(body.error.details[0].field, "email");
});

test("unexpected errors are hidden behind a generic 500", async () => {
  const res = toErrorResponse(new Error("database password is hunter2"));
  const body = await res.json();
  assert.equal(res.status, 500);
  assert.equal(body.error.code, "INTERNAL_ERROR");
  assert.doesNotMatch(body.error.message, /hunter2/);
});
