const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export type RecordPeriodDay = { date: string; label: string; weekday: string };

const toDay = (date: string, withYear: boolean, longWeekday: boolean): RecordPeriodDay => {
  const [year, month, day] = date.split("-").map(Number);
  const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  return {
    date,
    label: (withYear ? date : date.slice(5)).replaceAll("-", "."),
    weekday: longWeekday ? `${weekday}요일` : weekday,
  };
};

export const getRecordPeriodDays = (recordedAt: string, recordedUntil?: string | null): RecordPeriodDay[] => {
  if (!recordedUntil || recordedUntil === recordedAt) return [toDay(recordedAt, true, true)];
  return [
    toDay(recordedAt, true, false),
    toDay(recordedUntil, recordedUntil.slice(0, 4) !== recordedAt.slice(0, 4), false),
  ];
};
