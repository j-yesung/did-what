import { getRecordQueryHref } from "./record-filters";

const RECORD_SEARCH_HISTORY_KEY = "didWhatRecordSearch";

type SearchHistory = Pick<History, "state" | "pushState" | "replaceState" | "back">;

export const applyRecordSearch = (history: SearchHistory, search: string, query: string) => {
  const params = new URLSearchParams(search);
  if (!query && (params.has("q") || params.has("search"))) params.set("search", "1");
  const href = getRecordQueryHref(params.toString(), query);
  const state = { [RECORD_SEARCH_HISTORY_KEY]: true };
  if (history.state?.[RECORD_SEARCH_HISTORY_KEY]) history.replaceState(state, "", href);
  else if (params.has("q") || params.has("search")) history.replaceState(null, "", href);
  else history.pushState(state, "", href);
};

export const clearRecordSearch = (history: SearchHistory, search: string) => {
  if (history.state?.[RECORD_SEARCH_HISTORY_KEY]) history.back();
  else {
    const params = new URLSearchParams(search);
    params.delete("search");
    history.replaceState(null, "", getRecordQueryHref(params.toString(), ""));
  }
};

export const beginRecordSearch = (history: SearchHistory, search: string) => {
  if (history.state?.[RECORD_SEARCH_HISTORY_KEY]) return;
  const params = new URLSearchParams(search);
  params.set("search", "1");
  history.pushState({ [RECORD_SEARCH_HISTORY_KEY]: true }, "", `/records?${params}`);
};
