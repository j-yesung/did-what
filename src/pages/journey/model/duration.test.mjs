import { durationParts } from "./duration.ts";
import assert from "node:assert/strict";
import { test } from "node:test";

test("60분 이상은 시간과 분으로 나눈다", () => {
  assert.deepEqual(durationParts(0), [[0, "분"]]);
  assert.deepEqual(durationParts(59), [[59, "분"]]);
  assert.deepEqual(durationParts(60), [[1, "시간"]]);
  assert.deepEqual(durationParts(100), [
    [1, "시간"],
    [40, "분"],
  ]);
});
