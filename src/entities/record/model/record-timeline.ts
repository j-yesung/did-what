export const groupRecordsByDate = <T extends { recorded_at: string }>(records: readonly T[]) => {
  const groups = new Map<string, T[]>();
  for (const record of records) {
    const group = groups.get(record.recorded_at);
    if (group) group.push(record);
    else groups.set(record.recorded_at, [record]);
  }
  return [...groups].map(([date, records]) => ({ date, records }));
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
