import { test } from "node:test";
import assert from "node:assert/strict";

process.env.JWT_ACCESS_SECRET ||= "test-access-secret-test-access-secret";
process.env.JWT_REFRESH_SECRET ||= "test-refresh-secret-test-refresh-secret";

const { signAccessToken, signRealtimeTicket, verifyAccessToken, verifyRealtimeTicket } = await import(
  "@/lib/auth/tokens"
);

const identity = { userId: "64b000000000000000000001", role: "patient", sessionId: "64b000000000000000000002" };

test("realtime ticket round-trips the identity", async () => {
  const ticket = await signRealtimeTicket(identity);
  const payload = await verifyRealtimeTicket(ticket);
  assert.equal(payload.sub, identity.userId);
  assert.equal(payload.role, "patient");
  assert.equal(payload.sid, identity.sessionId);
});

test("an access token cannot be used as a realtime ticket", async () => {
  const access = await signAccessToken(identity);
  await assert.rejects(verifyRealtimeTicket(access), { code: "INVALID_TOKEN" });
});

test("a realtime ticket cannot be used as an access token", async () => {
  const ticket = await signRealtimeTicket(identity);
  await assert.rejects(verifyAccessToken(ticket, "patient"), { code: "INVALID_TOKEN" });
});

test("access tokens are bound to their role", async () => {
  const access = await signAccessToken(identity);
  await assert.rejects(verifyAccessToken(access, "admin"), { code: "INVALID_TOKEN" });
});
