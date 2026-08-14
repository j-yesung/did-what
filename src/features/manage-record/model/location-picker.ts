import type { KakaoRegion } from "@/shared/api/kakao-local";

import type { RecordPlaceReference } from "./record-form";

export type RecordLocationRegion = KakaoRegion & { label: string };

export type RecordLocationPlace = {
  address: string | null;
  key: string;
  name: string;
  reference: RecordPlaceReference;
  saved: boolean;
};

export type ResolveRecordPlaceResult = { error: string } | { place: RecordLocationPlace; region: RecordLocationRegion };
