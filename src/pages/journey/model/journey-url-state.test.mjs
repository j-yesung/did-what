import { readJourneyUrlState, toJourneySearch } from "./journey-url-state.ts";
import assert from "node:assert/strict";
import { test } from "node:test";

const params = new URLSearchParams("region=KR-11&record=r1&places=a,b&detail=r1");

test("재진입과 뒤로가기에 같은 지역·기록 상태를 복원한다", () => {
  assert.deepEqual(readJourneyUrlState(params), {
    region: "KR-11",
    subregion: null,
    record: "r1",
    places: ["a", "b"],
    detail: "r1",
  });
  assert.deepEqual(readJourneyUrlState(null), {
    region: null,
    subregion: null,
    record: null,
    places: [],
    detail: null,
  });
});

test("기록 지도 검색어만 바꾸고 다른 검색어는 그대로 둔다", () => {
  const state = { region: "KR-11", record: "r1", places: ["a"], detail: null };
  assert.equal(toJourneySearch("?from=home&detail=r1", state), "?from=home&region=KR-11&record=r1&places=a");
  assert.equal(toJourneySearch("?region=KR-11&record=r1&places=a", null), "");
  assert.equal(toJourneySearch("", { ...state, places: [], detail: "r1" }), "?region=KR-11&record=r1&detail=r1");
});

test("기록을 열기 전 지역 목록도 URL로 복원하고 남은 재생 검색어는 제거한다", () => {
  const state = { region: "KR-42", record: null, places: ["old-place"], detail: null };
  const search = toJourneySearch("?from=home&region=KR-11&record=old&places=a&detail=old", state);
  assert.equal(search, "?from=home&region=KR-42");
  assert.deepEqual(readJourneyUrlState(new URLSearchParams(search)), {
    region: "KR-42",
    subregion: null,
    record: null,
    places: [],
    detail: null,
  });
});

test("목록에서 연 상세는 경로 없이 복원한다", () => {
  const state = { region: "KR-11", subregion: null, record: null, places: [], detail: "r1" };
  const search = toJourneySearch("", state);
  assert.equal(search, "?region=KR-11&detail=r1");
  assert.deepEqual(readJourneyUrlState(new URLSearchParams(search)), state);
  assert.equal(readJourneyUrlState(new URLSearchParams("detail=r1")).detail, null);
});

test("지역이 있을 때만 시·군·구 필터를 읽고 쓴다", () => {
  const state = { region: "KR-11", subregion: "강남구", record: null, places: [], detail: null };
  assert.equal(readJourneyUrlState(new URLSearchParams("region=KR-11&sub=강남구")).subregion, "강남구");
  assert.equal(readJourneyUrlState(new URLSearchParams("sub=강남구")).subregion, null);
  assert.equal(toJourneySearch("", state), `?region=KR-11&sub=${encodeURIComponent("강남구")}`);
  assert.equal(toJourneySearch("?region=KR-11&sub=강남구", { ...state, subregion: null }), "?region=KR-11");
  assert.equal(toJourneySearch("?region=KR-11&sub=강남구", null), "");
});

test("이전 홈의 view·period는 지우고 다른 기능의 검색어는 남긴다", () => {
  assert.equal(toJourneySearch("?from=home&view=map&period=2026", null), "?from=home");
});
