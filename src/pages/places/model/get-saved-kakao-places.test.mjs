import { getSavedKakaoPlaces } from "./get-saved-kakao-places.ts";
import assert from "node:assert/strict";
import { test } from "node:test";

test("저장된 Kakao 장소 ID를 내부 장소 ID와 연결한다", () => {
  const places = getSavedKakaoPlaces([
    { id: "saved-id", provider: "kakao", provider_place_id: "kakao-id" },
    { id: "other-id", provider: "manual", provider_place_id: "manual-id" },
    { id: "missing-id", provider: "kakao", provider_place_id: null },
  ]);

  assert.deepEqual([...places], [["kakao-id", "saved-id"]]);
});
