import { validateRecordInput } from "./record-form.ts";
import assert from "node:assert/strict";
import { test } from "node:test";

const values = {
  activity: "마포 산책",
  category: '["daily"]',
  memo: "",
  places: "[]",
  recordedAt: "2026-10-19",
  recordedUntil: "",
  weather: "sunny",
};
const region = (label, code = "1144000000") => ({ code, label, name: "서울 마포구" });

test("같은 지역의 다른 표시명을 저장 입력에 모두 남기고 정확한 중복만 합친다", () => {
  const result = validateRecordInput({
    ...values,
    regions: JSON.stringify([region("난지 한강공원"), region("디지털미디어시티"), region(" 난지 한강공원 ")]),
  });
  assert.deepEqual(result.data.regions, [region("난지 한강공원"), region("디지털미디어시티")]);
});

test("표시명이 같아도 다른 지역이면 모두 보존한다", () => {
  const regions = [region("중구", "1114000000"), region("중구", "2611000000")];
  assert.deepEqual(validateRecordInput({ ...values, regions: JSON.stringify(regions) }).data.regions, regions);
});

test("이름이 다른 동일 지역 항목도 10개 상한을 적용한다", () => {
  const regions = Array.from({ length: 11 }, (_, index) => region(`이름 ${index}`));
  assert.ok(validateRecordInput({ ...values, regions: JSON.stringify(regions) }).fieldErrors.regions);
  assert.equal(
    validateRecordInput({ ...values, regions: JSON.stringify(regions.slice(0, 10)) }).data.regions.length,
    10,
  );
});

test("복수 카테고리를 저장하고 중복은 제거하며 미선택은 빈 배열로 저장한다", () => {
  const input = { ...values, regions: JSON.stringify([region("마포구")]) };
  assert.deepEqual(validateRecordInput({ ...input, category: '["date","travel","date"]' }).data.category, [
    "date",
    "travel",
  ]);
  assert.deepEqual(validateRecordInput({ ...input, category: "[]" }).data.category, []);
  for (const category of [
    "daily",
    '"date"',
    "{}",
    "null",
    '["date","invalid"]',
    "[null]",
    JSON.stringify(Array(6).fill("date")),
  ]) {
    assert.ok(validateRecordInput({ ...input, category }).fieldErrors.category, category);
  }
});
