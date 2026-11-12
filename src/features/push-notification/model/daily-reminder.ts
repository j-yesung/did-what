import { getToday } from "@/shared/lib/date/get-today";

export const getDailyReminderDate = (now = new Date()) => {
  // 한국 시간 오전 9시대는 UTC 0시대다. 지연 발송도 이 시간 안에서만 허용한다.
  if (now.getUTCHours() !== 0) return null;
  return getToday(now);
};
