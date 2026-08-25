import assert from "node:assert/strict";

const {
  createKoreaMap,
  createRegionActivityMaps,
  filterRecordsByRegion,
  getActivityLevel,
  getRegionCode,
  getRegionProgressLabel,
  REGIONS,
} = await import("./korea-map.ts");

assert.deepEqual([0, 1, 2, 4, 7].map(getActivityLevel), [0, 1, 2, 3, 4]);

const emptyMap = createKoreaMap([]);
assert.equal(
  emptyMap.cells.every((cell) => cell.count === 0),
  true,
);

const emptyRegions = createRegionActivityMaps([]);
assert.equal(REGIONS.length, 17);
assert.deepEqual(
  emptyRegions.map(({ code }) => code),
  REGIONS.map(({ code }) => code),
);
assert.equal(
  emptyRegions.reduce((total, region) => total + region.totalCount, 0),
  288,
);
assert.equal(
  emptyRegions.every(({ cells, totalCount, visitedCount }) => cells.length > 0 && totalCount > 0 && visitedCount === 0),
  true,
);
assert.equal(
  emptyRegions.every(({ cells, totalCount }) => cells.length >= totalCount && cells.length < 100),
  true,
  "지역 미니 지도는 하위 지역 수 이상, 100개 미만의 셀로 표현합니다.",
);

const emptySeoul = emptyRegions.find(({ code }) => code === "KR-11");
assert.ok(emptySeoul);
assert.equal(emptySeoul.totalCount, 25);
assert.ok(emptySeoul.cells.length > emptySeoul.totalCount, "서울 미니 지도는 자치구 수보다 촘촘해야 합니다.");
assert.equal(getRegionProgressLabel(emptySeoul), `0 / ${emptySeoul.totalCount} · 미기록`);

const seoulCellRecords = Array.from({ length: emptySeoul.totalCount }, (_, index) => {
  const cell = emptySeoul.cells[index % emptySeoul.cells.length];
  return {
    administrativeCode: `11${String(index + 1).padStart(3, "0")}00000`,
    id: `seoul-district-${index + 1}`,
    latitude: cell.latitude,
    longitude: cell.longitude,
  };
});
const partialSeoul = createRegionActivityMaps([seoulCellRecords[0], { ...seoulCellRecords[0], id: "duplicate" }]).find(
  ({ code }) => code === "KR-11",
);
const fullSeoul = createRegionActivityMaps(seoulCellRecords).find(({ code }) => code === "KR-11");
assert.ok(partialSeoul);
assert.ok(fullSeoul);
assert.equal(partialSeoul.visitedCount, 1);
assert.equal(
  getRegionProgressLabel(partialSeoul),
  `1 / ${partialSeoul.totalCount} · ${partialSeoul.totalCount - 1}곳 남음`,
);
assert.equal(fullSeoul.visitedCount, fullSeoul.totalCount);
assert.equal(getRegionProgressLabel(fullSeoul), `${fullSeoul.totalCount} / ${fullSeoul.totalCount} · 모두 채움`);

const sejongRecords = [
  { administrativeCode: "3611011900", id: "sejong-dong", latitude: 36.51, longitude: 127.28 },
  { administrativeCode: "3611025000", id: "jochiewon", latitude: 36.6, longitude: 127.3 },
];
assert.equal(createRegionActivityMaps(sejongRecords).find(({ code }) => code === "KR-50")?.visitedCount, 2);

const regionalRecords = [
  { id: "seoul", region_code: "1111010100" },
  { id: "busan", region_code: "2611010100" },
];
assert.equal(getRegionCode(regionalRecords[0].region_code), "KR-11");
assert.equal(getRegionCode("3611010100"), "KR-50");
assert.equal(getRegionCode("5111010100"), "KR-42");
assert.equal(getRegionCode("5211010100"), "KR-45");
assert.deepEqual(
  filterRecordsByRegion(regionalRecords, "KR-11").map(({ id }) => id),
  ["seoul"],
);

const map = createKoreaMap([
  ...Array.from({ length: 7 }, (_, index) => ({
    id: `seoul-${index + 1}`,
    latitude: 37.5445,
    longitude: 127.0557,
  })),
  { id: "jeju-1", latitude: 33.4996, longitude: 126.5312 },
]);

assert.ok(map.cells.length > 500, "대한민국 실루엣은 500개 이상의 cell이어야 합니다.");
assert.ok(
  map.cells.some((cell) => cell.regionCode === "KR-49"),
  "제주도 cell이 포함되어야 합니다.",
);
assert.equal(map.cells.filter((cell) => cell.count > 0).length, 2);
assert.equal(map.cells.find((cell) => cell.count === 7)?.level, 4);

process.stdout.write(`${map.cells.length} cells, ${map.columns} × ${map.rows} grid\n`);
