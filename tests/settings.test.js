import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_SETTINGS } from "@/constants/settings";
import { mergeSettings, validateSettingsPatch } from "@/services/settings.service";

test("mergeSettings: stored values win, missing keys fall back to defaults", () => {
  const merged = mergeSettings(DEFAULT_SETTINGS.booking, { holdMinutes: 12 });
  assert.equal(merged.holdMinutes, 12);
  assert.equal(merged.leadTimeMinutes, DEFAULT_SETTINGS.booking.leadTimeMinutes);
});

test("mergeSettings: unknown stored keys are dropped", () => {
  const merged = mergeSettings(DEFAULT_SETTINGS.booking, { holdMinutes: 12, legacyFlag: true });
  assert.equal("legacyFlag" in merged, false);
});

test("mergeSettings: nested groups merge deeply", () => {
  const merged = mergeSettings(DEFAULT_SETTINGS.general, { marketing: { doctorsCount: 200 } });
  assert.equal(merged.marketing.doctorsCount, 200);
  assert.equal(merged.marketing.consultationFrom, DEFAULT_SETTINGS.general.marketing.consultationFrom);
  assert.equal(merged.emergencyLine, DEFAULT_SETTINGS.general.emergencyLine);
});

test("validateSettingsPatch: accepts a valid partial update", () => {
  assert.deepEqual(validateSettingsPatch(DEFAULT_SETTINGS, { booking: { holdMinutes: 15 } }), []);
});

test("validateSettingsPatch: rejects unknown keys and wrong types", () => {
  const issues = validateSettingsPatch(DEFAULT_SETTINGS, {
    booking: { holdMinutes: "ten", nope: 1 },
    general: { maintenanceMode: "yes" },
  });
  const fields = issues.map((i) => i.field).sort();
  assert.deepEqual(fields, ["booking.holdMinutes", "booking.nope", "general.maintenanceMode"]);
});

test("validateSettingsPatch: nullable messaging window accepts null or a number", () => {
  assert.deepEqual(validateSettingsPatch(DEFAULT_SETTINGS, { chat: { messagingWindowDays: null } }), []);
  assert.deepEqual(validateSettingsPatch(DEFAULT_SETTINGS, { chat: { messagingWindowDays: 30 } }), []);
  assert.equal(validateSettingsPatch(DEFAULT_SETTINGS, { chat: { messagingWindowDays: "30" } }).length, 1);
});

test("validateSettingsPatch: negative numbers are rejected", () => {
  assert.equal(validateSettingsPatch(DEFAULT_SETTINGS, { booking: { holdMinutes: -1 } }).length, 1);
});

test("defaults follow the spec: 35% commission within 30-40%, 10-min hold, 24h free cancellation", () => {
  const { commission, booking } = DEFAULT_SETTINGS;
  assert.equal(commission.defaultPercent, 35);
  assert.equal(commission.minPercent, 30);
  assert.equal(commission.maxPercent, 40);
  assert.equal(booking.holdMinutes, 10);
  assert.equal(booking.freeCancellationHours, 24);
});
