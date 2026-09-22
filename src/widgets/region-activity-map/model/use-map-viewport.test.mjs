import assert from "node:assert/strict";

const { focusMapView, INITIAL_MAP_VIEW, MAX_MAP_ZOOM, pinchMapView } = await import("./use-map-viewport.ts");

const map = { height: 800, width: 400 };

assert.deepEqual(INITIAL_MAP_VIEW, { zoom: 1, x: 0, y: 0 });

const maximumZoom = pinchMapView(map, INITIAL_MAP_VIEW, { x: 200, y: 400 }, { x: 200, y: 400 }, 100);
assert.equal(maximumZoom.zoom, MAX_MAP_ZOOM);
assert.deepEqual(maximumZoom, { zoom: 4, x: 150, y: 300 });

assert.deepEqual(focusMapView(map, { x: 0, y: 0 }), { zoom: 4, x: 0, y: 0 });
assert.deepEqual(focusMapView(map, { x: 400, y: 800 }), { zoom: 4, x: 300, y: 600 });

assert.deepEqual(pinchMapView(map, INITIAL_MAP_VIEW, { x: 200, y: 400 }, { x: 200, y: 400 }, 2), {
  zoom: 2,
  x: 100,
  y: 200,
});
const movedPinch = pinchMapView(map, INITIAL_MAP_VIEW, { x: 200, y: 400 }, { x: 240, y: 440 }, 2);
assert.equal(movedPinch.zoom, 2);
assert.ok(Math.abs(movedPinch.x - 80) < 1e-8);
assert.ok(Math.abs(movedPinch.y - 180) < 1e-8);
