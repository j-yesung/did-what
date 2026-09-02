import { parseKakaoSearchResponse } from "./kakao-local/places.ts";
import {
  getRelatedRegionQueries,
  parseKakaoCoordinateRegionResponse,
  parseKakaoRegionSearchResponse,
} from "./kakao-local/regions.ts";
import { normalizeKakaoPage, validateKakaoPlaceId, validateKakaoQuery } from "./kakao-local/validation.ts";
import assert from "node:assert/strict";

assert.deepEqual(validateKakaoQuery("  성수 카페  "), { query: "성수 카페", valid: true });
assert.deepEqual(validateKakaoQuery(" "), {
  error: "검색어는 1자 이상 100자 이하로 입력해 주세요.",
  valid: false,
});
assert.equal(validateKakaoQuery("가".repeat(101)).valid, false);
assert.deepEqual(validateKakaoPlaceId("26338954"), { id: "26338954", valid: true });
assert.equal(validateKakaoPlaceId("not-an-id").valid, false);
assert.equal(normalizeKakaoPage("2"), 2);
assert.equal(normalizeKakaoPage("0"), 1);
assert.equal(normalizeKakaoPage("46"), 1);
assert.equal(normalizeKakaoPage("1.5"), 1);

assert.deepEqual(
  parseKakaoSearchResponse({
    documents: [
      {
        address_name: "서울 강남구 삼성동 159",
        id: "26338954",
        place_name: "카카오프렌즈 코엑스점",
        road_address_name: "서울 강남구 영동대로 513",
        x: "127.05902969025047",
        y: "37.51207412593136",
      },
    ],
    meta: { is_end: false, pageable_count: 45 },
  }),
  {
    isEnd: false,
    pageableCount: 45,
    places: [
      {
        address: "서울 강남구 영동대로 513",
        id: "26338954",
        latitude: 37.51207412593136,
        longitude: 127.05902969025047,
        name: "카카오프렌즈 코엑스점",
        parcelAddress: "서울 강남구 삼성동 159",
      },
    ],
  },
);
assert.equal(
  parseKakaoSearchResponse({
    documents: [{ address_name: "서울", id: "1", place_name: "범위 밖", road_address_name: "", x: "181", y: "37" }],
    meta: { is_end: true, pageable_count: 1 },
  }),
  null,
);
assert.equal(parseKakaoSearchResponse({ documents: [], meta: {} }), null);

// 같은 시·군·구의 동들은 한 지역으로 합쳐지고, 시·도 문서와 코드가 깨진 문서는 걸러진다.
assert.deepEqual(
  parseKakaoRegionSearchResponse({
    documents: [
      {
        address: {
          b_code: "1144012300",
          region_1depth_name: "서울",
          region_2depth_name: "마포구",
          region_3depth_name: "망원동",
        },
        x: "126.901347294861",
        y: "37.5567856576913",
      },
      {
        address: {
          b_code: "1144013500",
          region_1depth_name: "서울",
          region_2depth_name: "마포구",
          region_3depth_name: "서교동",
        },
        x: "126.92",
        y: "37.55",
      },
      {
        address: { b_code: "1100000000", region_1depth_name: "서울", region_2depth_name: "", region_3depth_name: "" },
        x: "126.97",
        y: "37.56",
      },
      {
        address: { b_code: "", region_1depth_name: "서울", region_2depth_name: "마포구", region_3depth_name: "" },
        x: "126.9",
        y: "37.5",
      },
    ],
  }),
  [
    {
      code: "1144000000",
      fullName: "서울 마포구",
      latitude: 37.5567856576913,
      longitude: 126.901347294861,
      name: "마포구",
    },
  ],
);

// 세종처럼 시·군·구 단계가 없는 곳은 읍·면·동을 한 단위로 쓴다.
assert.deepEqual(
  parseKakaoRegionSearchResponse({
    documents: [
      {
        address: {
          b_code: "3611011900",
          region_1depth_name: "세종특별자치시",
          region_2depth_name: "",
          region_3depth_name: "세종동",
        },
        x: "127.28",
        y: "36.51",
      },
    ],
  }),
  [
    {
      code: "3611011900",
      fullName: "세종특별자치시 세종동",
      latitude: 36.51,
      longitude: 127.28,
      name: "세종동",
    },
  ],
);

assert.deepEqual(
  parseKakaoCoordinateRegionResponse({
    documents: [
      {
        code: "5011025325",
        region_1depth_name: "제주특별자치도",
        region_2depth_name: "제주시",
        region_3depth_name: "애월읍",
        region_type: "B",
      },
    ],
  }),
  { code: "5011000000", fullName: "제주특별자치도 제주시" },
);

assert.deepEqual(
  getRelatedRegionQueries([
    { address: null, id: "1", latitude: 0, longitude: 0, name: "학교", parcelAddress: "서울 마포구 상수동 72-1" },
    { address: null, id: "2", latitude: 0, longitude: 0, name: "역", parcelAddress: "서울 마포구 동교동 165" },
    { address: null, id: "3", latitude: 0, longitude: 0, name: "거리", parcelAddress: "서울 마포구 서교동 348-40" },
    { address: null, id: "4", latitude: 0, longitude: 0, name: "숙소", parcelAddress: "서울 마포구 동교동 162-5" },
    { address: null, id: "5", latitude: 0, longitude: 0, name: "극장", parcelAddress: "서울 마포구 서교동 357-5" },
    { address: null, id: "6", latitude: 0, longitude: 0, name: "지점", parcelAddress: "세종 조치원읍 신안리 300" },
  ]),
  ["서울 마포구 동교동", "서울 마포구 서교동", "서울 마포구 상수동"],
);
