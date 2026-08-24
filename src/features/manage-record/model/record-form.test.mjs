import { validateRecordInput } from "./record-form.ts";
import assert from "node:assert/strict";

const valid = validateRecordInput({
  recordedAt: "2026-08-10",
  recordedUntil: "2026-08-12",
  regionCode: "1144012300",
  regionLabel: "홍대",
  regionName: "서울 마포구 망원동",
  places: JSON.stringify([
    { kind: "kakao", page: 1, providerPlaceId: "123", query: "카페", save: false, scope: null },
    {
      kind: "kakao",
      page: 1,
      providerPlaceId: "123",
      query: "카페",
      save: true,
      scope: { latitude: 37.5563, longitude: 126.9013 },
    },
  ]),
  weather: "rainy",
  activity: "  카페에서 이야기함  ",
  memo: "   ",
});

assert.deepEqual(valid, {
  data: {
    recordedAt: "2026-08-10",
    recordedUntil: "2026-08-12",
    regionCode: "1144012300",
    regionLabel: "홍대",
    regionName: "서울 마포구 망원동",
    places: [
      {
        kind: "kakao",
        page: 1,
        providerPlaceId: "123",
        query: "카페",
        save: true,
        scope: { latitude: 37.5563, longitude: 126.9013 },
      },
    ],
    weather: "rainy",
    activity: "카페에서 이야기함",
  },
});

// 기준점이 깨져서 오면 같은 검색을 재현할 수 없으니 통째로 거른다.
const brokenScope = validateRecordInput({
  recordedAt: "2026-08-10",
  recordedUntil: "",
  regionCode: "1144012300",
  regionLabel: "홍대",
  regionName: "서울 마포구 망원동",
  places: JSON.stringify([
    { kind: "kakao", page: 1, providerPlaceId: "123", query: "카페", save: true, scope: { latitude: 37.5563 } },
  ]),
  weather: "sunny",
  activity: "카페에서 이야기함",
  memo: "",
});
assert.deepEqual(Object.keys(brokenScope.fieldErrors ?? {}), ["places"]);

const invalid = validateRecordInput({
  recordedAt: "2026-02-30",
  recordedUntil: "2026-02-20",
  regionCode: "망원동",
  regionLabel: "",
  regionName: "",
  places: "not-json",
  weather: "stormy",
  activity: " ",
  memo: "",
});
assert.deepEqual(Object.keys(invalid.fieldErrors ?? {}).sort(), [
  "activity",
  "places",
  "recordedAt",
  "recordedUntil",
  "regionCode",
  "weather",
]);

const invalidPeriod = validateRecordInput({
  recordedAt: "2026-08-10",
  recordedUntil: "2026-08-09",
  regionCode: "1144012300",
  regionLabel: "홍대",
  regionName: "서울 마포구 망원동",
  places: "[]",
  weather: "cloudy",
  activity: "산책",
  memo: "",
});
assert.equal(invalidPeriod.fieldErrors?.recordedUntil, "종료일은 시작일과 같거나 이후여야 해요.");

const singleDay = validateRecordInput({
  recordedAt: "2026-08-10",
  recordedUntil: "2026-08-10",
  regionCode: "1144012300",
  regionLabel: "홍대",
  regionName: "서울 마포구 망원동",
  places: "[]",
  weather: "sunny",
  activity: "산책",
  memo: "",
});
assert.equal(singleDay.data?.recordedUntil, undefined);
