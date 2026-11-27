import { getWeekday } from "@/shared/lib/date/format-date";

export type RecordPeriodDay = { date: string; label: string; weekday: string };

const toDay = (date: string, withYear: boolean, longWeekday: boolean): RecordPeriodDay => {
  const weekday = getWeekday(date);
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
