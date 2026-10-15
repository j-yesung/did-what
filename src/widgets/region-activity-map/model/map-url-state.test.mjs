import { readMapUrlState, toMapSearch } from "@/widgets/region-activity-map/model/map-url-state";

import assert from "node:assert/strict";
import test from "node:test";

test("지역 시트와 시·군·구 선택을 주소에 남기고 되읽는다", () => {
  const search = toMapSearch("", { region: "KR-11", subregion: "강남구" });

  assert.equal(search, "?region=KR-11&sub=%EA%B0%95%EB%82%A8%EA%B5%AC");
  assert.deepEqual(readMapUrlState(new URLSearchParams(search)), { region: "KR-11", subregion: "강남구" });
});

test("시트를 닫으면 지역과 칩, 이전 확대 상태를 지우고 다른 검색어는 남긴다", () => {
  assert.equal(
    toMapSearch("?region=KR-11&sub=중구&view=3,120,88&period=month&other=1", { region: null, subregion: "중구" }),
    "?other=1",
  );
  assert.equal(toMapSearch("?region=KR-11", { region: null, subregion: null }), "");
});

test("지역 없는 칩과 이전 확대 상태는 무시한다", () => {
  assert.deepEqual(readMapUrlState(new URLSearchParams("?sub=중구&view=3,120,88")), { region: null, subregion: null });
  assert.deepEqual(readMapUrlState(null), { region: null, subregion: null });
  assert.equal(toMapSearch("?view=3,120,88", { region: "KR-11", subregion: null }), "?region=KR-11");
});
