import { getRegion, getRegionCode, REGIONS } from "./region.ts";
import assert from "node:assert/strict";

const { createRegionActivityMaps, getActivityLevel } = await import("./korea-map.ts");

assert.deepEqual([0, 1, 2, 4, 7].map(getActivityLevel), [0, 1, 2, 3, 4]);

const emptyRegions = createRegionActivityMaps([]);
assert.equal(REGIONS.length, 16);
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

const emptyIntegratedCity = emptyRegions.find(({ code }) => code === "KR-12");
assert.ok(emptyIntegratedCity);
assert.equal(emptyIntegratedCity.name, "전남광주통합특별시");
assert.equal(emptyIntegratedCity.totalCount, 27);

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
assert.equal(partialSeoul.cells.filter(({ count }) => count > 0).length, 1);
assert.equal(partialSeoul.cells.find(({ count }) => count === 2)?.level, 2);
assert.equal(fullSeoul.visitedCount, fullSeoul.totalCount);

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
assert.equal(getRegionCode("5011025000"), "KR-49");
assert.equal(getRegionCode("1211000000"), "KR-12");
assert.equal(getRegionCode("2911010100"), "KR-12");
assert.equal(getRegionCode("4611010100"), "KR-12");
assert.equal(getRegion("KR-29")?.code, "KR-12");
assert.equal(getRegion("KR-46")?.code, "KR-12");
assert.equal(
  createRegionActivityMaps([
    {
      administrativeCode: "1211000000",
      id: "mokpo",
      latitude: 34.8120715259044,
      longitude: 126.41184491201,
    },
  ]).find(({ code }) => code === "KR-12")?.visitedCount,
  1,
);

// 지역 지도는 윤곽이 딱 맞는 틀에 그리고, 기록 칸 가운데도 모두 그 틀 안에 놓인다.
for (const regionMap of emptyRegions) {
  assert.ok(regionMap.path.startsWith("M"), `${regionMap.name} 윤곽`);
  assert.ok(
    regionMap.cells.every(
      ({ x, y }) => x + 2.2 >= 0 && x + 2.2 <= regionMap.width && y + 2.2 >= 0 && y + 2.2 <= regionMap.height,
    ),
    `${regionMap.name} 칸이 틀 안에 있다.`,
  );
}
