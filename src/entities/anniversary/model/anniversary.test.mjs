import { getAnniversaryNamesForDate, getFeaturedAnniversary, prepareAnniversary } from "./anniversary.ts";
import assert from "node:assert/strict";
import test from "node:test";

const christmas = { id: "christmas", name: "크리스마스", date: "2026-12-25" };
const draft = { id: "christmas", name: "크리스마스", monthDay: "12-25" };

test("등록한 날짜 이전에는 반복하지 않고 가장 가까운 기념일을 표시한다", () => {
  assert.equal(getFeaturedAnniversary([], "2026-11-25"), null);
  assert.equal(getFeaturedAnniversary([christmas], "2024-12-25").dday, 730);
  assert.equal(getFeaturedAnniversary([christmas], "2026-12-25").dday, 0);
  assert.equal(getFeaturedAnniversary([christmas], "2026-12-26").date, "2027-12-25");
  const newYear = { id: "new-year", name: "새해", date: "2025-01-01" };
  assert.equal(getFeaturedAnniversary([christmas, newYear], "2026-12-26").name, "새해");
  assert.deepEqual(getAnniversaryNamesForDate([christmas], "2025-12-25"), []);
  assert.deepEqual(getAnniversaryNamesForDate([christmas], "2027-12-25"), ["크리스마스"]);
});

test("2월 29일은 다음 윤년에 표시한다", () => {
  const leap = { id: "leap", name: "윤일", date: "2024-02-29" };
  assert.equal(getFeaturedAnniversary([leap], "2026-01-01").date, "2028-02-29");
  assert.deepEqual(getAnniversaryNamesForDate([leap], "2026-03-01"), []);
  assert.equal(prepareAnniversary({ ...draft, monthDay: "02-29" }, "2026-11-26").anniversary.date, "2028-02-29");
});

test("월·일만 등록하면 오늘 이후 첫 날짜부터 달력에 표시한다", () => {
  assert.deepEqual(prepareAnniversary(draft, "2026-12-25").anniversary, christmas);
  const { anniversary } = prepareAnniversary(draft, "2026-12-26");
  assert.equal(anniversary.date, "2027-12-25");
  assert.deepEqual(getAnniversaryNamesForDate([anniversary], "2025-12-25"), []);
  assert.deepEqual(getAnniversaryNamesForDate([anniversary], "2026-12-25"), []);
  assert.equal(getFeaturedAnniversary([anniversary], "2026-12-26").date, "2027-12-25");
  assert.deepEqual(getAnniversaryNamesForDate([anniversary], "2028-12-25"), ["크리스마스"]);
});

test("잘못된 이름과 월·일을 거절한다", () => {
  for (const input of [null, { ...draft, name: "  " }, { ...draft, monthDay: "02-30" }]) {
    assert.ok(prepareAnniversary(input, "2026-11-26").message);
  }
});
