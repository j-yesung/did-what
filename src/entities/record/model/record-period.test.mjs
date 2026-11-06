import { getRecordPeriodDays } from "./record-period.ts";
import assert from "node:assert/strict";
import { test } from "node:test";

const text = (days) => days.map(({ label, weekday }) => `${label} ${weekday}`).join(" – ");

test("하루 기록은 연도와 요일 전체를 적는다", () => {
  assert.equal(text(getRecordPeriodDays("2026-11-02")), "2026.11.02 월요일");
  assert.equal(text(getRecordPeriodDays("2026-11-02", "2026-11-02")), "2026.11.02 월요일");
});

test("여러 날 기록은 요일을 줄이고 같은 해면 끝 날짜의 연도를 생략한다", () => {
  assert.equal(text(getRecordPeriodDays("2026-10-17", "2026-10-18")), "2026.10.17 토 – 10.18 일");
  assert.equal(text(getRecordPeriodDays("2025-12-31", "2026-01-01")), "2025.12.31 수 – 2026.01.01 목");
});
