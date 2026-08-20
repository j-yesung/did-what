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

export function formatRecordDate(recordedAt: string) {
  return LONG_DATE.format(new Date(`${recordedAt}T00:00:00+09:00`));
}

export function formatRecordPeriod(recordedAt: string, recordedUntil?: string | null) {
  if (!recordedUntil || recordedUntil === recordedAt) return formatRecordDate(recordedAt);
  return `${formatRecordDate(recordedAt)} ~ ${formatRecordDate(recordedUntil)}`;
}

export function formatDate(timestamp: string) {
  return LONG_DATE.format(new Date(timestamp));
}

export function formatShortDate(timestamp: string) {
  return SHORT_DATE.format(new Date(timestamp));
}
