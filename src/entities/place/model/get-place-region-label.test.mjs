import { getPlaceRegionLabel } from "./get-place-region-label.ts";
import assert from "node:assert/strict";
import { test } from "node:test";

test("전체 행정명을 목록용 짧은 지역명으로 바꾼다", () => {
  assert.equal(getPlaceRegionLabel("서울특별시 마포구", null), "마포구");
  assert.equal(getPlaceRegionLabel("경기도 김포시", null), "김포");
  assert.equal(getPlaceRegionLabel("부산광역시 해운대구", null), "부산");
});

test("기존 장소는 주소에서 지역명을 얻는다", () => {
  assert.equal(getPlaceRegionLabel(null, "서울 마포구 양화로 123"), "마포구");
  assert.equal(getPlaceRegionLabel(null, null), "지역 정보 없음");
});
