import { isIsoDate } from "@/shared/lib/validation/is-iso-date";

import type { Anniversary, FeaturedAnniversary } from "./types";

export const validateAnniversary = (input: Pick<Anniversary, "date" | "name">) => {
  if (typeof input?.name !== "string" || !input.name.trim()) return "기념일 이름을 입력해 주세요.";
  if (typeof input.date !== "string" || !isIsoDate(input.date) || input.date < "0001-01-01") {
    return "올바른 날짜를 골라 주세요.";
  }
  return null;
};

const occursOn = (firstDate: string, date: string) => firstDate <= date && firstDate.slice(4) === date.slice(4);

export const getAnniversaryNamesForDate = (anniversaries: readonly Anniversary[], date: string) =>
  anniversaries.filter((anniversary) => occursOn(anniversary.date, date)).map(({ name }) => name);

const getNextDate = (firstDate: string, today: string) => {
  if (firstDate >= today) return firstDate;

  const monthDay = firstDate.slice(4);
  for (let year = Number(today.slice(0, 4)); year <= 9999; year++) {
    const date = `${String(year).padStart(4, "0")}${monthDay}`;
    if (date >= today && isIsoDate(date)) return date;
  }
  return null;
};

export const getFeaturedAnniversary = (
  anniversaries: readonly Anniversary[],
  today: string,
): FeaturedAnniversary | null => {
  let nearest: { date: string; name: string } | null = null;
  for (const anniversary of anniversaries) {
    const date = getNextDate(anniversary.date, today);
    if (date && (!nearest || date < nearest.date)) nearest = { date, name: anniversary.name };
  }
  if (!nearest) return null;

  const dday = (Date.parse(`${nearest.date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000;
  return { ...nearest, dday };
};
