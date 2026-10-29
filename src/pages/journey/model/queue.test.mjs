import { enqueueJourneyPlace, skipJourneyPlace } from "./queue.ts";
import assert from "node:assert/strict";
import { test } from "node:test";

const a = { id: "a" },
  b = { id: "b" },
  c = { id: "c" };
test("도착 전 선택은 순서대로 대기하고 이미 고른 곳은 다시 넣지 않는다", () => {
  let state = { current: null, active: null, queue: [], segments: [], status: "loading" };
  state = enqueueJourneyPlace(state, a);
  state = enqueueJourneyPlace(state, a);
  state = enqueueJourneyPlace(state, b);
  state = enqueueJourneyPlace(state, a);
  assert.deepEqual(state.queue, [a, b]);
});
test("실패한 B를 건너뛰면 A를 현재 위치로 유지하고 C가 다음 목적지가 된다", () => {
  const state = skipJourneyPlace({ current: a, active: b, queue: [c], segments: [], status: "error" });
  assert.equal(state.current, a);
  assert.equal(state.active, c);
  assert.deepEqual(state.queue, []);
  assert.equal(state.status, "loading");
});
test("선이 그려진 장소는 현재 위치든 이전 장소든 다시 눌러도 변경하지 않는다", () => {
  const state = {
    current: b,
    active: null,
    queue: [],
    segments: [{ target: null }, { target: a }, { target: b }],
    status: "idle",
  };
  assert.equal(enqueueJourneyPlace(state, b), state);
  assert.equal(enqueueJourneyPlace(state, a), state);
  assert.equal(enqueueJourneyPlace(state, c).active, c);
});
test("A를 누르고 바로 B를 누르면 A가 진행되는 동안 B가 대기해 둘 다 그려진다", () => {
  let state = { current: null, active: null, queue: [], segments: [], status: "idle" };
  state = enqueueJourneyPlace(state, a);
  assert.equal(state.active, a);
  assert.equal(state.status, "loading");
  state = enqueueJourneyPlace(state, b);
  assert.deepEqual(state.queue, [b]);
});
