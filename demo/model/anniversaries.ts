export { getAnniversaryNamesForDate, getFeaturedAnniversary } from "@/entities/anniversary/model/anniversary";

import { prepareAnniversary } from "@/entities/anniversary/model/anniversary";
import type { AnniversaryDraft } from "@/entities/anniversary/model/types";

import type { DemoActionResult } from "./actions.ts";
import type { DemoAnniversaryCardStyle, DemoState } from "./types.ts";

export const ANNIVERSARY_CARD_STYLES = [
  { label: "밤에 꺼낸 기록", value: "night" },
  { label: "귤빛 날짜", value: "date" },
  { label: "한 줄 기록", value: "line" },
] as const satisfies readonly { label: string; value: DemoAnniversaryCardStyle }[];

export const ANNIVERSARY_CARD_STYLE_PARAM = "anniversaryCard";

export const getAnniversaryCardStyle = (value: string | null): DemoAnniversaryCardStyle =>
  ANNIVERSARY_CARD_STYLES.find((style) => style.value === value)?.value ?? "night";

export const saveAnniversary = (state: DemoState, draft: AnniversaryDraft): DemoActionResult => {
  const { anniversary, message } = prepareAnniversary(draft, state.today);
  if (!anniversary) return { message, ok: false };
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
