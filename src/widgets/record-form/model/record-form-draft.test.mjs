import { readRecordInput, validateRecordInput } from "@/entities/record/model/form/record-form";
import {
  createRecordFormDraft,
  getErrorSlots,
  getRecordFormHint,
  isRecordDraftReady,
  toRecordFormData,
} from "@/widgets/record-form/model/record-form-draft";

import assert from "node:assert/strict";
import { test } from "node:test";

const REGION = { code: "1144000000", fullName: "서울 마포구", label: "마포구", latitude: 37.5, longitude: 127 };

test("빈 초안은 장소와 한 일을 비어 있는 칸으로 알려준다", () => {
  const draft = createRecordFormDraft("2026-11-24");
  const { fieldErrors } = validateRecordInput(readRecordInput(toRecordFormData(draft)));

  assert.equal(isRecordDraftReady(draft), false);
  assert.deepEqual(getErrorSlots(fieldErrors), ["where", "activity"]);
  assert.equal(getRecordFormHint(draft, fieldErrors), "다녀온 곳을 골라주세요.");
  assert.equal(getRecordFormHint({ ...draft, regions: [REGION] }, { activity: "오류" }), "뭐 했는지 적어주세요.");
});

test("초안의 값은 최종 저장 검증까지 그대로 간다", () => {
  const draft = {
    ...createRecordFormDraft("2026-11-24"),
    activity: "둘이서 떠난 여행",
    category: ["travel"],
    recordedUntil: "2026-11-26",
    regions: [REGION],
  };
  const { data } = validateRecordInput(readRecordInput(toRecordFormData(draft)));

  assert.equal(isRecordDraftReady(draft), true);
  assert.deepEqual(data.category, ["travel"]);
  assert.equal(data.recordedUntil, "2026-11-26");
  assert.deepEqual(data.regions, [{ code: "1144000000", label: "마포구", name: "서울 마포구" }]);
});

test("수정 화면의 하루 기록(종료일 없음)도 저장할 수 있다", () => {
  const draft = { ...createRecordFormDraft("2026-11-24"), activity: "산책", recordedUntil: null, regions: [REGION] };
  assert.equal(validateRecordInput(readRecordInput(toRecordFormData(draft))).fieldErrors, undefined);
});
