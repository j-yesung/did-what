import assert from "node:assert/strict";

const { focusMapView, getHomeMapView, getMapSpace, pinchMapView } = await import("./use-map-viewport.ts");

// 폭 400 지도의 가운데 절반을 세로 2배 비율로 담는 첫 화면.
const map = { height: 800, width: 400 };
const frame = { height: 400, width: 200, x: 100, y: 200 };
const space = getMapSpace(map, frame);
const home = getHomeMapView(space, frame);

assert.deepEqual(home, { zoom: 2, x: 100, y: 200 });
assert.equal(space.maxZoom, 8, "첫 화면 기준 4배까지 확대한다.");

const maximumZoom = pinchMapView(space, home, { x: 200, y: 400 }, { x: 200, y: 400 }, 100);
assert.deepEqual(maximumZoom, { zoom: 8, x: 175, y: 350 });

assert.deepEqual(
  pinchMapView(space, home, { x: 200, y: 400 }, { x: 200, y: 400 }, 0.01),
  { zoom: 1, x: 0, y: 0 },
  "첫 화면보다 축소하면 지도 전체까지 보인다.",
);

assert.deepEqual(focusMapView(space, { x: 0, y: 0 }), { zoom: 8, x: 0, y: 0 });
assert.deepEqual(focusMapView(space, { x: 400, y: 800 }), { zoom: 8, x: 350, y: 700 });

const movedPinch = pinchMapView(space, home, { x: 200, y: 400 }, { x: 220, y: 440 }, 2);
assert.equal(movedPinch.zoom, 4);
assert.ok(Math.abs(movedPinch.x - 140) < 1e-8);
assert.ok(Math.abs(movedPinch.y - 280) < 1e-8);

// 보이는 영역이 지도보다 긴 축은 가운데에 둔다.
const wideSpace = getMapSpace({ height: 300, width: 400 }, frame);
assert.deepEqual(getHomeMapView(wideSpace, frame), { zoom: 2, x: 100, y: -50 });
