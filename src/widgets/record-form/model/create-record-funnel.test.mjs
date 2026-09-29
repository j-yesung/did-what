import { getRecordCreateErrorStep, validateRecordCreateStep } from "@/widgets/record-form/model/create-record-funnel";

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
  regions: [],
  weather: "sunny",
};

test("각 단계는 자기 입력만 검증한다", () => {
  assert.deepEqual(validateRecordCreateStep("when", context), {});
  assert.deepEqual(validateRecordCreateStep("where", context), {
    regions: "방문 지역을 1곳 이상 선택해 주세요.",
  });
  assert.deepEqual(validateRecordCreateStep("what", context), {
    activity: "기록 제목은 1자 이상 120자 이하로 입력해 주세요.",
  });
});

test("장소가 지역을 데려오면 지역을 따로 고르지 않아도 된다", () => {
  const region = {
    code: "1144000000",
    fullName: "서울 마포구",
    label: "마포구",
    latitude: 37.5,
    longitude: 127,
    name: "마포구",
  };
  const places = [{ address: null, key: "kakao:1", name: "카페", reference: {}, region }];

  assert.deepEqual(validateRecordCreateStep("where", { ...context, places }), {});
});

test("서버 필드 오류는 가장 앞 단계로 보낸다", () => {
  assert.equal(getRecordCreateErrorStep({ activity: "오류", weather: "오류" }), "when");
  assert.equal(getRecordCreateErrorStep({ activity: "오류", regions: "오류" }), "where");
  assert.equal(getRecordCreateErrorStep({ memo: "오류" }), "what");
  assert.equal(getRecordCreateErrorStep({ category: "오류" }), "what");
  assert.equal(getRecordCreateErrorStep({}), null);
});
