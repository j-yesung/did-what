import { isIsoDate } from "@/shared/lib/validation/is-iso-date";

import type { Anniversary, AnniversaryDraft, FeaturedAnniversary } from "./types";

const occursOn = (firstDate: string, date: string) => firstDate <= date && firstDate.slice(4) === date.slice(4);

export const getAnniversaryNamesForDate = (anniversaries: readonly Anniversary[], date: string) =>
  anniversaries.filter((anniversary) => occursOn(anniversary.date, date)).map(({ name }) => name);

const getNextDate = (monthDay: string, from: string) => {
  for (let year = Number(from.slice(0, 4)); year <= 9999; year++) {
    const date = `${String(year).padStart(4, "0")}-${monthDay}`;
    if (date >= from && isIsoDate(date)) return date;
  }
  return null;
};

export const prepareAnniversary = (input: AnniversaryDraft, today: string) => {
  if (typeof input?.name !== "string" || !input.name.trim()) return { message: "기념일 이름을 입력해 주세요." };
  if (typeof input.monthDay !== "string" || !isIsoDate(`2000-${input.monthDay}`)) {
    return { message: "올바른 날짜를 골라 주세요." };
  }

  const date = getNextDate(input.monthDay, today);
  if (!date) return { message: "올바른 날짜를 골라 주세요." };
  return { anniversary: { date, id: input.id, name: input.name.trim() } satisfies Anniversary };
};

export const getFeaturedAnniversary = (
  anniversaries: readonly Anniversary[],
  today: string,
): FeaturedAnniversary | null => {
  let nearest: { date: string; name: string } | null = null;
  for (const anniversary of anniversaries) {
    const from = anniversary.date > today ? anniversary.date : today;
    const date = getNextDate(anniversary.date.slice(5), from);
    if (date && (!nearest || date < nearest.date)) nearest = { date, name: anniversary.name };
  }
  if (!nearest) return null;

  const dday = (Date.parse(`${nearest.date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000;
  return { ...nearest, dday };
};
