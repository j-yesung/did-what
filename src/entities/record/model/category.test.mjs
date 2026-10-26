import { isRecordCategories, normalizeRecordCategories, normalizeRecordCategory } from "./category.ts";
import assert from "node:assert/strict";
import { test } from "node:test";

test("카테고리 복원은 선택 순서를 유지하고 중복·미분류·알 수 없는 값은 제외한다", () => {
  assert.deepEqual(normalizeRecordCategories(["travel", "date", "travel", "uncategorized", "unknown"]), [
    "travel",
    "date",
  ]);
  assert.deepEqual(normalizeRecordCategories("daily"), ["daily"]);
  assert.deepEqual(normalizeRecordCategories("uncategorized"), []);
  assert.deepEqual(normalizeRecordCategories(null), []);
  assert.equal(normalizeRecordCategory(["travel", "date"]), "travel");
  assert.equal(normalizeRecordCategory([]), "uncategorized");
});

test("카테고리 입력은 배열만 허용하며 선택하지 않거나 5개를 모두 고를 수 있다", () => {
  assert.equal(isRecordCategories([]), true);
  assert.equal(isRecordCategories(["daily", "date", "travel", "anniversary", "gathering"]), true);
  for (const value of [null, "date", {}, ["unknown"], [null], Array(6).fill("date")]) {
    assert.equal(isRecordCategories(value), false);
  }
});
