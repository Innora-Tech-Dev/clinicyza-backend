import { test } from "node:test";
import assert from "node:assert/strict";
import { retryDelayMs } from "@/lib/jobs/queue";
import { JOB_HANDLERS, RECURRING_JOBS } from "@/lib/jobs/registry";

test("retryDelayMs grows exponentially: 30s, 2m, 8m, 32m", () => {
  assert.equal(retryDelayMs(1), 30_000);
  assert.equal(retryDelayMs(2), 120_000);
  assert.equal(retryDelayMs(3), 480_000);
  assert.equal(retryDelayMs(4), 1_920_000);
});

test("retryDelayMs is capped at 6 hours", () => {
  assert.equal(retryDelayMs(20), 6 * 60 * 60 * 1000);
});

test("every recurring job has a handler", () => {
  for (const { name, everyMs } of RECURRING_JOBS) {
    assert.equal(typeof JOB_HANDLERS[name], "function", name);
    assert.ok(everyMs >= 1000, `${name} interval too short`);
  }
});
