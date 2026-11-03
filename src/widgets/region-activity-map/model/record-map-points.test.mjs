import { getSubregionName } from "@/widgets/region-activity-map/model/record-map-points";

import assert from "node:assert/strict";
import test from "node:test";

test("지역명에서 시·도 약칭을 떼고 시·군·구만 남긴다", () => {
  assert.equal(getSubregionName("서울 중구"), "중구");
  assert.equal(getSubregionName("경기 고양시 일산동구"), "고양시");
  assert.equal(getSubregionName("충북 청주시 상당구"), "청주시", "일반구는 시로 합친다.");
  assert.equal(getSubregionName("세종특별자치시"), "세종특별자치시");
});
