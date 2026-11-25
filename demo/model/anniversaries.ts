export { getAnniversaryNamesForDate, getFeaturedAnniversary } from "@/entities/anniversary/model/anniversary";

import { isIsoDate } from "@/shared/lib/validation/is-iso-date";

import type { DemoActionResult } from "./actions.ts";
import type { DemoAnniversary, DemoAnniversaryCardStyle, DemoState } from "./types.ts";

export const ANNIVERSARY_CARD_STYLES = [
  { label: "밤에 꺼낸 기록", value: "night" },
  { label: "귤빛 날짜", value: "date" },
  { label: "한 줄 기록", value: "line" },
] as const satisfies readonly { label: string; value: DemoAnniversaryCardStyle }[];

export const ANNIVERSARY_CARD_STYLE_PARAM = "anniversaryCard";

export const getAnniversaryCardStyle = (value: string | null): DemoAnniversaryCardStyle =>
  ANNIVERSARY_CARD_STYLES.find((style) => style.value === value)?.value ?? "night";

export const saveAnniversary = (state: DemoState, draft: DemoAnniversary): DemoActionResult => {
  const name = draft.name.trim();
  if (!name) return { message: "기념일 이름을 입력해 주세요.", ok: false };
  if (!isIsoDate(draft.date) || draft.date < "0001-01-01") {
    return { message: "올바른 날짜를 골라 주세요.", ok: false };
  }

  const anniversary = { ...draft, name };
  const exists = state.anniversaries.some(({ id }) => id === anniversary.id);
  const anniversaries = exists
    ? state.anniversaries.map((item) => (item.id === anniversary.id ? anniversary : item))
    : [...state.anniversaries, anniversary];
  return { ok: true, state: { ...state, anniversaries, changed: true } };
};

export const deleteAnniversary = (state: DemoState, id: string): DemoState => ({
  ...state,
  anniversaries: state.anniversaries.filter((anniversary) => anniversary.id !== id),
  changed: true,
});
