const LONG_DATE = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "long",
  timeZone: "Asia/Seoul",
});

export const formatRecordDate = (recordedAt: string) => {
  return LONG_DATE.format(new Date(`${recordedAt}T00:00:00+09:00`));
};

/** 시작과 끝 중 한쪽만 있어도 읽히는 기간 문구. 날짜 하나를 어떻게 쓸지는 화면이 정한다. 둘 다 없으면 빈 문자열이다. */
export const formatDateRange = ({ from, to }: { from: string; to: string }, formatDay: (date: string) => string) => {
  if (from && to) return from === to ? formatDay(from) : `${formatDay(from)} ~ ${formatDay(to)}`;
  if (from) return `${formatDay(from)}부터`;
  if (to) return `${formatDay(to)}까지`;
  return "";
};

export const formatRecordPeriod = (recordedAt: string, recordedUntil?: string | null) =>
  formatDateRange({ from: recordedAt, to: recordedUntil || recordedAt }, formatRecordDate);
