import { arrivalLights, burstDots, circlesPath, dotStep, landDots, spotRadius, toShape } from "./dot-map.ts";
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

const visit = (recordId, placeId, recordedAt, createdAt, longitude = 128.6) => ({
  recordId,
  placeId,
  recordedAt,
  createdAt,
  latitude: 35.87,
  longitude,
});

test("같은 날 먼저 쓴 기록과 앞서 닿은 장소는 먼저 밝힌 곳으로 본다", () => {
  const visits = [
    visit("same-day-before", "x", "2026-10-01", "2026-10-01T09:00:00Z"),
    visit("same-day-after", "y", "2026-10-01", "2026-10-01T11:00:00Z", 128.7),
    visit("me", "a", "2026-10-01", "2026-10-01T10:00:00Z"),
    visit("me", "b", "2026-10-01", "2026-10-01T10:00:00Z", 128.7),
    visit("me", "c", "2026-10-01", "2026-10-01T10:00:00Z", 128.8),
  ];
  const toB = arrivalLights(visits, "me", [null, "a", "b"], [{ key: 1, target: { id: "b" } }]);
  assert.equal(toB[0].fresh.length, 1);
  assert.equal(toB[0].earlier.length, 2, "같은 날 먼저 쓴 기록과 앞서 닿은 a만 먼저 밝힌 곳이다");

  const toC = arrivalLights(visits, "me", [null, "a", "b", "c"], [{ key: 2, target: { id: "c" } }]);
  assert.equal(toC[0].earlier.length, 3, "c 앞에 닿은 a, b까지 먼저 밝힌 곳이다");
  assert.deepEqual(arrivalLights(visits, null, [], []), []);
});

test("반짝임은 이번에 켜진 점 중 먼저 켜진 적 없는 점에만 터지고, 땅에 점이 없으면 터지지 않는다", () => {
  const square = toShape([-1, -1, 11, -1, 11, 11, -1, 11]);
  const fresh = [{ x: 5, y: 5, weight: 0.5 }];
  const dots = landDots([square], fresh, { x: -5, y: -5, width: 20, height: 20 }, 2.5);
  assert.deepEqual(
    burstDots(dots, { key: 1, fresh, earlier: [] }, 2.5).map(({ x, y }) => [x, y]),
    [[5, 5]],
  );
  assert.equal(burstDots(dots, { key: 1, fresh, earlier: [{ x: 5.2, y: 4.9, weight: 0.5 }] }, 2.5).length, 0);

  const sea = [{ x: 30, y: 30, weight: 0.5 }];
  const seaDots = landDots([square], sea, { x: 20, y: 20, width: 20, height: 20 }, 2.5);
  assert.equal(burstDots(seaDots, { key: 1, fresh: sea, earlier: [] }, 2.5).length, 0);
});
