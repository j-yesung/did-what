import {
  INITIAL_PLACE_PICKER_SELECTION,
  isQueuedAddReady,
  reducePlacePickerSelection,
} from "./place-picker-selection.ts";
import assert from "node:assert/strict";
import test from "node:test";

const run = (...actions) => actions.reduce(reducePlacePickerSelection, INITIAL_PLACE_PICKER_SELECTION);

test("확인 중인 장소를 다시 누르면 대기에서 빠지고, 다시 고르면 새로 확인한다", () => {
  assert.deepEqual([...run({ key: "kakao:1", type: "request" }).pending], ["kakao:1"]);
  assert.equal(run({ key: "kakao:1", type: "request" }, { key: "kakao:1", type: "cancel" }).pending.size, 0);
  const state = run(
    { key: "kakao:1", type: "request" },
    { key: "kakao:1", type: "cancel" },
    { key: "kakao:1", type: "request" },
  );
  assert.deepEqual([...state.pending], ["kakao:1"]);
  assert.equal(run({ key: "kakao:1", type: "cancel" }), INITIAL_PLACE_PICKER_SELECTION);
});

test("확인 중 누른 추가는 마지막 확인이 끝나야 실행된다", () => {
  const waiting = run({ key: "kakao:1", type: "request" }, { key: "kakao:2", type: "request" }, { type: "queueAdd" });
  assert.equal(isQueuedAddReady(waiting), false);
  const half = reducePlacePickerSelection(waiting, { key: "kakao:1", type: "settle" });
  assert.equal(isQueuedAddReady(half), false);
  const done = reducePlacePickerSelection(half, { key: "kakao:2", type: "settle" });
  assert.equal(isQueuedAddReady(done), true);
  assert.equal(done.error, undefined);
  assert.equal(reducePlacePickerSelection(done, { type: "addDone" }).addQueued, false);
});

test("확인이 하나라도 실패하면 오류를 남기고, 새로 고르면 오류를 지운다", () => {
  const failed = run(
    { key: "kakao:1", type: "request" },
    { key: "kakao:2", type: "request" },
    { type: "queueAdd" },
    { error: "다시 선택해 주세요", key: "kakao:1", type: "settle" },
    { key: "kakao:2", type: "settle" },
  );
  assert.equal(isQueuedAddReady(failed), true);
  assert.equal(failed.error, "다시 선택해 주세요");
  assert.equal(reducePlacePickerSelection(failed, { key: "kakao:3", type: "request" }).error, undefined);
});
