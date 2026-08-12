import { validateRecordInput } from "./record-form.ts";
import assert from "node:assert/strict";

const personId = "0198a393-4df4-4aed-894f-12b13a075e71";
const placeId = "0198a394-4df4-4aed-894f-12b13a075e72";
const valid = validateRecordInput({
  recordedAt: "2026-08-10",
  personIds: [personId, personId],
  placeId,
  activity: "  카페에서 이야기함  ",
  memo: "   ",
});

assert.deepEqual(valid, {
  data: {
    recordedAt: "2026-08-10",
    personIds: [personId],
    placeId,
    activity: "카페에서 이야기함",
  },
});

const invalid = validateRecordInput({
  recordedAt: "2026-02-30",
  personIds: [],
  placeId: "other",
  activity: " ",
  memo: "",
});
assert.deepEqual(Object.keys(invalid.fieldErrors ?? {}).sort(), ["activity", "personIds", "placeId", "recordedAt"]);
