import assert from "node:assert/strict";

const { createKoreaMap, getActivityLevel } = await import("./korea-map.ts");

assert.deepEqual([0, 1, 2, 4, 7].map(getActivityLevel), [0, 1, 2, 3, 4]);

const map = createKoreaMap([
  { id: "seoul-1", latitude: 37.5445, longitude: 127.0557 },
  { id: "seoul-2", latitude: 37.5448, longitude: 127.0562 },
  { id: "jeju-1", latitude: 33.4996, longitude: 126.5312 },
]);

assert.ok(map.cells.length > 500, "대한민국 실루엣은 500개 이상의 cell이어야 합니다.");
assert.ok(
  map.cells.some((cell) => cell.regionCode === "KR-49"),
  "제주도 cell이 포함되어야 합니다.",
);
assert.equal(map.cells.filter((cell) => cell.count > 0).length, 2);

process.stdout.write(`${map.cells.length} cells, ${map.columns} × ${map.rows} grid\n`);
