import { getPlacePickerResults } from "./place-picker-results.ts";
import assert from "node:assert/strict";
import test from "node:test";

const savedPlace = {
  id: "saved-1",
  name: "동네 카페",
  address: "서울 마포구",
  provider: "kakao",
  provider_place_id: "kakao-1",
  region_code: "1144000000",
  region_name: "서울 마포구",
};
const page = (places) => ({ places, page: 2, query: "카페", scope: null });

test("저장 장소는 검색어 또는 검색 결과 ID로 찾고 같은 검색 결과를 중복 표시하지 않는다", () => {
  const other = { ...savedPlace, id: "saved-2", provider_place_id: "kakao-2", name: "다른 가게" };
  const results = getPlacePickerResults([savedPlace, other], [], "카페", [
    page([
      { id: "kakao-1", name: savedPlace.name, address: savedPlace.address },
      { id: "changed-id", name: ` ${savedPlace.name} `, address: savedPlace.address },
      { id: "kakao-2", name: other.name, address: other.address },
      { id: "new", name: "새 카페", address: "서울 종로구" },
    ]),
  ]);
  assert.deepEqual(
    results.savedMatches.map(({ id }) => id),
    ["saved-1", "saved-2"],
  );
  assert.deepEqual(
    results.uniqueSearchResults.map(({ place }) => place.id),
    ["new"],
  );
  assert.equal(results.uniqueSearchResults[0].page.page, 2);
});

test("지역 정보가 없는 저장 장소는 제외하고 지역 검색 칩은 코드별로 한 번만 만든다", () => {
  const regions = [
    { code: "1144000000", label: "마포구" },
    { code: "1144000000", label: "망원동" },
  ];
  const results = getPlacePickerResults(
    [savedPlace, { ...savedPlace, id: "invalid", region_name: null }],
    regions,
    "카페",
    [],
  );
  assert.deepEqual(
    results.savedMatches.map(({ id }) => id),
    ["saved-1"],
  );
  assert.deepEqual(results.searchScopes, [regions[0]]);
  assert.equal(getPlacePickerResults([savedPlace], regions, "", []).savedMatches.length, 0);
});
