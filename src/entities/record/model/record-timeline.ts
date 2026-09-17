type TimelineRecord = {
  recorded_at: string;
};

export const getRecordTimelineItemState = (records: readonly TimelineRecord[], index: number) => {
  const date = records[index]?.recorded_at;
  const previousDate = records[index - 1]?.recorded_at;

  return {
    startsDate: date !== previousDate,
    startsMonth: date?.slice(0, 7) !== previousDate?.slice(0, 7),
  };
};

export const formatRecordTimelineMonth = (recordedAt: string) => {
  const [year, month] = recordedAt.split("-");
  return `${year}년 ${Number(month)}월`;
};
