import type { KakaoPlace, KakaoRegion } from "@/shared/api/kakao-local";

import type { RecordPlaceReference } from "./record-form";

export type RegionSearchState = {
  status: "idle" | "error" | "success";
  message?: string;
  query?: string;
  related?: boolean;
  regions?: KakaoRegion[];
};

export type PlaceSearchState = {
  status: "idle" | "error" | "success";
  message?: string;
  page?: number;
  places?: KakaoPlace[];
  query?: string;
};

export type RecordLocationRegion = KakaoRegion & { label: string };

export type RecordLocationPlace = {
  address: string | null;
  key: string;
  name: string;
  reference: RecordPlaceReference;
  saved: boolean;
};

export type ResolveRecordPlaceResult = { error: string } | { place: RecordLocationPlace; region: RecordLocationRegion };

export const INITIAL_REGION_SEARCH_STATE: RegionSearchState = { status: "idle" };
export const INITIAL_PLACE_SEARCH_STATE: PlaceSearchState = { status: "idle" };
