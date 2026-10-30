import { circlesPath, dotStep, firstLit, landDots, spotRadius, toShape } from "./dot-map.ts";
import assert from "node:assert/strict";
import { test } from "node:test";

const square = toShape([-1, -1, 21, -1, 21, 21, -1, 21]);
const everywhere = { x: -50, y: -50, width: 120, height: 120 };

test("점은 땅 안의 격자에만 찍고, 다녀온 곳에서 가장 가까운 점만 밝힌다", () => {
  const dots = landDots([square], [{ x: 5, y: 5, weight: 1 }], everywhere, 2.5);
  assert.equal(dots.length, 81);
  assert.ok(dots.every((dot) => dot.x >= 0 && dot.x <= 20 && dot.y >= 0 && dot.y <= 20));

  const radius = spotRadius(2.5);
  const lit = dots.filter((dot) => dot.level >= 0);
  assert.ok(lit.length > 0);
  assert.ok(lit.every((dot) => Math.hypot(dot.x - 5, dot.y - 5) <= radius));
  assert.ok(dots.filter((dot) => Math.hypot(dot.x - 5, dot.y - 5) > radius).every((dot) => dot.level === -1));
  assert.deepEqual(
    lit.map(({ x, y }) => [x, y]),
    [[5, 5]],
  );
  assert.ok(landDots([square], [], everywhere, 2.5).every((dot) => dot.level === -1));
  const once = landDots([square], [{ x: 5, y: 5, weight: 0.5 }], everywhere, 2.5);
  const often = landDots([square], Array(3).fill({ x: 5, y: 5, weight: 0.5 }), everywhere, 2.5);
  const at = (list) => list.find((dot) => dot.x === 5 && dot.y === 5).level;
  assert.ok(at(often) > at(once));
});

test("격자보다 작은 섬도 점 하나는 남기고, 화면 밖 땅은 계산하지 않는다", () => {
  const islet = toShape([3.1, 3.1, 3.3, 3.1, 3.3, 3.3, 3.1, 3.3]);
  assert.deepEqual(
    landDots([islet], [], { x: 0, y: 0, width: 10, height: 10 }, 2.5).map(({ x, y }) => [+x.toFixed(2), +y.toFixed(2)]),
    [[3.2, 3.2]],
  );
  assert.equal(landDots([square], [], { x: 50, y: 50, width: 10, height: 10 }, 2.5).length, 0);
});

test("확대할수록 점 간격이 절반씩 줄어 화면에서 비슷한 간격을 유지한다", () => {
  assert.equal(dotStep(0.5), 5.6);
  assert.equal(dotStep(0.25), 2.8);
  assert.ok(dotStep(0.001) / 0.001 >= 11 && dotStep(0.001) / 0.001 < 22);
  assert.equal(circlesPath([{ x: 1, y: 2 }], 0.5), "M0.500 2.000a0.500 0.500 0 1 0 1.000 0a0.500 0.500 0 1 0 -1.000 0");
});

test("먼저 다녀온 기록이 같은 점을 켜 두지 않았을 때만 처음 밝힌 곳으로 본다", () => {
  const spot = { x: 5.4, y: 4.6, weight: 0.5 };
  assert.ok(firstLit(spot, [], 2.5));
  assert.ok(firstLit(spot, [{ x: 9, y: 9, weight: 0.5 }], 2.5));
  assert.ok(!firstLit(spot, [{ x: 4.9, y: 5.2, weight: 0.5 }], 2.5));
  assert.ok(firstLit(spot, [{ x: 4.9, y: 5.2, weight: 0.5 }], 0.35), "확대해서 점이 갈라지면 처음 밝힌 곳이 된다");
});
