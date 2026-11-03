type TimelineRecord = {
  recorded_at: string;
};

export const getRecordTimelineItemState = (records: readonly TimelineRecord[], index: number) => {
  const month = records[index]?.recorded_at.slice(0, 7);

  return { startsMonth: month !== records[index - 1]?.recorded_at.slice(0, 7) };
};

export const formatRecordTimelineMonth = (recordedAt: string) => {
  const [year, month] = recordedAt.split("-");
  return `${year}년 ${Number(month)}월`;
};

const WEEKDAY = new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", weekday: "long" });
const WEEKDAY_SHORT = new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", weekday: "short" });
const DAY_MS = 86_400_000;

export const getRecordDateMark = (recordedAt: string, recordedUntil?: string | null) => {
  const [, month, day] = recordedAt.split("-").map(Number);
  if (!recordedUntil || recordedUntil === recordedAt)
    return { day, label: `${month}월 ${WEEKDAY_SHORT.format(new Date(`${recordedAt}T00:00:00+09:00`))}` };

  const [, endMonth, endDay] = recordedUntil.split("-").map(Number);
  return { day, label: `${month}월 ~${endMonth === month ? `${endDay}일` : `${endMonth}.${endDay}`}` };
};

export const formatRecordRelativeDay = (date: string, today: string) => {
  const days = Math.round((Date.parse(today) - Date.parse(date)) / DAY_MS);
  if (days < 0) return days === -1 ? "내일" : `${-days}일 후`;
  if (days === 0) return "오늘";
  if (days === 1) return "어제";
  if (days < 7) return `${days}일 전`;
  if (days < 30) return `${Math.floor(days / 7)}주 전`;
  if (days < 365) return `${Math.floor(days / 30)}개월 전`;
  return `${Math.floor(days / 365)}년 전`;
};

export const formatRecordTimelineDate = (recordedAt: string, recordedUntil?: string | null) => {
  const [year, month, day] = recordedAt.split("-");
  if (!recordedUntil || recordedUntil === recordedAt) {
    return `${Number(month)}월 ${Number(day)}일 ${WEEKDAY.format(new Date(`${recordedAt}T00:00:00+09:00`))}`;
  }
  const [endYear, endMonth, endDay] = recordedUntil.split("-");
  const crossesYear = year !== endYear;
  return `${crossesYear ? `${year}.` : ""}${Number(month)}.${Number(day)} – ${crossesYear ? `${endYear}.` : ""}${Number(endMonth)}.${Number(endDay)}`;
};
