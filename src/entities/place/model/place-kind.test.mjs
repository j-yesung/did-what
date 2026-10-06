import { getPlaceKind } from "@/entities/place/model/place-kind";

import assert from "node:assert/strict";
import test from "node:test";

test("카페와 음식점은 카카오 그룹 코드로 구분한다", () => {
  assert.equal(getPlaceKind({ category_group_code: "CE7", category_name: "음식점 > 카페" }), "cafe");
  assert.equal(getPlaceKind({ category_group_code: "FD6", category_name: "음식점 > 한식" }), "restaurant");
});

test("공원은 상세 분류의 정확한 항목으로 구분하고 장소 이름은 판단에 사용하지 않는다", () => {
  assert.equal(getPlaceKind({ category_name: "여행 > 관광,명소 > 공원 > 도시근린공원" }), "park");
  assert.equal(getPlaceKind({ category_name: "여행 > 테마공원" }), "other");
  assert.equal(getPlaceKind({ category_group_code: "FD6", category_name: "음식점 > 한식 > 공원" }), "restaurant");
});

test("분류 없는 기존 장소와 미지원 분류는 위치 핀으로 표시한다", () => {
  assert.equal(getPlaceKind({}), "other");
  assert.equal(getPlaceKind({ category_group_code: null, category_name: null }), "other");
  assert.equal(getPlaceKind({ category_group_code: "MT1", category_name: "가정,생활 > 대형마트" }), "other");
});
