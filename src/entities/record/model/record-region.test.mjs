import { formatRecordRegionLabels, sortPrimaryRegionFirst } from "./record-region.ts";
import assert from "node:assert/strict";
import { test } from "node:test";

const MAPO = ["1144000000", "마포구"];
const MOKPO = ["4611000000", "목포시"];
const YEOSU = ["4613000000", "여수시"];
const SUNCHEON = ["4615000000", "순천시"];
const regions = (...entries) => entries.map(([region_code, region_label]) => ({ region_code, region_label }));

test("대표 지역을 맨 앞에 두고 나머지 순서는 유지한다", () => {
  const sorted = sortPrimaryRegionFirst(regions(MOKPO, YEOSU, MAPO), MAPO[0], (region) => region.region_code);

  assert.deepEqual(
    sorted.map((region) => region.region_label),
    ["마포구", "목포시", "여수시"],
  );
});

test("두 곳까지는 그대로 이어 붙인다", () => {
  assert.equal(formatRecordRegionLabels({ region_code: MAPO[0], record_regions: regions(MAPO) }), "마포구");
  assert.equal(
    formatRecordRegionLabels({ region_code: MAPO[0], record_regions: regions(MOKPO, MAPO) }),
    "마포구 · 목포시",
  );
});

test("세 곳부터는 나머지를 외 N곳으로 줄이고, 상세는 모두 적는다", () => {
  const record = { region_code: MAPO[0], record_regions: regions(MOKPO, MAPO, YEOSU, SUNCHEON) };

  assert.equal(formatRecordRegionLabels(record), "마포구 · 목포시 외 2곳");
  assert.equal(formatRecordRegionLabels(record, Number.POSITIVE_INFINITY), "마포구 · 목포시 · 여수시 · 순천시");
});

test("이름이 같아도 코드가 다르면 다른 지역으로 센다", () => {
  const record = {
    region_code: "1114000000",
    record_regions: regions(["2611000000", "중구"], MAPO, ["1114000000", "중구"]),
  };

  assert.equal(formatRecordRegionLabels(record), "중구 · 중구 외 1곳");
});

test("방문 지역이 없으면 대표 지역 이름만 보여준다", () => {
  assert.equal(formatRecordRegionLabels({ region_label: "마포구" }), "마포구");
  assert.equal(formatRecordRegionLabels({}), "");
});
