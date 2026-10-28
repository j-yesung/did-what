import { enqueueJourneyPlace, skipJourneyPlace } from "./queue.ts";
import assert from "node:assert/strict";
import { test } from "node:test";

const a = { id: "a" },
  b = { id: "b" },
  c = { id: "c" };
test("도착 전 선택은 순서대로 대기하고 바로 같은 곳을 재선택하면 중복하지 않는다", () => {
  let state = { current: null, active: null, queue: [], status: "loading" };
  state = enqueueJourneyPlace(state, a);
  state = enqueueJourneyPlace(state, a);
  state = enqueueJourneyPlace(state, b);
  state = enqueueJourneyPlace(state, a);
  assert.deepEqual(state.queue, [a, b, a]);
});
test("실패한 B를 건너뛰면 A를 현재 위치로 유지하고 C가 다음 목적지가 된다", () => {
  const state = skipJourneyPlace({ current: a, active: b, queue: [c], status: "error" });
  assert.equal(state.current, a);
  assert.equal(state.active, c);
  assert.deepEqual(state.queue, []);
  assert.equal(state.status, "loading");
});
test("현재 위치를 다시 누르면 변경하지 않지만 이전 장소로 돌아갈 수 있다", () => {
  const state = { current: b, active: null, queue: [], status: "idle" };
  assert.equal(enqueueJourneyPlace(state, b), state);
  assert.equal(enqueueJourneyPlace(state, a).active, a);
});
