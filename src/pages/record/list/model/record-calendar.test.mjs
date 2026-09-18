import {
  getCalendarDayAction,
  getCalendarHref,
  getCalendarMonthSummary,
  getCalendarRange,
  getCalendarSwipeMonthShift,
  getTitleLines,
  getToday,
  getVisibleTitleCount,
  groupRecordsByDate,
  parseCalendarDate,
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

test("가로 스와이프 거리나 속도가 충분할 때만 월을 넘긴다", () => {
  assert.equal(getCalendarSwipeMonthShift(-48, 0), 1, "왼쪽으로 밀면 다음 달");
  assert.equal(getCalendarSwipeMonthShift(48, 0), -1, "오른쪽으로 밀면 이전 달");
  assert.equal(getCalendarSwipeMonthShift(-20, -500), 1, "짧고 빠른 왼쪽 플릭");
  assert.equal(getCalendarSwipeMonthShift(20, 500), -1, "짧고 빠른 오른쪽 플릭");
  assert.equal(getCalendarSwipeMonthShift(47, 499), 0);
  assert.equal(getCalendarSwipeMonthShift(9, 900), 0, "작은 흔들림은 빠르더라도 무시");
});

test("Drawer 복원 날짜는 달력 범위 안의 올바른 날짜만 받는다", () => {
  assert.equal(parseCalendarDate("2026-09-17", "2026-09"), "2026-09-17");
  assert.equal(parseCalendarDate("2026-10-10", "2026-09"), "2026-10-10", "마지막 주의 이웃 날짜");
  assert.equal(parseCalendarDate("2026-10-11", "2026-09"), null);
  assert.equal(parseCalendarDate("2026-02-30", "2026-02"), null);
  assert.equal(parseCalendarDate(null, "2026-09"), null);
});

test("달력 주소에 Drawer 복원 날짜를 선택적으로 넣는다", () => {
  assert.equal(getCalendarHref("2026-09"), "/records?view=calendar&month=2026-09");
  assert.equal(getCalendarHref("2026-09", "2026-09-17"), "/records?view=calendar&month=2026-09&date=2026-09-17");
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

test("날짜의 조회 상태와 기록 유무에 따라 다음 동작을 고른다", () => {
  assert.equal(getCalendarDayAction(undefined, false), "wait");
  assert.equal(getCalendarDayAction([{ id: "record" }], false), "open");
  assert.equal(getCalendarDayAction([], false), "create");
  assert.equal(getCalendarDayAction([], true), "clear");
});

test("이번 달 요약은 이번 달 날짜만 세고 여러 날 기록을 한 번만 센다", () => {
  const recordsByDate = new Map([
    ["2026-08-31", [{ id: "a", region_name: "종로구" }]],
    [
      "2026-09-01",
      [
        { id: "a", region_name: "종로구" },
        { id: "b", region_name: "마포구" },
      ],
    ],
    ["2026-09-02", [{ id: "a", region_name: "종로구" }]],
    ["2026-09-03", [{ id: "c" }]],
  ]);

  assert.deepEqual(getCalendarMonthSummary(recordsByDate, "2026-09"), { recordCount: 3, regionCount: 2 });
  assert.deepEqual(getCalendarMonthSummary(new Map(), "2026-09"), { recordCount: 0, regionCount: 0 });
});
