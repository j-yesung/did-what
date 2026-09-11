const LONG_DATE = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "long",
  timeZone: "Asia/Seoul",
});

const SHORT_DATE = new Intl.DateTimeFormat("ko-KR", {
  day: "numeric",
  month: "short",
  timeZone: "Asia/Seoul",
  year: "numeric",
});

export const formatRecordDate = (recordedAt: string) => {
  return LONG_DATE.format(new Date(`${recordedAt}T00:00:00+09:00`));
};

export const formatRecordPeriod = (recordedAt: string, recordedUntil?: string | null) => {
  if (!recordedUntil || recordedUntil === recordedAt) return formatRecordDate(recordedAt);
  return `${formatRecordDate(recordedAt)} ~ ${formatRecordDate(recordedUntil)}`;
};

export const formatDate = (timestamp: string) => {
  return LONG_DATE.format(new Date(timestamp));
};

export const formatShortDate = (timestamp: string) => {
  return SHORT_DATE.format(new Date(timestamp));
};
