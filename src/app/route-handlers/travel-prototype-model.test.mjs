import { groupTravelRecords } from "./travel-prototype-model.ts";
import assert from "node:assert/strict";
import test from "node:test";

const region = (name, code = "1144000000") => ({
  region_code: code,
  region_name: name,
  region_latitude: 37.5,
  region_longitude: 127,
});
const record = (id, regions, places = []) => ({
  id,
  activity: id,
  recorded_at: "2026-01-01",
  record_regions: regions,
  record_places: places,
});

test("지역별 기록 수는 같은 기록을 중복 집계하지 않고 내림차순으로 정렬한다", () => {
  const grouped = groupTravelRecords([
    record("one", [region("서울 마포구"), region("서울 마포구"), region("서울 용산구", "1117000000")]),
    record("two", [region("서울 마포구")]),
    record("three", [region("서울 은평구", "1138000000")]),
  ]);
  assert.equal(grouped["KR-11"].records.length, 3);
  assert.deepEqual(
    grouped["KR-11"].districts.map((district) => [district.name, district.records.length]),
    [
      ["마포구", 2],
      ["용산구", 1],
      ["은평구", 1],
    ],
  );
});

test("여러 지역의 기록과 세부 지역이 없는 기록도 빠뜨리지 않는다", () => {
  const grouped = groupTravelRecords([
    record("shared", [region("서울 마포구"), region("경기 고양시", "4128000000")]),
    record("unknown", [region("서울", "1100000000")]),
  ]);
  assert.equal(grouped["KR-11"].records.length, 2);
  assert.deepEqual(grouped["KR-11"].records.find((item) => item.id === "shared").destination, {
    name: "서울 마포구",
    latitude: 37.5,
    longitude: 127,
  });
  assert.equal(grouped["KR-41"].records[0].destination.name, "경기 고양시");
  assert.equal(grouped["KR-11"].records.find((item) => item.id === "unknown").destination.name, "서울");
  assert.equal(grouped["KR-41"].districts[0].records[0].id, "shared");
  assert.ok(grouped["KR-11"].districts.some((district) => district.name === "세부 지역 미상"));
});

test("기존 메모의 줄바꿈을 유지하고 메모가 없는 기록도 함께 반환한다", () => {
  const grouped = groupTravelRecords([
    { ...record("memo", [region("서울 마포구")]), memo: "첫 줄\n둘째 줄" },
    record("empty", [region("서울 마포구")]),
  ]);
  assert.equal(grouped["KR-11"].records.find((item) => item.id === "memo").memo, "첫 줄\n둘째 줄");
  assert.equal(grouped["KR-11"].records.find((item) => item.id === "empty").memo, null);
});
