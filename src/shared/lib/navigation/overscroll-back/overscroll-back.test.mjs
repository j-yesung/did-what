import { getOverscrollBackDistance, isAtScrollEnd } from "./overscroll-back.ts";
import assert from "node:assert/strict";
import test from "node:test";

test("위로 당긴 수직 제스처만 거리로 센다", () => {
  const start = { x: 100, y: 500 };

  assert.equal(getOverscrollBackDistance(start, { x: 100, y: 410 }), 90);
  assert.equal(getOverscrollBackDistance(start, { x: 100, y: 320 }), 180);
  assert.equal(getOverscrollBackDistance(start, { x: 180, y: 450 }), 0);
  assert.equal(getOverscrollBackDistance(start, { x: 100, y: 540 }), 0);
});

test("같은 제스처에서 컨테이너가 스크롤한 거리를 제외한 추가 이동만 센다", () => {
  const start = { x: 100, y: 500 };

  assert.equal(getOverscrollBackDistance(start, { x: 100, y: 290 }, 120), 90);
  assert.equal(getOverscrollBackDistance(start, { x: 100, y: 400 }, 120), 0);
});

test("소수점 위치와 iOS 오버스크롤을 포함해 문서 끝을 판정한다", () => {
  assert.equal(isAtScrollEnd(1200, 700, 496.5), true);
  assert.equal(isAtScrollEnd(1200, 700, 490), false);
  assert.equal(isAtScrollEnd(1200, 700, 520), true);
  assert.equal(isAtScrollEnd(700, 700, -20), true);
});
