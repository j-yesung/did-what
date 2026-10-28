import { toJourneyRecord } from "./record.ts";
import assert from "node:assert/strict";
import { test } from "node:test";

const region = (region_name, region_code, region_latitude = 35.8) => ({
  region_code,
  region_latitude,
  region_longitude: 128.6,
  region_name,
});
const record = {
  activity: "대구 여행",
  category: [],
  id: "r1",
  recorded_at: "2026-10-24",
  recorded_until: null,
  record_places: [{ place: null }, { place: { id: "p1", latitude: 35.86, longitude: 128.59, name: "동성로" } }],
  record_regions: [
    region("부산 중구", "2611000000"),
    region("대구 중구", "2711000000", 1),
    region("대구 남구", "2720000000", 2),
  ],
};

test("같은 시·도 지역 중 이름순 첫 지역이 도착지가 되고 빈 장소는 뺀다", () => {
  const journey = toJourneyRecord(record, "KR-27");
  assert.equal(journey.destination.name, "대구 남구");
  assert.equal(journey.destination.latitude, 2);
  assert.deepEqual(
    journey.places.map((place) => place.id),
    ["p1"],
  );
});
test("그 시·도에 지역이 없으면 null", () => {
  assert.equal(toJourneyRecord(record, "KR-11"), null);
});
