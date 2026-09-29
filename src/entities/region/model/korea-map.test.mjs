import assert from "node:assert/strict";

const {
  createKoreaMap,
  createRegionActivityMaps,
  filterRecordsByRegion,
  getActivityLevel,
  getKoreaMapFrame,
  getKoreaMapPosition,
  getRegion,
  getRegionCode,
  getRegionProgressLabel,
  KOREA_MAP_REGION_PATHS,
  REGIONS,
} = await import("./korea-map.ts");

assert.deepEqual([0, 1, 2, 4, 7].map(getActivityLevel), [0, 1, 2, 3, 4]);

const emptyMap = createKoreaMap([]);
for (const cell of emptyMap.cells) {
  const position = getKoreaMapPosition(cell);
  assert.ok(position);
  assert.ok(Math.abs(position.x - (cell.x + 2.2)) < 1e-8, "경도를 해당 셀의 중심으로 변환합니다.");
  assert.ok(Math.abs(position.y - (cell.y + 2.2)) < 1e-8, "위도를 해당 셀의 중심으로 변환합니다.");
}
assert.equal(getKoreaMapPosition({ latitude: 35.68, longitude: 139.69 }), null);
assert.equal(getKoreaMapPosition({ latitude: 34.2, longitude: 129.3 }), null, "대마도는 지도 범위에서 제외합니다.");
assert.equal(getKoreaMapPosition({ latitude: 36, longitude: 125.5 }), null, "서해는 지도 범위에서 제외합니다.");
assert.equal(getKoreaMapPosition({ latitude: Number.NaN, longitude: 127 }), null);
assert.equal(getKoreaMapPosition({ latitude: 37, longitude: Number.POSITIVE_INFINITY }), null);
assert.equal(
  emptyMap.cells.every((cell) => cell.count === 0),
  true,
);

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
assert.equal(getRegionProgressLabel(emptySeoul), `시·군·구 0 / ${emptySeoul.totalCount} · 미기록`);

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
assert.equal(
  getRegionProgressLabel(partialSeoul),
  `시·군·구 1 / ${partialSeoul.totalCount} · ${partialSeoul.totalCount - 1}곳 남음`,
);
assert.equal(fullSeoul.visitedCount, fullSeoul.totalCount);
assert.equal(
  getRegionProgressLabel(fullSeoul),
  `시·군·구 ${fullSeoul.totalCount} / ${fullSeoul.totalCount} · 모두 채움`,
);

assert.equal(
  getRegionProgressLabel({ code: "KR-50", totalCount: 33, visitedCount: 2 }),
  "읍·면·동 2 / 33 · 31곳 남음",
  "세종은 읍·면·동을 센다.",
);

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
assert.equal(getRegionCode("1211000000"), "KR-12");
assert.equal(getRegionCode("2911010100"), "KR-12");
assert.equal(getRegionCode("4611010100"), "KR-12");
assert.equal(getRegion("KR-29")?.code, "KR-12");
assert.equal(getRegion("KR-46")?.code, "KR-12");
assert.deepEqual(
  filterRecordsByRegion(regionalRecords, "KR-11").map(({ id }) => id),
  ["seoul"],
);

const mokpoRecord = { id: "mokpo", region_code: "1211000000" };
assert.deepEqual(filterRecordsByRegion([mokpoRecord], "KR-12"), [mokpoRecord]);
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
assert.ok(
  map.cells.some((cell) => cell.regionCode === "KR-12"),
  "전남광주통합특별시 cell이 포함되어야 합니다.",
);
assert.equal(map.cells.filter((cell) => cell.count > 0).length, 2);
assert.equal(map.cells.find((cell) => cell.count === 7)?.level, 4);

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

// 먼 섬은 첫 화면 틀(본토와 제주) 안으로 옮겨 그리고, 섬 위의 기록과 칸도 함께 옮긴다.
const homeFrame = getKoreaMapFrame({ east: 129.7, north: 38.7, south: 33.1, west: 126 });
const isInside = ({ x, y }) =>
  x >= homeFrame.x && x <= homeFrame.x + homeFrame.width && y >= homeFrame.y && y <= homeFrame.y + homeFrame.height;
assert.ok(isInside(getKoreaMapPosition({ latitude: 37.5, longitude: 130.87 })), "울릉도");
assert.ok(isInside(getKoreaMapPosition({ latitude: 37.96, longitude: 124.68 })), "백령도");
assert.ok(
  emptyMap.cells
    .filter((cell) => cell.longitude > 130.5 || cell.longitude < 125)
    .every((cell) => isInside({ x: cell.x + 2.2, y: cell.y + 2.2 })),
  "두 섬의 칸도 틀 안으로 옮긴다.",
);
assert.ok(
  KOREA_MAP_REGION_PATHS.some(({ code, key }) => code === "KR-28" && key === "KR-41:KR-28"),
  "경기로 잘못 든 백령도는 인천으로 연다.",
);

process.stdout.write(`${map.cells.length} cells, ${map.columns} × ${map.rows} grid\n`);
