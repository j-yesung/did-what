import { createRecordInput } from "./record-form.ts";
import assert from "node:assert/strict";

const recordInput = createRecordInput({
  recordedAt: "2026-08-10",
  personIds: ["person-da-yeon", "person-min-jun"],
  placeId: "place-seongsu-cafe-street",
  activity: "  카페에서 이야기함  ",
  memo: "   ",
});

assert.deepEqual(recordInput, {
  recordedAt: "2026-08-10",
  personIds: ["person-da-yeon", "person-min-jun"],
  placeId: "place-seongsu-cafe-street",
  activity: "카페에서 이야기함",
});
