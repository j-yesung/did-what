import {
  clampViewWidth,
  constrainView,
  expandView,
  followBox,
  momentumView,
  national,
  partialPathData,
  pathLengths,
  placeLabels,
  placesBox,
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
const b = { id: "b", name: "성수 사진관", longitude: 127.041, latitude: 37.541 };

test("짧은 구간도 실제 경로의 가운데에 맞춘다", () => {
  const point = project(a.longitude, a.latitude);
  const view = routeBox([{ points: [[a.longitude, a.latitude]], distance: 0, duration: 0 }]);
  assert.ok(Math.abs(view.x + view.width / 2 - point.x) < 1e-9);
  assert.ok(Math.abs(view.y + view.height / 2 - point.y) < 1e-9);
});

test("이름이 겹치면 묶고, 확대해서 공간이 생기면 나눈다", () => {
  const point = project(a.longitude, a.latitude);
  const view = { x: point.x - 10, y: point.y - 10, width: 20, height: 40 };
  const labels = placeLabels([a, b, a], view, 0.1, 390);
  assert.equal(labels.length, 1);
  assert.deepEqual(
    labels[0].places.map(({ id }) => id),
    ["a", "b"],
  );
  const zoomed = placesBox([a, b], { width: 390, height: 844 });
  assert.equal(placeLabels([a, b], zoomed, zoomed.width / 390, 390).length, 2);
});

test("긴 이름도 화면 오른쪽 끝을 넘지 않는다", () => {
  const point = project(a.longitude, a.latitude);
  const view = { x: point.x - 20, y: point.y - 10, width: 21, height: 40 };
  const [label] = placeLabels([{ ...a, name: "성수동에서아주긴이름을가진카페와작업실" }], view, 0.06, 350);
  const right = view.x + view.width / 2 + (350 * 0.06) / 2 - 12 * 0.06;
  assert.ok(label.x + label.width <= right + 1e-9);
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
  assert.equal(partialPathData(points, lengths, 0), "M0,0L0,0");
  assert.equal(partialPathData(points, lengths, 5), "M0,0L3,0L3,2");
  assert.equal(partialPathData(points, lengths, 7), toPathData(points));
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

test("움직이는 동안에는 멈췄던 화면의 묶음을 유지하고 위치만 지금 화면에 맞춘다", () => {
  const point = project(a.longitude, a.latitude);
  const wide = { x: point.x - 19.5, y: point.y - 42.2, width: 39, height: 84.4 };
  const zoomed = placesBox([a, b], { width: 390, height: 844 });
  const zoomedUnit = zoomed.width / 390;
  const held = placeLabels([a, b], zoomed, zoomedUnit, 390, { view: wide, unit: 0.1 });
  assert.equal(held.length, 1);
  assert.ok(Math.abs(held[0].y - (point.y - 38 * zoomedUnit)) < 1e-9);
  assert.equal(placeLabels([a, b], zoomed, zoomedUnit, 390).length, 2);
});
