import { readJourneyUrlState, toJourneySearch } from "./journey-url-state.ts";
import assert from "node:assert/strict";
import { test } from "node:test";

const params = new URLSearchParams("region=KR-11&record=r1&places=a,b&detail=1");

test("재진입과 뒤로가기에 같은 지역·기록 상태를 복원한다", () => {
  assert.deepEqual(readJourneyUrlState(params), {
    region: "KR-11",
    record: "r1",
    places: ["a", "b"],
    detail: true,
  });
  assert.deepEqual(readJourneyUrlState(null), { region: null, record: null, places: [], detail: false });
});

test("기록 지도 검색어만 바꾸고 다른 검색어는 그대로 둔다", () => {
  const state = { region: "KR-11", record: "r1", places: ["a"], detail: false };
  assert.equal(toJourneySearch("?from=home&detail=1", state), "?from=home&region=KR-11&record=r1&places=a");
  assert.equal(toJourneySearch("?region=KR-11&record=r1&places=a", null), "");
  assert.equal(toJourneySearch("", { ...state, places: [], detail: true }), "?region=KR-11&record=r1&detail=1");
});

test("기록을 열기 전 지역 목록도 URL로 복원하고 남은 재생 검색어는 제거한다", () => {
  const state = { region: "KR-42", record: null, places: ["old-place"], detail: true };
  const search = toJourneySearch("?from=home&region=KR-11&record=old&places=a&detail=1", state);
  assert.equal(search, "?from=home&region=KR-42");
  assert.deepEqual(readJourneyUrlState(new URLSearchParams(search)), {
    region: "KR-42",
    record: null,
    places: [],
    detail: false,
  });
});
