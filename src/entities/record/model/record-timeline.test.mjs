import {
  formatRecordRelativeDay,
  formatRecordTimelineDate,
  formatRecordTimelineMonth,
  getRecordDateMark,
  getRecordTimelineItemState,
} from "@/entities/record/model/record-timeline";

import assert from "node:assert/strict";
import test from "node:test";

test("월이 시작하는 지점을 표시한다", () => {
  const records = [
    { recorded_at: "2026-09-17" },
    { recorded_at: "2026-09-17" },
    { recorded_at: "2026-09-14" },
    { recorded_at: "2026-08-30" },
  ];

  assert.deepEqual(
    records.map((_, index) => getRecordTimelineItemState(records, index)),
    [{ startsMonth: true }, { startsMonth: false }, { startsMonth: false }, { startsMonth: true }],
  );
  assert.equal(formatRecordTimelineMonth(records[0].recorded_at), "2026년 9월");
});

test("기록 하나만 있어도 월의 시작을 표시한다", () => {
  assert.deepEqual(getRecordTimelineItemState([{ recorded_at: "2026-10-04" }], 0), { startsMonth: true });
});

test("날짜 표시는 큰 날짜와 월·요일 또는 끝나는 날을 나눈다", () => {
  assert.deepEqual(getRecordDateMark("2026-11-02"), { day: 2, label: "11월 월" });
  assert.deepEqual(getRecordDateMark("2026-10-18", "2026-10-20"), { day: 18, label: "10월 ~20일" });
  assert.deepEqual(getRecordDateMark("2026-10-30", "2026-11-02"), { day: 30, label: "10월 ~11.2" });
});

test("오늘과의 거리를 일·주·개월·년으로 줄여 말한다", () => {
  const today = "2026-11-03";
  assert.deepEqual(
    [
      "2026-11-03",
      "2026-11-02",
      "2026-10-30",
      "2026-10-25",
      "2026-09-19",
      "2025-11-03",
      "2026-11-04",
      "2026-11-10",
    ].map((date) => formatRecordRelativeDay(date, today)),
    ["오늘", "어제", "4일 전", "1주 전", "1개월 전", "1년 전", "내일", "7일 후"],
  );
});

test("타임라인 날짜는 짧은 기간을 표시하고 연도를 넘기면 양쪽 연도를 보존한다", () => {
  assert.equal(formatRecordTimelineDate("2026-10-04"), "10월 4일 일요일");
  assert.equal(formatRecordTimelineDate("2026-10-04", "2026-10-04"), "10월 4일 일요일");
  assert.equal(formatRecordTimelineDate("2026-09-28", "2026-09-30"), "9.28 – 9.30");
  assert.equal(formatRecordTimelineDate("2026-09-30", "2026-10-02"), "9.30 – 10.2");
  assert.equal(formatRecordTimelineDate("2025-12-31", "2026-01-02"), "2025.12.31 – 2026.1.2");
});
