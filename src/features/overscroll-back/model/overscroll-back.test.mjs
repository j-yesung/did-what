import { getOverscrollBackProgress, isAtScrollEnd } from "./overscroll-back.ts";
import assert from "node:assert/strict";
import test from "node:test";

test("화면 끝에서 위로 120px 이상 당긴 수직 제스처만 뒤로가기를 활성화한다", () => {
  const start = { x: 100, y: 500 };

  assert.equal(getOverscrollBackProgress(start, { x: 100, y: 440 }), 0.5);
  assert.equal(getOverscrollBackProgress(start, { x: 100, y: 380 }), 1);
  assert.equal(getOverscrollBackProgress(start, { x: 180, y: 450 }), 0);
  assert.equal(getOverscrollBackProgress(start, { x: 100, y: 540 }), 0);
});

test("소수점 위치와 iOS 오버스크롤을 포함해 문서 끝을 판정한다", () => {
  assert.equal(isAtScrollEnd(1200, 700, 496.5), true);
  assert.equal(isAtScrollEnd(1200, 700, 490), false);
  assert.equal(isAtScrollEnd(1200, 700, 520), true);
  assert.equal(isAtScrollEnd(700, 700, -20), true);
});
