import { parseMapView, readMapUrlState, toMapSearch } from "@/widgets/region-activity-map/model/map-url-state";

import assert from "node:assert/strict";
import test from "node:test";

test("지도 상태를 주소에 남기고 그대로 되읽는다", () => {
  const search = toMapSearch("", {
    region: "KR-11",
    subregion: "강남구",
    view: { x: 120.04, y: 88.26, zoom: 3.40001 },
  });

  assert.equal(search, "?region=KR-11&sub=%EA%B0%95%EB%82%A8%EA%B5%AC&view=3.4%2C120%2C88.3");
  assert.deepEqual(readMapUrlState(new URLSearchParams(search)), {
    region: "KR-11",
    subregion: "강남구",
    view: { x: 120, y: 88.3, zoom: 3.4 },
  });
});

test("시트를 닫으면 지역과 칩을 지우고 지도가 쓰지 않는 검색어는 남긴다", () => {
  assert.equal(
    toMapSearch("?region=KR-11&sub=중구&period=month&other=1", { region: null, subregion: "중구", view: null }),
    "?other=1",
  );
  assert.equal(toMapSearch("?region=KR-11", { region: null, subregion: null, view: null }), "");
});

test("잘못된 확대 상태와 지역 없는 칩은 무시한다", () => {
  assert.equal(parseMapView("3,abc,1"), null);
  assert.equal(parseMapView("0,1,1"), null);
  assert.equal(parseMapView("1,2"), null);
  assert.deepEqual(readMapUrlState(new URLSearchParams("?sub=중구")), { region: null, subregion: null, view: null });
  assert.deepEqual(readMapUrlState(null), { region: null, subregion: null, view: null });
});
