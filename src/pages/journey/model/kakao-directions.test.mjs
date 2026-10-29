import { hasNoKakaoRoute, nearbyRoute, parseKakaoDirections, straightHomeRoute } from "./kakao-directions.ts";
import assert from "node:assert/strict";
import test from "node:test";

test("같은 건물 안의 10m 이내 장소는 0m로 잇고 떨어진 장소는 길찾기를 한다", () => {
  const origin = { latitude: 37.54, longitude: 127.04 };
  const near = nearbyRoute(origin, { latitude: 37.54004, longitude: 127.04 });
  assert.equal(near.distance, 0);
  assert.equal(near.duration, 0);
  assert.equal(near.straight, undefined);
  assert.equal(nearbyRoute(origin, { latitude: 37.541, longitude: 127.04 }), null);
});

test("도로 구간의 좌표를 순서대로 연결하고 거리와 시간을 가져온다", () => {
  const result = parseKakaoDirections({
    routes: [
      {
        result_code: 0,
        summary: { distance: 1234, duration: 300 },
        sections: [{ roads: [{ vertexes: [127, 37, 127.1, 37.1] }, { vertexes: [127.1, 37.1, 127.2, 37.2] }] }],
      },
    ],
  });
  assert.deepEqual(result, {
    points: [
      [127, 37],
      [127.1, 37.1],
      [127.1, 37.1],
      [127.2, 37.2],
    ],
    distance: 1234,
    duration: 300,
  });
});

test("실패 응답이나 불완전한 좌표는 경로로 표시하지 않는다", () => {
  assert.equal(parseKakaoDirections({ routes: [{ result_code: 104 }] }), null);
  assert.equal(
    parseKakaoDirections({
      routes: [
        {
          result_code: 0,
          summary: { distance: 1, duration: 1 },
          sections: [{ roads: [{ vertexes: [127, 37, 128] }] }],
        },
      ],
    }),
    null,
  );
});

test("도로 경로가 없다는 응답만 직선 대체 대상으로 본다", () => {
  assert.equal(hasNoKakaoRoute({ routes: [{ result_code: 1 }] }), true);
  assert.equal(hasNoKakaoRoute({ routes: [{ result_code: 0 }] }), false);
  assert.equal(hasNoKakaoRoute({ msg: "rate limited" }), false);
  assert.equal(hasNoKakaoRoute(null), false);
});

test("직선 집 구간은 집 좌표를 약 110m 단위로 흐리고 거리·시간을 합산하지 않는다", () => {
  const route = straightHomeRoute(
    { latitude: 37.566535, longitude: 126.977969 },
    { latitude: 33.5, longitude: 126.53 },
  );
  assert.deepEqual(route.points, [
    [126.978, 37.567],
    [126.53, 33.5],
  ]);
  assert.equal(route.distance, 0);
  assert.equal(route.duration, 0);
  assert.equal(route.straight, true);
});
