import { parseTravelDirections } from "./travel-directions-model.ts";
import assert from "node:assert/strict";
import test from "node:test";

test("도로 구간의 좌표를 순서대로 연결하고 거리와 시간을 가져온다", () => {
  const result = parseTravelDirections({
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
  assert.equal(parseTravelDirections({ routes: [{ result_code: 104 }] }), null);
  assert.equal(
    parseTravelDirections({
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
