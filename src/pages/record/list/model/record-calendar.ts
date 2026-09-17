import { addDays, addMonths, eachDayOfInterval, format, parseISO, startOfWeek } from "date-fns";

type CalendarRange = {
  from: string;
  to: string;
};

type DatedRecord = {
  recorded_at: string;
  recorded_until: string | null;
};

export type CalendarDayAction = "clear" | "create" | "open" | "wait";

const MONTH_PATTERN = /^[1-9]\d{3}-(0[1-9]|1[0-2])$/;
const KST_OFFSET = 9 * 60 * 60 * 1000;

// 서버 렌더링과 브라우저가 같은 날을 그리도록 기기 시간대 대신 한국 시간(서머타임 없음)으로 정한다.
export const getToday = (now = new Date()) => {
  return new Date(now.getTime() + KST_OFFSET).toISOString().slice(0, 10);
};

export const parseCalendarMonth = (value: string | null | undefined, today: string) => {
  return value && MONTH_PATTERN.test(value) ? value : today.slice(0, 7);
};

export const shiftMonth = (month: string, amount: number) => {
  return format(addMonths(parseISO(`${month}-01`), amount), "yyyy-MM");
};

// 달력은 월 첫 주 일요일부터 6주(42일)를 고정으로 보여준다.
export const getCalendarRange = (month: string): CalendarRange => {
  const start = startOfWeek(parseISO(`${month}-01`));
  return { from: format(start, "yyyy-MM-dd"), to: format(addDays(start, 41), "yyyy-MM-dd") };
};

// 두 달력이 함께 보여주는 날짜 범위. 앞뒤 달의 날짜는 이전 달 조회 결과로도 채울 수 있다.
export const getOverlapRange = (a: CalendarRange, b: CalendarRange): CalendarRange | null => {
  const from = a.from > b.from ? a.from : b.from;
  const to = a.to < b.to ? a.to : b.to;
  return from <= to ? { from, to } : null;
};

/**
 * 날짜 칸에 제목을 몇 줄 놓을 수 있는지. 칸 높이는 화면 높이를 6주가 나눠 가지므로 기기마다 다르다.
 * 버튼 위 여백(0.25rem)과 날짜 숫자(1.5rem) 아래로 한 줄(1rem + 간격 1px)씩 쌓는다. 날짜 칸 스타일과 맞춰야 한다.
 */
export const getTitleLines = (buttonHeight: number, rootFontSize: number) => {
  return Math.max(1, Math.floor((buttonHeight - 1.75 * rootFontSize) / (rootFontSize + 1)));
};

// 줄이 모자라면 마지막 줄은 '+N'이 쓴다.
export const getVisibleTitleCount = (recordCount: number, lines: number) => {
  return recordCount > lines ? lines - 1 : recordCount;
};

export const getCalendarDayAction = (
  records: readonly unknown[] | undefined,
  isSelected: boolean,
): CalendarDayAction => {
  if (!records) return "wait";
  if (records.length > 0) return "open";
  return isSelected ? "clear" : "create";
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
