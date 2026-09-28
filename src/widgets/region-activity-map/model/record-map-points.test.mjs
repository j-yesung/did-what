import { getKoreaMapPosition } from "@/entities/region/model/korea-map";
import {
  getSubregionName,
  placeRegionBadges,
  REGION_BADGE_ANCHORS,
  toRecordMapPoints,
} from "@/widgets/region-activity-map/model/record-map-points";

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

test("배지 지점은 모두 지도 위에 있다", () => {
  for (const [code, anchor] of Object.entries(REGION_BADGE_ANCHORS)) {
    assert.ok(getKoreaMapPosition(anchor), `${code} ${anchor.label}`);
  }
});

test("배지는 지점 위에 놓고, 먼저 놓인 배지와 겹치면 기록이 적은 쪽을 숨긴다", () => {
  const at = (code, count, y = 100) => ({ code, count, label: "서울", x: 100, y });
  const [badge] = placeRegionBadges([at("a", 1), at("b", 5)], 1);

  assert.equal(badge.code, "b");
  assert.equal(placeRegionBadges([at("a", 1), at("b", 5)], 1).length, 1);
  assert.ok(badge.top + badge.height < 100, "몸통은 지점보다 위에 있다.");

  const near = [at("a", 2), at("b", 1, 118)];
  assert.equal(placeRegionBadges(near, 1).length, 1, "가까우면 기록이 적은 쪽이 숨는다.");
  assert.equal(placeRegionBadges(near, 0.25).length, 2, "확대해 픽셀당 지도 단위가 작아지면 둘 다 보인다.");
});

test("개수 제한이 있으면 기록 많은 곳부터 그 수만큼만 배지를 단다", () => {
  const spread = [1, 2, 3, 4, 5, 6].map((count) => ({
    code: `${count}`,
    count,
    label: "서울",
    x: count * 200,
    y: 100,
  }));

  assert.deepEqual(
    placeRegionBadges(spread, 1, 5).map(({ code }) => code),
    ["6", "5", "4", "3", "2"],
  );
  assert.equal(placeRegionBadges(spread, 1).length, 6);
});
