import {
  createPlacePickerDraft,
  getRecordLocationSelectionError,
  removeRecordLocationRegion,
  toExistingRecordLocationPlace,
  toRecentRegions,
  toVisitedRegions,
} from "./location-picker.ts";
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

test("최근 순서를 유지하면서 같은 지역과 표시명만 중복으로 거른다", () => {
  const regions = toRecentRegions([
    record(regionRow("1144012300", "망원", "서울 마포구 망원동")),
    record(regionRow("1168010100", "역삼", "서울 강남구 역삼동")),
    record(regionRow("1144012300", "홍대", "서울 마포구 망원동")),
  ]);

  assert.deepEqual(
    regions.map((region) => region.code),
    ["1144012300", "1168010100", "1144012300"],
  );
  assert.equal(regions[2].label, "홍대");
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
    category_group_code: "CE7",
    category_name: "음식점 > 카페",
    id: "00000000-0000-4000-8000-000000000001",
    latitude: 37.55,
    longitude: 126.9,
    name: "망원시장",
    region_code: "1144012300",
    region_name: "서울 마포구 망원동",
  });

  assert.equal(place.key, "existing:00000000-0000-4000-8000-000000000001");
  assert.equal(place.category_group_code, "CE7");
  assert.equal(place.category_name, "음식점 > 카페");
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

test("같은 마포구의 서로 다른 표시명은 보존하고 자동 지역은 덧붙이지 않는다", () => {
  const nanji = region("1144000000", "난지 한강공원");
  const dmc = region("1144000000", "디지털미디어시티");
  const places = [{ key: "kakao:1", region: region("1144000000", "마포구") }];
  assert.deepEqual(toVisitedRegions([nanji, dmc, nanji], places), [nanji, dmc]);
});

test("같은 지역의 다른 항목이 남으면 항목 하나만 제거하고 장소는 유지한다", () => {
  const nanji = region("1144000000", "난지 한강공원");
  const dmc = region("1144000000", "디지털미디어시티");
  const mokpo = region("4611000000", "목포시");
  const places = [
    { key: "kakao:1", region: nanji },
    { key: "kakao:2", region: mokpo },
  ];
  assert.deepEqual(removeRecordLocationRegion([nanji, dmc, mokpo], places, nanji), {
    regions: [dmc, mokpo],
    places,
  });
  assert.deepEqual(removeRecordLocationRegion([dmc, mokpo], places, dmc), {
    regions: [mokpo],
    places: [places[1]],
  });
  assert.deepEqual(removeRecordLocationRegion([], places, nanji), {
    regions: [],
    places: [places[1]],
  });
});

test("최근 지역도 같은 지역과 표시명이면 한 번만 남긴다", () => {
  const row = regionRow("1144000000", "난지 한강공원", "서울 마포구");
  assert.equal(toRecentRegions([record(row), record(row)]).length, 1);
});

test("장소에서 따라오는 지역까지 합쳐 상한을 검사하고 기존 지역의 장소는 허용한다", () => {
  const regions = Array.from({ length: 10 }, (_, index) => region(String(index).padStart(10, "0"), `지역 ${index}`));
  assert.equal(getRecordLocationSelectionError(regions, [{ key: "same", region: regions[0] }]), undefined);
  const extra = { key: "extra", region: region("9999999999", "새 지역") };
  assert.match(getRecordLocationSelectionError(regions, [extra]), /방문 지역은 10곳/);
  assert.equal(getRecordLocationSelectionError(regions.slice(0, 9), [extra]), undefined);
});

test("같은 지역이어도 방문 장소 수 상한은 따로 검사한다", () => {
  const places = Array.from({ length: 11 }, (_, index) => ({
    key: String(index),
    region: region("1144000000", "마포구"),
  }));
  assert.equal(getRecordLocationSelectionError([], places.slice(0, 10)), undefined);
  assert.match(getRecordLocationSelectionError([], places), /방문 장소는 10곳/);
});

test("새 기록의 임시 선택은 이전 기록의 선택과 공유하지 않는다", () => {
  const first = createPlacePickerDraft();
  first.selectedPlaces.set("one", { key: "one", region: region("1144000000", "마포구") });
  assert.equal(createPlacePickerDraft().selectedPlaces.size, 0);
});
