import { verifyKakaoPlaces } from "./verify-places.ts";
import assert from "node:assert/strict";
import test from "node:test";

const placeDocument = (id) => ({
  address_name: "서울특별시 종로구 청운동",
  id,
  place_name: `장소 ${id}`,
  road_address_name: "",
  x: String(127 + Number(id) / 100),
  y: "37.5",
});

const mockKakao = (t, { missingRegion = false } = {}) => {
  const requests = [];
  const previousKey = process.env.KAKAO_REST_API_KEY;
  process.env.KAKAO_REST_API_KEY = "test-key";
  t.after(() => {
    if (previousKey === undefined) delete process.env.KAKAO_REST_API_KEY;
    else process.env.KAKAO_REST_API_KEY = previousKey;
  });
  t.mock.method(globalThis, "fetch", async (input) => {
    const url = new URL(input);
    requests.push(url);
    if (url.pathname.endsWith("keyword.json")) {
      if (url.searchParams.get("query") === "검색 실패") return new Response(null, { status: 500 });
      return Response.json({
        documents: [placeDocument("1"), placeDocument("2")],
        meta: { is_end: true, pageable_count: 2 },
      });
    }
    if (url.pathname.endsWith("coord2regioncode.json")) {
      return Response.json({
        documents: missingRegion
          ? []
          : [
              {
                code: "1111000000",
                region_type: "B",
                region_1depth_name: "서울특별시",
                region_2depth_name: "종로구",
                region_3depth_name: "청운동",
              },
            ],
      });
    }
    assert.ok(url.pathname.endsWith("address.json"));
    return Response.json({
      documents: [
        {
          address: {
            b_code: "1111000000",
            region_1depth_name: "서울특별시",
            region_2depth_name: "종로구",
            region_3depth_name: "청운동",
          },
          x: "127.01",
          y: "37.5",
        },
      ],
    });
  });
  return requests;
};

test("같은 검색만 공유하고 페이지·검색 범위는 구분하며 선택 순서를 보존한다", async (t) => {
  const requests = mockKakao(t);
  const selection = { page: 1, query: "카페", scope: { latitude: 37.5, longitude: 127 } };
  const results = await verifyKakaoPlaces([
    { ...selection, placeId: "2" },
    { ...selection, placeId: "1" },
    { ...selection, page: 2, placeId: "1" },
    { ...selection, placeId: "2", scope: { latitude: 35, longitude: 129 } },
    { ...selection, placeId: "1", scope: null },
  ]);

  assert.deepEqual(
    results.map(({ place }) => place?.id),
    ["2", "1", "1", "2", "1"],
  );
  assert.ok(results.every(({ region }) => region.code === "1111000000"));
  const searches = requests.filter(({ pathname }) => pathname.endsWith("keyword.json"));
  assert.equal(searches.length, 4);
  assert.deepEqual(
    searches.map(({ searchParams }) => [searchParams.get("page"), searchParams.get("x"), searchParams.get("y")]),
    [
      ["1", "127", "37.5"],
      ["2", "127", "37.5"],
      ["1", "129", "35"],
      ["1", null, null],
    ],
  );
});

test("검색 실패와 검색 결과에 없는 ID는 검증에 실패한다", async (t) => {
  const requests = mockKakao(t);
  assert.deepEqual(
    await verifyKakaoPlaces([
      { page: 1, placeId: "999", query: "카페" },
      { page: 1, placeId: "1", query: "검색 실패" },
    ]),
    [{ error: "place" }, { error: "place" }],
  );
  assert.ok(requests.every(({ pathname }) => pathname.endsWith("keyword.json")));
});

test("지역 확인 실패는 장소 확인 실패와 구분하고 빈 선택은 요청하지 않는다", async (t) => {
  const requests = mockKakao(t, { missingRegion: true });
  assert.deepEqual(await verifyKakaoPlaces([]), []);
  assert.equal(requests.length, 0);
  assert.deepEqual(await verifyKakaoPlaces([{ page: 1, placeId: "1", query: "카페" }]), [{ error: "region" }]);
});
