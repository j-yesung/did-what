import { addDays, addMonths, eachDayOfInterval, format, parseISO, startOfWeek } from "date-fns";

import { isIsoDate } from "@/shared/lib/validation/is-iso-date";

type CalendarRange = {
  from: string;
  to: string;
};

type DatedRecord = {
  recorded_at: string;
  recorded_until: string | null;
};

const MONTH_PATTERN = /^[1-9]\d{3}-(0[1-9]|1[0-2])$/;
const SWIPE_HYSTERESIS = 10;
const SWIPE_DISTANCE = 48;
const SWIPE_VELOCITY = 500;

export const parseCalendarMonth = (value: string | null | undefined, today: string) => {
  return value && MONTH_PATTERN.test(value) ? value : today.slice(0, 7);
};

export const parseCalendarDate = (value: string | null | undefined, month: string) => {
  if (!value || !isIsoDate(value)) return null;
  const range = getCalendarRange(month);
  return range.from <= value && value <= range.to ? value : null;
};

export const getCalendarHref = (month: string, date?: string | null, search = "") => {
  const params = new URLSearchParams(search);
  params.set("view", "calendar");
  params.set("month", month);
  if (date) params.set("date", date);
  else params.delete("date");
  return `/records?${params}`;
};

export const shiftMonth = (month: string, amount: number) => {
  return format(addMonths(parseISO(`${month}-01`), amount), "yyyy-MM");
};

export const getCalendarSwipeMonthShift = (offsetX: number, velocityX: number) => {
  if (Math.abs(offsetX) < SWIPE_HYSTERESIS) return 0;
  if (Math.abs(offsetX) < SWIPE_DISTANCE && Math.abs(velocityX) < SWIPE_VELOCITY) return 0;
  return offsetX < 0 ? 1 : -1;
};

// 달력은 월 첫 주 일요일부터 6주(42일)를 고정으로 보여준다.
export const getCalendarRange = (month: string): CalendarRange => {
  const start = startOfWeek(parseISO(`${month}-01`));
  return { from: format(start, "yyyy-MM-dd"), to: format(addDays(start, 41), "yyyy-MM-dd") };
};

export const getDefaultCalendarDate = (month: string, today: string) => {
  return today.startsWith(month) ? today : `${month}-01`;
};

export const isMultiDayRecord = (record: DatedRecord) => {
  return Boolean(record.recorded_until && record.recorded_until !== record.recorded_at);
};

// 여러 날 기록은 범위 안의 모든 날짜에 넣는다. 날짜 안의 순서는 받은 순서(최신순)를 따른다.
export const groupRecordsByDate = <T extends DatedRecord>(records: readonly T[], range: CalendarRange) => {
  const recordsByDate = new Map<string, T[]>();

  for (const record of records) {
    const lastDay = record.recorded_until ?? record.recorded_at;
    const start = record.recorded_at > range.from ? record.recorded_at : range.from;
    const end = lastDay < range.to ? lastDay : range.to;
    if (start > end) continue;

    for (const day of eachDayOfInterval({ start: parseISO(start), end: parseISO(end) })) {
      const key = format(day, "yyyy-MM-dd");
      const dayRecords = recordsByDate.get(key);
      if (dayRecords) dayRecords.push(record);
      else recordsByDate.set(key, [record]);
    }
  }

  return recordsByDate;
};

/** 기간 기록은 주 안에서 같은 줄을 유지하고, 겹치는 기록은 빈 줄에 배치한다. */
export const getCalendarWeekLayout = <T extends DatedRecord & { id: string }>(
  recordsByDate: ReadonlyMap<string, readonly T[]>,
  dates: readonly string[],
  lines: number,
) => {
  const records = new Map<string, T>();
  for (const date of dates) {
    for (const record of recordsByDate.get(date) ?? []) records.set(record.id, record);
  }

  const segments = [...records.values()]
    .map((record) => {
      const start = dates.findIndex((date) => date >= record.recorded_at);
      const end = dates.findLastIndex((date) => date <= (record.recorded_until ?? record.recorded_at));
      return { record, start, end, lane: 0 };
    })
    .sort((first, second) => second.end - second.start - (first.end - first.start));
  const lanes: boolean[][] = [];
  for (const segment of segments) {
    let lane = lanes.findIndex((occupied) =>
      dates.every((_, column) => column < segment.start || column > segment.end || !occupied[column]),
    );
    if (lane === -1) {
      lane = lanes.length;
      lanes.push(Array(dates.length).fill(false));
    }
    segment.lane = lane;
    for (let column = segment.start; column <= segment.end; column++) lanes[lane][column] = true;
  }

  const hiddenCounts = dates.map(
    (_, column) =>
      segments.filter((segment) => segment.lane >= lines && segment.start <= column && column <= segment.end).length,
  );
  return { segments: segments.filter((segment) => segment.lane < lines), hiddenCounts };
};
