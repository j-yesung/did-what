import { readJourneyUrlState, toJourneySearch } from "./journey-url-state.ts";
import assert from "node:assert/strict";
import { test } from "node:test";

const params = new URLSearchParams("region=KR-11&record=r1&places=a,b&detail=1");

test("뒤로·앞으로 왔을 때만 지역을 읽어 이어 보기를 복원한다", () => {
  assert.deepEqual(readJourneyUrlState(params, true), {
    region: "KR-11",
    record: "r1",
    places: ["a", "b"],
    detail: true,
  });
  assert.equal(readJourneyUrlState(params, false).region, null);
  assert.deepEqual(readJourneyUrlState(null, true), { region: null, record: null, places: [], detail: false });
});

test("기록 지도 검색어만 바꾸고 다른 검색어는 그대로 둔다", () => {
  const state = { region: "KR-11", record: "r1", places: ["a"], detail: false };
  assert.equal(toJourneySearch("?from=home&detail=1", state), "?from=home&region=KR-11&record=r1&places=a");
  assert.equal(toJourneySearch("?region=KR-11&record=r1&places=a", null), "");
  assert.equal(toJourneySearch("", { ...state, places: [], detail: true }), "?region=KR-11&record=r1&detail=1");
});
