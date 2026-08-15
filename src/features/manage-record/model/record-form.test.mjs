import { validateRecordInput } from "./record-form.ts";
import assert from "node:assert/strict";

const personId = "0198a393-4df4-4aed-894f-12b13a075e71";
const valid = validateRecordInput({
  recordedAt: "2026-08-10",
  personIds: [personId, personId],
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
  activity: "  카페에서 이야기함  ",
  memo: "   ",
});

assert.deepEqual(valid, {
  data: {
    recordedAt: "2026-08-10",
    personIds: [personId],
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
    activity: "카페에서 이야기함",
  },
});

// 기준점이 깨져서 오면 같은 검색을 재현할 수 없으니 통째로 거른다.
const brokenScope = validateRecordInput({
  recordedAt: "2026-08-10",
  personIds: [personId],
  regionCode: "1144012300",
  regionLabel: "홍대",
  regionName: "서울 마포구 망원동",
  places: JSON.stringify([
    { kind: "kakao", page: 1, providerPlaceId: "123", query: "카페", save: true, scope: { latitude: 37.5563 } },
  ]),
  activity: "카페에서 이야기함",
  memo: "",
});
assert.deepEqual(Object.keys(brokenScope.fieldErrors ?? {}), ["places"]);

const invalid = validateRecordInput({
  recordedAt: "2026-02-30",
  personIds: [],
  regionCode: "망원동",
  regionLabel: "",
  regionName: "",
  places: "not-json",
  activity: " ",
  memo: "",
});
assert.deepEqual(Object.keys(invalid.fieldErrors ?? {}).sort(), [
  "activity",
  "personIds",
  "places",
  "recordedAt",
  "regionCode",
]);
