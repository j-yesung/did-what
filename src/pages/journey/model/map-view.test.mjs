import {
  clampViewWidth,
  constrainView,
  momentumView,
  national,
  placeLabels,
  placesBox,
  project,
  routeBox,
  toViewPoint,
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
