import {
  formatRecordProvinceLabels,
  formatRecordRegionLabels,
  sortPrimaryRecordRegions,
  sortPrimaryRegionFirst,
  toRegionCityLabel,
} from "./record-region.ts";
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

test("코드가 달라도 같은 표시명은 한 번만 보여준다", () => {
  const record = {
    region_code: "1114000000",
    record_regions: regions(["2611000000", "중구"], MAPO, ["1114000000", "중구"]),
  };

  assert.equal(formatRecordRegionLabels(record), "중구 · 마포구");
});

test("광화문이 서로 다른 행정구역에 저장돼도 한 번만 표시하고 원본 지역은 유지한다", () => {
  const record = {
    region_code: "1111000000",
    region_label: "광화문",
    record_regions: regions(["1111000000", "광화문"], ["1114000000", "광화문"]),
  };
  const original = structuredClone(record);

  assert.equal(formatRecordRegionLabels(record), "광화문");
  assert.equal(formatRecordRegionLabels(record, Number.POSITIVE_INFINITY), "광화문");
  assert.deepEqual(record, original);
});

test("중복 표시명을 합친 뒤 표시 제한과 외 N곳을 계산한다", () => {
  const record = {
    region_code: "1111000000",
    region_label: "광화문",
    record_regions: regions(MAPO, ["1114000000", "광화문"], MOKPO, ["1111000000", "광화문"], YEOSU),
  };

  assert.equal(formatRecordRegionLabels(record), "광화문 · 마포구 외 2곳");
  assert.equal(formatRecordRegionLabels(record, 1), "광화문 외 3곳");
  assert.equal(formatRecordRegionLabels(record, Number.POSITIVE_INFINITY), "광화문 · 마포구 · 목포시 · 여수시");
});

test("방문 지역이 없으면 대표 지역 이름만 보여준다", () => {
  assert.equal(formatRecordRegionLabels({ region_label: "마포구" }), "마포구");
  assert.equal(formatRecordRegionLabels({}), "");
});

test("같은 지역의 여러 표시명이 뒤섞여도 기존 대표 표시명을 먼저 둔다", () => {
  const entries = regions(MOKPO, [MAPO[0], "디지털미디어시티"], YEOSU, [MAPO[0], "난지 한강공원"]);
  const sorted = sortPrimaryRecordRegions(entries, MAPO[0], "난지 한강공원");
  assert.deepEqual(
    sorted.map(({ region_label }) => region_label),
    ["난지 한강공원", "디지털미디어시티", "목포시", "여수시"],
  );
  assert.equal(entries[0].region_label, "목포시");
  assert.equal(
    formatRecordRegionLabels({ region_code: MAPO[0], region_label: "난지 한강공원", record_regions: entries }),
    "난지 한강공원 · 디지털미디어시티 외 2곳",
  );
});

test("대표 표시명이 사라졌으면 같은 코드의 항목을 앞에 두고 기존 순서를 유지한다", () => {
  const entries = regions(MOKPO, [MAPO[0], "디지털미디어시티"], [MAPO[0], "난지 한강공원"]);
  assert.deepEqual(
    sortPrimaryRecordRegions(entries, MAPO[0], "제거된 이름").map(({ region_label }) => region_label),
    ["디지털미디어시티", "난지 한강공원", "목포시"],
  );
  assert.deepEqual(sortPrimaryRecordRegions(entries, undefined, undefined), entries);
});

test("전체 지역명에서 도시 이름만 남긴다", () => {
  assert.equal(toRegionCityLabel("서울 성동구"), "서울");
  assert.equal(toRegionCityLabel("서울특별시 마포구"), "서울");
  assert.equal(toRegionCityLabel("부산광역시 기장군"), "부산");
  assert.equal(toRegionCityLabel("세종특별자치시 조치원읍"), "세종");
  assert.equal(toRegionCityLabel("전북특별자치도 전주시 완산구"), "전주");
  assert.equal(toRegionCityLabel("경기 가평군"), "가평");
  assert.equal(toRegionCityLabel("경기 광주시"), "광주");
  assert.equal(toRegionCityLabel("전남광주통합특별시 여수시"), "여수");
  assert.equal(toRegionCityLabel("전남광주통합특별시 북구"), "전남광주");
});

test("전체 지역명이 있으면 같은 도시는 하나로 합치고, 없으면 표시명을 쓴다", () => {
  const record = {
    region_code: "1120000000",
    record_regions: [
      { region_code: "1120000000", region_label: "성수동", region_name: "서울 성동구" },
      { region_code: "1121500000", region_label: "자양동", region_name: "서울 광진구" },
      { region_code: "4511100000", region_label: "중앙동", region_name: "전북특별자치도 전주시 완산구" },
      { region_code: "4613000000", region_label: "여수시" },
    ],
  };

  assert.equal(formatRecordRegionLabels(record, Number.POSITIVE_INFINITY), "서울 · 전주 · 여수시");
});

test("카드에는 시도 이름만 빗금으로 이어 적는다", () => {
  const record = {
    region_code: "1120000000",
    record_regions: [
      { region_code: "1120000000", region_label: "성수동", region_name: "서울 성동구" },
      { region_code: "1121500000", region_label: "자양동", region_name: "서울특별시 광진구" },
      { region_code: "2711000000", region_label: "동성로", region_name: "대구광역시 중구" },
      { region_code: "4182000000", region_label: "가평", region_name: "경기도 가평군" },
    ],
  };

  assert.equal(formatRecordProvinceLabels(record), "서울/대구/경기");
  assert.equal(formatRecordProvinceLabels({ region_label: "마포구" }), "마포구");
  assert.equal(formatRecordProvinceLabels({}), "");
});
