import { toExistingRecordLocationPlace, toRecentRegions, toVisitedRegions } from "./location-picker.ts";
import assert from "node:assert/strict";
import { test } from "node:test";

const regionRow = (code, label, name) => ({
  region_code: code,
  region_label: label,
  region_latitude: 37.5,
  region_longitude: 127,
  region_name: name,
});

const record = (...regions) => ({ record_regions: regions });

const region = (code, label) => ({
  code,
  fullName: `서울 ${label}`,
  label,
  latitude: 37.5,
  longitude: 127,
  name: label,
});

test("최근 순서를 유지하면서 같은 지역은 한 번만 남는다", () => {
  const regions = toRecentRegions([
    record(regionRow("1144012300", "망원", "서울 마포구 망원동")),
    record(regionRow("1168010100", "역삼", "서울 강남구 역삼동")),
    record(regionRow("1144012300", "홍대", "서울 마포구 망원동")),
  ]);

  assert.deepEqual(
    regions.map((region) => region.code),
    ["1144012300", "1168010100"],
  );
  // 중복은 뒤엣것이 아니라 먼저 만난 기록의 이름표를 쓴다.
  assert.equal(regions[0].label, "망원");
});

test("한 기록의 여러 지역을 모두 훑는다", () => {
  const regions = toRecentRegions([
    record(regionRow("1144012300", "망원", "서울 마포구 망원동"), regionRow("4611000000", "목포", "전남 목포시")),
  ]);

  assert.deepEqual(
    regions.map((region) => region.code),
    ["1144012300", "4611000000"],
  );
});

test("짧은 이름은 전체 이름의 마지막 마디에서 얻는다", () => {
  const [region] = toRecentRegions([record(regionRow("1144012300", "망원", "서울 마포구 망원동"))]);

  assert.equal(region.name, "망원동");
  assert.equal(region.fullName, "서울 마포구 망원동");
});

test("마디가 하나뿐이면 전체 이름을 그대로 쓴다", () => {
  const [region] = toRecentRegions([record(regionRow("1100000000", "서울", "서울"))]);

  assert.equal(region.name, "서울");
});

test("limit까지만 돌려준다", () => {
  const rows = Array.from({ length: 10 }, (_, index) =>
    record(regionRow(`${index}`.padStart(10, "0"), `${index}`, `지역 ${index}`)),
  );

  assert.equal(toRecentRegions(rows).length, 6);
  assert.equal(toRecentRegions(rows, 2).length, 2);
});

test("지역 코드가 비어 있는 기록은 건너뛴다", () => {
  const regions = toRecentRegions([
    record(regionRow("", "없음", "알 수 없음")),
    record(regionRow("1144012300", "망원", "서울 마포구 망원동")),
  ]);

  assert.deepEqual(
    regions.map((region) => region.code),
    ["1144012300"],
  );
});

test("방문 지역은 직접 고른 지역과 장소의 지역을 중복 없이 합친다", () => {
  const mapo = region("1144000000", "마포구");
  const mokpo = region("4611000000", "목포시");
  const places = [
    { key: "kakao:1", region: mokpo },
    { key: "kakao:2", region: mapo },
  ];

  assert.deepEqual(
    toVisitedRegions([mapo], places).map(({ code }) => code),
    ["1144000000", "4611000000"],
  );
  assert.deepEqual(toVisitedRegions([], []), []);
});

test("이미 있는 장소는 그 장소의 지역을 방문 지역으로 데려온다", () => {
  const place = toExistingRecordLocationPlace({
    address: "서울 마포구 망원로 1",
    id: "00000000-0000-4000-8000-000000000001",
    latitude: 37.55,
    longitude: 126.9,
    name: "망원시장",
    region_code: "1144012300",
    region_name: "서울 마포구 망원동",
  });

  assert.equal(place.key, "existing:00000000-0000-4000-8000-000000000001");
  assert.deepEqual(place.reference, { kind: "existing", placeId: "00000000-0000-4000-8000-000000000001", save: false });
  assert.deepEqual(place.region, {
    code: "1144012300",
    fullName: "서울 마포구 망원동",
    label: "망원동",
    latitude: 37.55,
    longitude: 126.9,
    name: "망원동",
  });
});
