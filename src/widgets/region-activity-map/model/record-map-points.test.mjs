import { getSubregionName, toRecordMapPoints } from "@/widgets/region-activity-map/model/record-map-points";

import assert from "node:assert/strict";
import test from "node:test";

test("장소 좌표를 우선하고 장소가 없는 기록만 지역 좌표로 표시한다", () => {
  const records = [
    {
      id: "a",
      activity: "커피 마시기",
      recorded_at: "2026-09-20",
      record_places: [{ place: { id: "p", name: "카페", latitude: 37.54, longitude: 127.05 } }],
      record_regions: [{ region_code: "11", region_name: "서울", region_latitude: 37.56, region_longitude: 126.97 }],
    },
    {
      id: "b",
      activity: "산책",
      recorded_at: "2026-08-20",
      record_places: [],
      record_regions: [{ region_code: "26", region_name: "부산", region_latitude: 35.18, region_longitude: 129.08 }],
    },
  ];

  assert.deepEqual(
    toRecordMapPoints(records).map(({ id, kind, label }) => ({ id, kind, label })),
    [
      { id: "place:a:p", kind: "place", label: "카페" },
      { id: "region:b:26", kind: "region", label: "부산" },
    ],
  );
});

test("지역명에서 시·도 약칭을 떼고 시·군·구만 남긴다", () => {
  assert.equal(getSubregionName("서울 중구"), "중구");
  assert.equal(getSubregionName("경기 고양시 일산동구"), "고양시");
  assert.equal(getSubregionName("충북 청주시 상당구"), "청주시", "일반구는 시로 합친다.");
  assert.equal(getSubregionName("세종특별자치시"), "세종특별자치시");
});

test("같은 지역에 여러 표시명을 남겨도 지도 지역 점은 한 번만 만든다", () => {
  const region = {
    region_code: "1144000000",
    region_name: "서울 마포구",
    region_latitude: 37.56,
    region_longitude: 126.97,
  };
  const points = toRecordMapPoints([
    {
      id: "a",
      activity: "산책",
      recorded_at: "2026-10-19",
      record_places: [],
      record_regions: [
        { ...region, region_label: "난지 한강공원" },
        { ...region, region_label: "디지털미디어시티" },
      ],
    },
  ]);
  assert.equal(points.length, 1);
  assert.equal(points[0].id, "region:a:1144000000");
});
