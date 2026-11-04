import { getRecordQueryHref } from "./record-filters";

const RECORD_SEARCH_HISTORY_KEY = "didWhatRecordSearch";

type SearchHistory = Pick<History, "state" | "pushState" | "replaceState" | "back">;

export const applyRecordSearch = (history: SearchHistory, search: string, query: string) => {
  const href = getRecordQueryHref(search, query);
  const state = { [RECORD_SEARCH_HISTORY_KEY]: true };
  if (history.state?.[RECORD_SEARCH_HISTORY_KEY]) history.replaceState(state, "", href);
  else history.pushState(state, "", href);
};

export const clearRecordSearch = (history: SearchHistory, search: string) => {
  if (history.state?.[RECORD_SEARCH_HISTORY_KEY]) history.back();
  else history.replaceState(null, "", getRecordQueryHref(search, ""));
};
