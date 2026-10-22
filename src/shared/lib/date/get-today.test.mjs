import { getToday } from "@/shared/lib/date/get-today";

import assert from "node:assert/strict";
import test from "node:test";

test("한국 자정과 연도 경계를 기준으로 오늘 날짜를 계산한다", () => {
  assert.equal(getToday(new Date("2026-12-31T14:59:59Z")), "2026-12-31");
  assert.equal(getToday(new Date("2026-12-31T15:00:00Z")), "2027-01-01");
  assert.equal(getToday(new Date("2026-10-22T00:00:00+09:00")), "2026-10-22");
});
