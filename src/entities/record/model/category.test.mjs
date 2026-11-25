import { isRecordCategories, normalizeRecordCategories, normalizeRecordCategory } from "./category.ts";
import assert from "node:assert/strict";
import { test } from "node:test";

test("카테고리 복원은 선택 순서를 유지하고 중복·미분류·알 수 없는 값은 제외한다", () => {
  assert.deepEqual(normalizeRecordCategories(["travel", "date", "travel", "uncategorized", "unknown"]), [
    "travel",
    "date",
  ]);
  assert.deepEqual(normalizeRecordCategories("daily"), ["daily"]);
  assert.deepEqual(normalizeRecordCategories(["anniversary", "celebration"]), ["celebration"]);
  assert.deepEqual(normalizeRecordCategories("uncategorized"), []);
  assert.deepEqual(normalizeRecordCategories(null), []);
  assert.equal(normalizeRecordCategory(["travel", "date"]), "travel");
  assert.equal(normalizeRecordCategory([]), "uncategorized");
});

test("카테고리 입력은 빈 배열이나 현재 카테고리 하나만 허용한다", () => {
  assert.equal(isRecordCategories([]), true);
  assert.equal(isRecordCategories(["daily"]), true);
  assert.equal(isRecordCategories(["celebration"]), true);
  for (const value of [null, "date", {}, ["anniversary"], ["unknown"], [null], ["daily", "date"]]) {
    assert.equal(isRecordCategories(value), false);
  }
});
