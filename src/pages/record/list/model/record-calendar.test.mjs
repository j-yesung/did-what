import { getCalendarWeekLayout, groupRecordsByDate } from "@/pages/record/list/model/record-calendar";

import assert from "node:assert/strict";
import test from "node:test";

const dates = ["2026-10-04", "2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09", "2026-10-10"];
const range = { from: "2026-09-27", to: "2026-11-07" };
const record = (id, start, end = null) => ({
  id,
  activity: "대구 여행",
  recorded_at: start,
  recorded_until: end,
});
const layout = (records, days = dates, lines = 3) =>
  getCalendarWeekLayout(groupRecordsByDate(records, range), days, lines);
const positions = (result) => result.segments.map(({ record, start, end, lane }) => [record.id, start, end, lane]);

test("토요일에 시작한 기간은 다음 주 일요일부터 이어지는 하나의 띠로 표시한다", () => {
  const records = [record("trip", "2026-10-03", "2026-10-05")];
  const previousWeek = [
    "2026-09-27",
    "2026-09-28",
    "2026-09-29",
    "2026-09-30",
    "2026-10-01",
    "2026-10-02",
    "2026-10-03",
  ];
  assert.deepEqual(positions(layout(records, previousWeek)), [["trip", 6, 6, 0]]);
  assert.deepEqual(positions(layout(records)), [["trip", 0, 1, 0]]);
});

test("주중 기간도 날짜 사이에서 제목을 반복하지 않고 연결한다", () => {
  assert.deepEqual(positions(layout([record("trip", "2026-10-06", "2026-10-09")])), [["trip", 2, 5, 0]]);
});

test("겹친 기간은 다른 줄에 놓고 같은 제목의 별도 기록도 유지한다", () => {
  const result = layout([
    record("single", "2026-10-07"),
    record("trip", "2026-10-06", "2026-10-09"),
    record("other", "2026-10-09", "2026-10-10"),
  ]);
  assert.deepEqual(positions(result), [
    ["trip", 2, 5, 0],
    ["other", 5, 6, 1],
    ["single", 3, 3, 1],
  ]);
  assert.deepEqual(result.hiddenCounts, [0, 0, 0, 0, 0, 0, 0]);
});

test("줄이 부족해도 기간 띠를 유지하고 날짜별 숨겨진 기록 수를 표시한다", () => {
  const result = layout(
    [
      record("trip", "2026-10-04", "2026-10-10"),
      record("first", "2026-10-06"),
      record("second", "2026-10-06"),
      record("last", "2026-10-08"),
    ],
    dates,
    2,
  );
  assert.deepEqual(positions(result), [["trip", 0, 6, 0]]);
  assert.deepEqual(result.hiddenCounts, [0, 0, 2, 0, 1, 0, 0]);
  assert.equal(result.visibleLines, 1);
});

test("월 경계를 넘는 기간은 보이는 주 범위에 맞춰 연결하고 빈 주는 비워 둔다", () => {
  const monthBoundary = [
    "2026-09-27",
    "2026-09-28",
    "2026-09-29",
    "2026-09-30",
    "2026-10-01",
    "2026-10-02",
    "2026-10-03",
  ];
  assert.deepEqual(positions(layout([record("trip", "2026-09-25", "2026-10-06")], monthBoundary)), [["trip", 0, 6, 0]]);
  assert.deepEqual(positions(layout([])), []);
});

test("제목 한 줄만 들어갈 때는 넘친 날짜에 전체 기록 수를 표시한다", () => {
  const result = layout([record("first", "2026-10-06"), record("second", "2026-10-06")], dates, 1);
  assert.deepEqual(result.segments, []);
  assert.deepEqual(result.hiddenCounts, [0, 0, 2, 0, 0, 0, 0]);
});
