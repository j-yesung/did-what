import {
  clampViewWidth,
  constrainView,
  expandView,
  followBox,
  momentumView,
  national,
  partialPathData,
  pathLengths,
  project,
  routeBox,
  toPathData,
  toViewPoint,
  viewScale,
  viewTransform,
} from "./map-view.ts";
import assert from "node:assert/strict";
import { test } from "node:test";

const a = { id: "a", name: "성수 카페", longitude: 127.04, latitude: 37.54 };

test("짧은 구간도 실제 경로의 가운데에 맞춘다", () => {
  const point = project(a.longitude, a.latitude);
  const view = routeBox([{ points: [[a.longitude, a.latitude]], distance: 0, duration: 0 }]);
  assert.ok(Math.abs(view.x + view.width / 2 - point.x) < 1e-9);
  assert.ok(Math.abs(view.y + view.height / 2 - point.y) < 1e-9);
});

test("관성은 시간 기준으로 같은 지점에 도달하고 지도 경계를 벗어나지 않는다", () => {
  const velocity = { x: 0.02, y: 0.01 };
  const at60Hz = momentumView(national, velocity, 600);
  const middle = momentumView(national, velocity, 300);
  assert.ok(national.x > middle.x && middle.x > at60Hz.x);
  const earlyDistance = national.x - middle.x;
  const laterDistance = middle.x - at60Hz.x;
  assert.ok(earlyDistance > laterDistance);
  assert.ok(Math.abs(momentumView(national, velocity, 900).x - at60Hz.x) < 1);
  const far = constrainView({ ...national, x: 99999, y: -99999 });
  assert.ok(far.x < 1000 && far.y > -1000);
  assert.deepEqual(routeBox([]), national);
});

test("화면 가운데를 누르면 지도 범위의 가운데를 고른다", () => {
  const rect = { left: 10, top: 20, width: 390, height: 844 };
  const point = toViewPoint(national, rect, 10 + 195, 20 + 422);
  assert.ok(Math.abs(point.x - (national.x + national.width / 2)) < 1e-9);
  assert.ok(Math.abs(point.y - (national.y + national.height / 2)) < 1e-9);
  assert.equal(clampViewWidth(0), 0.02);
  assert.equal(clampViewWidth(1000), 400);
});

test("제목과 하단 패널 사이 빈 공간에 경로를 맞춘다", () => {
  const frame = { width: 390, height: 844, top: 320, bottom: 220 };
  const route = {
    points: [
      [127.0, 37.5],
      [127.4, 36.4],
    ],
    distance: 0,
    duration: 0,
  };
  const view = routeBox([route], frame);
  const scale = view.width / frame.width;
  const toScreenY = (latitude) => (project(127, latitude).y - view.y) / scale;
  assert.ok(Math.abs(view.height / view.width - frame.height / frame.width) < 1e-9);
  assert.ok(toScreenY(37.5) >= frame.top + 40 - 1e-6);
  assert.ok(toScreenY(36.4) <= frame.height - frame.bottom - 20 + 1e-6);
  assert.equal(followBox(view, route, frame), null);
});

test("그리는 중인 선은 지나온 길이만큼만 경로를 자른다", () => {
  const points = [
    { x: 0, y: 0 },
    { x: 3, y: 0 },
    { x: 3, y: 4 },
  ];
  const lengths = pathLengths(points);
  assert.deepEqual(lengths, [0, 3, 7]);
  assert.equal(partialPathData(points, lengths, 0, 1), "M0,0L0,0");
  assert.equal(partialPathData(points, lengths, 5, 1), "M0,0L2,0Q3,0 3,1L3,2");
  assert.equal(partialPathData(points, lengths, 7, 1), toPathData(points, 1));
});

test("경로 모서리는 짧은 곡선으로 잇고 시작점과 도착점은 유지한다", () => {
  const points = [
    { x: 0, y: 0 },
    { x: 40, y: 0 },
    { x: 40, y: 40 },
  ];
  assert.equal(toPathData(points, 8), "M0,0L32,0Q40,0 40,8L40,40");
  assert.equal(toPathData(points, 16), "M0,0L24,0Q40,0 40,16L40,40");
  assert.equal(toPathData(points, 100), "M0,0L20,0Q40,0 40,20L40,40");
});

test("이어지는 곡선은 짧은 구간의 절반 안에서 만나 경로를 역주행하지 않는다", () => {
  const points = [
    { x: 0, y: 0 },
    { x: 40, y: 0 },
    { x: 40, y: 4 },
    { x: 80, y: 4 },
  ];
  assert.equal(toPathData(points, 16), "M0,0L38,0Q40,0 40,2L40,2Q40,4 42,4L80,4");
  assert.equal(partialPathData(points, pathLengths(points), 84, 16), toPathData(points, 16));
});

test("빈 경로와 직선, 중복 좌표에도 유효한 경로를 만든다", () => {
  assert.equal(toPathData([], 8), "");
  assert.equal(toPathData([{ x: 0, y: 0 }], 8), "M0,0");
  assert.equal(
    toPathData(
      [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
      ],
      8,
    ),
    "M0,0L10,0",
  );
  assert.equal(
    toPathData(
      [
        { x: 0, y: 0 },
        { x: 0, y: 0 },
        { x: 10, y: 0 },
      ],
      8,
    ),
    "M0,0L0,0Q0,0 0,0L10,0",
  );
});

test("가까운 장소 사이 구간은 화면 폭이 지도 단위 3보다 좁아지게 확대하지 않는다", () => {
  const route = {
    points: [
      [127.04, 37.54],
      [127.041, 37.541],
    ],
    distance: 0,
    duration: 0,
  };
  const frame = { width: 390, height: 844, top: 200, bottom: 220 };
  assert.ok(routeBox([route], frame).width >= 3 - 1e-9);
  assert.ok(routeBox([route]).width >= 3 - 1e-9);
});

test("움직이는 동안의 화면 이동은 그려 둔 지도를 같은 자리로 옮기는 변환과 같다", () => {
  const viewport = { width: 400, height: 800 };
  const rendered = { x: 100, y: 50, width: 20, height: 40 };
  const live = { x: 104, y: 52, width: 10, height: 20 };
  const { scale, x, y } = viewTransform(rendered, live, viewport);
  const screen = (view, point) => ({
    x: viewport.width / 2 + (point.x - (view.x + view.width / 2)) / viewScale(view, viewport),
    y: viewport.height / 2 + (point.y - (view.y + view.height / 2)) / viewScale(view, viewport),
  });
  const point = { x: 108, y: 61 };
  const before = screen(rendered, point);
  const after = screen(live, point);
  assert.ok(Math.abs(viewport.width / 2 + scale * (before.x - viewport.width / 2) + x - after.x) < 1e-9);
  assert.ok(Math.abs(viewport.height / 2 + scale * (before.y - viewport.height / 2) + y - after.y) < 1e-9);
  assert.deepEqual(expandView(rendered, 1.5), { x: 95, y: 40, width: 30, height: 60 });
});
