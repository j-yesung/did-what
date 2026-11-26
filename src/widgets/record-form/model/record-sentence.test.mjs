import { getDirectionParticle } from "@/shared/lib/text/particle";
import { formatRecordDateSlot, getRecordLocationSummary } from "@/widgets/record-form/model/record-sentence";

import assert from "node:assert/strict";
import { test } from "node:test";

const TODAY = "2026-11-24";

test("날짜 칸은 올해면 연도를 빼고, 기간은 겹치는 단위를 줄인다", () => {
  assert.equal(formatRecordDateSlot("2026-11-24", "2026-11-24", TODAY), "11월 24일");
  assert.equal(formatRecordDateSlot("2026-11-24", null, TODAY), "11월 24일");
  assert.equal(formatRecordDateSlot("2026-11-24", "2026-11-26", TODAY), "11월 24일~26일");
  assert.equal(formatRecordDateSlot("2026-11-30", "2026-12-02", TODAY), "11월 30일~12월 2일");
  assert.equal(formatRecordDateSlot("2025-12-30", "2026-01-02", TODAY), "2025년 12월 30일~2026년 1월 2일");
  assert.equal(formatRecordDateSlot("", "", TODAY), null);
});

test("받침이 없거나 ㄹ이면 '로', 그 밖의 받침이면 '으로'", () => {
  assert.equal(getDirectionParticle("데이트"), "로");
  assert.equal(getDirectionParticle("기념일"), "로");
  assert.equal(getDirectionParticle("무슨 일"), "로");
  assert.equal(getDirectionParticle("여행"), "으로");
  assert.equal(getDirectionParticle("모임"), "으로");
});

test("장소가 있으면 첫 장소, '외 N곳'은 장소와 장소가 없는 지역만 센다", () => {
  const region = (code, label) => ({ code, fullName: label, label, latitude: 0, longitude: 0, name: label });
  const place = (name, code) => ({ key: name, name, region: region(code, "성수동") });

  assert.equal(getRecordLocationSummary([], []), null);
  assert.deepEqual(getRecordLocationSummary([region("1", "성수동"), region("2", "연남동")], []), {
    more: 1,
    name: "성수동",
  });
  assert.deepEqual(
    getRecordLocationSummary(
      [region("1", "성수"), region("2", "연남동")],
      [place("카페 어니언 성수", "1"), place("서울숲", "1")],
    ),
    { more: 2, name: "카페 어니언 성수" },
  );
});
