import { DEFAULT_SETTINGS, PUBLIC_SETTINGS, SETTING_GROUPS } from "@/constants/settings";
import { connectDB } from "@/lib/db/connect";
import { ApiError } from "@/lib/http/ApiError";
import { Setting } from "@/models/Setting";

const CACHE_MS = 15_000;
let cache = { at: 0, value: null };

const isPlainObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

/** Defaults overlaid with stored values (stored wins, unknown keys ignored). */
export function mergeSettings(defaults, stored) {
  if (!isPlainObject(defaults)) return stored === undefined ? defaults : stored;
  const out = {};
  for (const key of Object.keys(defaults)) {
    out[key] = isPlainObject(stored) ? mergeSettings(defaults[key], stored[key]) : defaults[key];
  }
  return out;
}

/**
 * Check a partial update against the shape of the defaults.
 * Returns a list of { field, message }; empty means valid.
 */
export function validateSettingsPatch(defaults, patch, path = "") {
  if (!isPlainObject(patch)) return [{ field: path || "(root)", message: "Must be an object" }];
  const issues = [];
  for (const [key, value] of Object.entries(patch)) {
    const field = path ? `${path}.${key}` : key;
    if (!(key in defaults)) {
      issues.push({ field, message: "Unknown setting" });
      continue;
    }
    const expected = defaults[key];
    if (isPlainObject(expected)) {
      issues.push(...validateSettingsPatch(expected, value, field));
    } else if (expected === null) {
      // nullable number (e.g. messagingWindowDays: null = off)
      if (value !== null && !(typeof value === "number" && value >= 0)) {
        issues.push({ field, message: "Must be a positive number or null" });
      }
    } else if (typeof value !== typeof expected) {
      issues.push({ field, message: `Must be a ${typeof expected}` });
    } else if (typeof value === "number" && (!Number.isFinite(value) || value < 0)) {
      issues.push({ field, message: "Must be zero or more" });
    } else if (typeof value === "string" && value.length > 500) {
      issues.push({ field, message: "Must be 500 characters or fewer" });
    }
  }
  return issues;
}

/** Business constraints that span fields. */
function checkRules(all) {
  const issues = [];
  const c = all.commission;
  if (c.minPercent > c.maxPercent) issues.push({ field: "commission.minPercent", message: "Must not exceed maxPercent" });
  if (c.maxPercent > 100) issues.push({ field: "commission.maxPercent", message: "Must be 100 or less" });
  if (c.defaultPercent < c.minPercent || c.defaultPercent > c.maxPercent) {
    issues.push({ field: "commission.defaultPercent", message: `Must be between ${c.minPercent} and ${c.maxPercent}` });
  }
  if (all.booking.lateCancellationRefundPercent > 100) {
    issues.push({ field: "booking.lateCancellationRefundPercent", message: "Must be 100 or less" });
  }
  return issues;
}

/** All settings groups, merged with defaults. */
export async function getSettings() {
  if (cache.value && Date.now() - cache.at < CACHE_MS) return cache.value;
  await connectDB();
  const rows = await Setting.find({ key: { $in: SETTING_GROUPS } }).lean();
  const stored = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const value = Object.fromEntries(
    SETTING_GROUPS.map((group) => [group, mergeSettings(DEFAULT_SETTINGS[group], stored[group])]),
  );
  cache = { at: Date.now(), value };
  return value;
}

export async function getSetting(group) {
  return (await getSettings())[group];
}

/** The subset safe to expose without authentication. */
export async function getPublicSettings() {
  const all = await getSettings();
  return Object.fromEntries(
    Object.entries(PUBLIC_SETTINGS).map(([group, keys]) => [
      group,
      Object.fromEntries(keys.map((k) => [k, all[group][k]])),
    ]),
  );
}

/** Apply a partial update to one or more groups: { booking: { holdMinutes: 12 } }. */
export async function updateSettings(patch, { userId } = {}) {
  const issues = validateSettingsPatch(DEFAULT_SETTINGS, patch);
  if (issues.length) throw new ApiError(422, "VALIDATION_ERROR", "Some settings are invalid", issues);

  cache = { at: 0, value: null };
  const current = await getSettings();
  const next = Object.fromEntries(
    SETTING_GROUPS.map((group) => [group, mergeSettings(current[group], patch[group])]),
  );
  const ruleIssues = checkRules(next);
  if (ruleIssues.length) throw new ApiError(422, "VALIDATION_ERROR", "Some settings are invalid", ruleIssues);

  await Promise.all(
    Object.keys(patch).map((group) =>
      Setting.findOneAndUpdate(
        { key: group },
        { $set: { value: next[group], updatedBy: userId } },
        { upsert: true },
      ),
    ),
  );
  cache = { at: 0, value: null };
  return getSettings();
}
