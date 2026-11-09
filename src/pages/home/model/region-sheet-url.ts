import type { RegionCode } from "@/entities/region/model/region";

export const REGION_PARAM = "region";
export const REGION_SHEET_HISTORY_KEY = "didWhatRegionSheet";

export const openRegionSheet = (code: RegionCode) => {
  const url = new URL(window.location.href);
  url.searchParams.set(REGION_PARAM, code);
  window.history.pushState({ [REGION_SHEET_HISTORY_KEY]: code }, "", `${url.pathname}${url.search}`);
};
