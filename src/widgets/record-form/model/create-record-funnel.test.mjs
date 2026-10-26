import { getRecordCreateErrorStep, validateRecordCreateStep } from "@/widgets/record-form/model/create-record-funnel";

import assert from "node:assert/strict";
import { test } from "node:test";

const context = {
  activity: "",
  category: [],
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

test("단계 검증과 최종 저장 검증은 날짜·제목·메모 경계에서 같은 오류를 반환한다", async () => {
  const { validateRecordInput } = await import("@/entities/record/model/record-form");
  const cases = [
    { recordedAt: "2026-02-30", recordedUntil: "" },
    { recordedUntil: "2026-09-06" },
    { recordedUntil: "2026-02-30" },
    { recordedUntil: "" },
    { activity: "   " },
    { activity: "가".repeat(120), memo: "나".repeat(500) },
    { activity: "가".repeat(121), memo: "나".repeat(501) },
    { activity: ` ${"가".repeat(120)} `, memo: ` ${"나".repeat(500)} ` },
  ];
  for (const overrides of cases) {
    const input = { ...context, activity: "산책", ...overrides };
    const result = validateRecordInput({
      ...input,
      category: JSON.stringify(input.category),
      regions: JSON.stringify([{ code: "1144000000", label: "마포구", name: "서울 마포구" }]),
      places: "[]",
    });
    const errors = { ...validateRecordCreateStep("when", input), ...validateRecordCreateStep("what", input) };
    for (const key of ["recordedAt", "recordedUntil", "activity", "memo"]) {
      assert.equal(errors[key], result.fieldErrors?.[key], JSON.stringify(overrides));
    }
  }
});

test("작성 단계에서 선택한 복수 카테고리는 최종 저장까지 유지된다", async () => {
  const { toRecordCreateFormData } = await import("@/widgets/record-form/model/create-record-funnel");
  const { readRecordInput, validateRecordInput } = await import("@/entities/record/model/record-form");
  const input = {
    ...context,
    activity: "둘이서 떠난 여행",
    category: ["date", "travel"],
    regions: [{ code: "1144000000", label: "마포구", fullName: "서울 마포구" }],
  };
  const formData = toRecordCreateFormData(input);
  assert.deepEqual(validateRecordInput(readRecordInput(formData)).data.category, ["date", "travel"]);
});
