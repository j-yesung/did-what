import {
  getCalendarRange,
  getTitleLines,
  getToday,
  getVisibleTitleCount,
  groupRecordsByDate,
  parseCalendarMonth,
  shiftMonth,
} from "@/pages/record/list/model/record-calendar";

import assert from "node:assert/strict";
import test from "node:test";

const idsByDate = (recordsByDate) => {
  return Object.fromEntries([...recordsByDate].map(([date, records]) => [date, records.map((record) => record.id)]));
};

test("월 첫 주 일요일부터 6주를 조회 범위로 잡는다", () => {
  assert.deepEqual(getCalendarRange("2026-09"), { from: "2026-08-30", to: "2026-10-10" });
  // 일요일에 시작하는 4주짜리 2월도 6주를 채운다.
  assert.deepEqual(getCalendarRange("2026-02"), { from: "2026-02-01", to: "2026-03-14" });
  assert.deepEqual(getCalendarRange("2028-02"), { from: "2028-01-30", to: "2028-03-11" });
});

test("잘못된 월은 오늘이 속한 월로 되돌리고 연도를 넘겨 이동한다", () => {
  assert.equal(parseCalendarMonth("2026-10", "2026-09-17"), "2026-10");
  for (const value of [null, "", "2026-13", "2026-9", "0999-01", "2026-09-01"]) {
    assert.equal(parseCalendarMonth(value, "2026-09-17"), "2026-09");
  }
  assert.equal(shiftMonth("2026-12", 1), "2027-01");
  assert.equal(shiftMonth("2026-01", -1), "2025-12");
});

test("오늘은 한국 시간 기준 날짜다", () => {
  assert.equal(getToday(new Date("2026-09-30T14:59:59Z")), "2026-09-30");
  assert.equal(getToday(new Date("2026-09-30T15:00:00Z")), "2026-10-01");
});

test("기록을 첫날부터 마지막 날까지 범위 안의 날짜에 나눈다", () => {
  const range = getCalendarRange("2026-09");
  const records = [
    { id: "month-boundary", recorded_at: "2026-09-29", recorded_until: "2026-10-02" },
    { id: "single", recorded_at: "2026-09-29", recorded_until: null },
    { id: "same-day", recorded_at: "2026-09-01", recorded_until: "2026-09-01" },
    { id: "starts-before", recorded_at: "2026-08-28", recorded_until: "2026-08-31" },
    { id: "ends-after", recorded_at: "2026-10-09", recorded_until: "2026-10-20" },
  ];

  assert.deepEqual(idsByDate(groupRecordsByDate(records, range)), {
    "2026-09-29": ["month-boundary", "single"],
    "2026-09-30": ["month-boundary"],
    "2026-10-01": ["month-boundary"],
    "2026-10-02": ["month-boundary"],
    "2026-09-01": ["same-day"],
    "2026-08-30": ["starts-before"],
    "2026-08-31": ["starts-before"],
    "2026-10-09": ["ends-after"],
    "2026-10-10": ["ends-after"],
  });
});

test("윤년 2월 29일을 건너뛰지 않는다", () => {
  const records = [{ id: "leap", recorded_at: "2028-02-28", recorded_until: "2028-03-01" }];

  assert.deepEqual(idsByDate(groupRecordsByDate(records, getCalendarRange("2028-02"))), {
    "2028-02-28": ["leap"],
    "2028-02-29": ["leap"],
    "2028-03-01": ["leap"],
  });
});

test("칸 높이에 들어가는 제목 줄 수를 구한다", () => {
  // 16px 기준: 숫자 영역 28px + 줄마다 17px
  assert.equal(getTitleLines(44, 16), 1, "한 줄도 안 들어가도 최소 한 줄");
  assert.equal(getTitleLines(45, 16), 1);
  assert.equal(getTitleLines(61.9, 16), 1);
  assert.equal(getTitleLines(62, 16), 2);
  assert.equal(getTitleLines(79, 16), 3);
  assert.equal(getTitleLines(99.7, 16), 4);
  // 큰 글자(20px)에서는 숫자 영역 35px + 줄마다 21px
  assert.equal(getTitleLines(76.9, 20), 1);
  assert.equal(getTitleLines(77, 20), 2);
});

test("줄이 모자라면 마지막 줄을 +N에 쓴다", () => {
  assert.equal(getVisibleTitleCount(0, 2), 0);
  assert.equal(getVisibleTitleCount(2, 2), 2, "딱 맞으면 +N 없이 모두 보인다");
  assert.equal(getVisibleTitleCount(3, 2), 1);
  assert.equal(getVisibleTitleCount(5, 4), 3);
  assert.equal(getVisibleTitleCount(3, 1), 0, "한 줄뿐이면 +N만 보인다");
});
