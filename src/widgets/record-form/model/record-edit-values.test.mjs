import { toRecordEditValues } from "@/widgets/record-form/model/record-edit-values";

import assert from "node:assert/strict";
import test from "node:test";

const place = (id, code) => ({
  id,
  name: id,
  address: null,
  latitude: 37.5,
  longitude: 127,
  region_code: code,
  region_name: "서울 마포구",
});
const region = (code, label, direct = true) => ({
  region_code: code,
  region_label: label,
  region_name: "서울 마포구",
  region_latitude: 37.5,
  region_longitude: 127,
  selected_directly: direct,
});

test("대표 지역과 표시명을 먼저 복원하고 장소에서 따라온 지역은 제외한다", () => {
  const record = {
    activity: "산책",
    category: "daily",
    memo: null,
    weather: "rainy",
    recorded_at: "2026-10-22",
    recorded_until: null,
    region_code: "1144000000",
    region_label: "난지 한강공원",
    record_places: [{ place: place("other", "2611000000") }, { place: place("primary", "1144000000") }],
    record_regions: [
      region("2611000000", "중구"),
      region("1144000000", "망원동"),
      region("1144000000", "난지 한강공원"),
      region("1111000000", "종로구", false),
    ],
  };
  const original = structuredClone(record);
  const values = toRecordEditValues(record);
  assert.deepEqual(
    values.places.map(({ key }) => key),
    ["existing:primary", "existing:other"],
  );
  assert.deepEqual(
    values.regions.map(({ label }) => label),
    ["난지 한강공원", "망원동", "중구"],
  );
  assert.equal(values.memo, "");
  assert.equal(values.category, "daily");
  assert.equal(values.weather, "rainy");
  assert.equal(values.recordedAt, "2026-10-22");
  assert.equal(values.recordedUntil, null);
  assert.deepEqual(record, original);
  const fallback = toRecordEditValues({ ...record, category: "legacy", weather: "legacy" });
  assert.equal(fallback.category, "uncategorized");
  assert.equal(fallback.weather, "sunny");
});
