type TimelineRecord = {
  recorded_at: string;
};

export const getRecordTimelineItemState = (records: readonly TimelineRecord[], index: number) => {
  const date = records[index]?.recorded_at;
  const previousDate = records[index - 1]?.recorded_at;

  return {
    endsDate: date !== records[index + 1]?.recorded_at,
    startsDate: date !== previousDate,
    startsMonth: date?.slice(0, 7) !== previousDate?.slice(0, 7),
  };
};

export const formatRecordTimelineMonth = (recordedAt: string) => {
  const [year, month] = recordedAt.split("-");
  return `${year}년 ${Number(month)}월`;
};

const WEEKDAY = new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", weekday: "long" });

export const formatRecordTimelineDate = (recordedAt: string, recordedUntil?: string | null) => {
  const [year, month, day] = recordedAt.split("-");
  if (!recordedUntil || recordedUntil === recordedAt) {
    return `${Number(month)}월 ${Number(day)}일 ${WEEKDAY.format(new Date(`${recordedAt}T00:00:00+09:00`))}`;
  }
  const [endYear, endMonth, endDay] = recordedUntil.split("-");
  const crossesYear = year !== endYear;
  return `${crossesYear ? `${year}.` : ""}${Number(month)}.${Number(day)} – ${crossesYear ? `${endYear}.` : ""}${Number(endMonth)}.${Number(endDay)}`;
};
