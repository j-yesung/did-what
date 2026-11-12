import { getDailyReminderDate } from "./daily-reminder.ts";
import assert from "node:assert/strict";
import { test } from "node:test";

test("한국 시간 오전 9시대에만 해당 날짜를 반환한다", () => {
  assert.equal(getDailyReminderDate(new Date("2026-11-11T23:59:59Z")), null);
  assert.equal(getDailyReminderDate(new Date("2026-11-12T00:00:00Z")), "2026-11-12");
  assert.equal(getDailyReminderDate(new Date("2026-11-12T00:59:59Z")), "2026-11-12");
  assert.equal(getDailyReminderDate(new Date("2026-11-12T01:00:00Z")), null);
});

test("연도가 바뀌어도 서버 시간대와 무관하게 한국 날짜를 사용한다", () => {
  assert.equal(getDailyReminderDate(new Date("2027-01-01T00:00:00Z")), "2027-01-01");
});
