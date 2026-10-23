import { getRegionRecords, getSubregionCounts } from "@/widgets/region-activity-map/model/region-record-list";

import assert from "node:assert/strict";
import test from "node:test";

const region = (code, name) => ({ region_code: code, region_name: name });
const record = (id, ...regions) => ({ id, record_regions: regions });

test("해당 시·도의 기록 순서를 유지하고 기록마다 시·군·구 중복을 제거한다", () => {
  const records = [
    record("first", region("1144000000", "서울 마포구 망원동"), region("1144010000", "서울 마포구 합정동")),
    record("other", region("2611000000", "부산 중구")),
    record("second", region("1120000000", "서울 성동구"), region("1144000000", "서울 마포구")),
    record("empty"),
  ];
  const original = structuredClone(records);
  assert.deepEqual(getRegionRecords(records, "KR-11"), [
    { record: records[0], subregions: ["마포구"] },
    { record: records[2], subregions: ["성동구", "마포구"] },
  ]);
  assert.deepEqual(records, original);
});

test("통합 전 지역을 함께 인식하고 일반구는 같은 시로 묶는다", () => {
  const records = [
    record("integrated", region("2911000000", "광주 동구"), region("4611000000", "전남 목포시")),
    record("city", region("4311100000", "충북 청주시 상당구"), region("4311200000", "충북 청주시 서원구")),
  ];
  assert.deepEqual(getRegionRecords(records, "KR-12")[0].subregions, ["동구", "목포시"]);
  assert.deepEqual(getRegionRecords(records, "KR-43")[0].subregions, ["청주시"]);
});

test("기록 수 내림차순으로 집계하고 동률이면 처음 등장한 순서를 유지한다", () => {
  const records = [
    record("first", region("1120000000", "서울 성동구"), region("1144000000", "서울 마포구")),
    record("second", region("1144000000", "서울 마포구 망원동"), region("1144010000", "서울 마포구 합정동")),
    record("third", region("1111000000", "서울 종로구")),
  ];
  assert.deepEqual(getSubregionCounts(getRegionRecords(records, "KR-11")), [
    ["마포구", 2],
    ["성동구", 1],
    ["종로구", 1],
  ]);
});

test("지역을 선택하지 않았거나 일치하는 기록이 없으면 빈 결과를 반환한다", () => {
  const records = [record("unknown", region("unknown", "알 수 없는 지역"))];
  assert.deepEqual(getRegionRecords(records, undefined), []);
  assert.deepEqual(getRegionRecords(records, "KR-11"), []);
  assert.deepEqual(getRegionRecords([], "KR-11"), []);
  assert.deepEqual(getSubregionCounts([]), []);
});
