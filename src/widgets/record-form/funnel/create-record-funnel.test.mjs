import { getRecordCreateErrorStep, validateRecordCreateStep } from "./create-record-funnel.model.ts";
import assert from "node:assert/strict";
import { test } from "node:test";

const context = {
  activity: "",
  category: "uncategorized",
  dirty: false,
  memo: "",
  places: [],
  recordedAt: "2026-09-07",
  recordedUntil: "2026-09-07",
  region: null,
  weather: "sunny",
};

test("각 단계는 자기 입력만 검증한다", () => {
  assert.deepEqual(validateRecordCreateStep("when", context), {});
  assert.deepEqual(validateRecordCreateStep("where", context), {
    regionCode: "목록에서 지역을 선택해 주세요.",
  });
  assert.deepEqual(validateRecordCreateStep("what", context), {
    activity: "한 일은 1자 이상 120자 이하로 입력해 주세요.",
  });
});

test("서버 필드 오류는 가장 앞 단계로 보낸다", () => {
  assert.equal(getRecordCreateErrorStep({ activity: "오류", weather: "오류" }), "when");
  assert.equal(getRecordCreateErrorStep({ activity: "오류", regionCode: "오류" }), "where");
  assert.equal(getRecordCreateErrorStep({ memo: "오류" }), "what");
  assert.equal(getRecordCreateErrorStep({ category: "오류" }), "what");
  assert.equal(getRecordCreateErrorStep({}), null);
});
