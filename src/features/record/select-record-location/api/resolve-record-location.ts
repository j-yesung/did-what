"use server";

import type { KakaoSearchScope } from "@/shared/api/kakao-local";
import {
  normalizeKakaoPage,
  normalizeKakaoScope,
  validateKakaoPlaceId,
  validateKakaoQuery,
  verifyKakaoPlaces,
} from "@/shared/api/kakao-local/server";
import { requireUser } from "@/shared/api/supabase/require-user";
import { isUuid } from "@/shared/lib/validation/is-uuid";

import {
  type RecordLocationPlace,
  type ResolveRecordPlaceResult,
  toExistingRecordLocationPlace,
} from "../model/location-picker";

export const resolveSavedRecordLocation = async (placeId: string): Promise<RecordLocationPlace | null> => {
  if (!isUuid(placeId)) return null;

  const { supabase, user } = await requireUser();
  const { data: place, error } = await supabase
    .from("places")
    .select("id, name, address, latitude, longitude, region_code, region_name")
    .eq("id", placeId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (error || !place?.region_name) return null;
  return toExistingRecordLocationPlace(place);
};

export const resolveRecordPlace = async (input: {
  page: number;
  providerPlaceId: string;
  query: string;
  scope: KakaoSearchScope | null;
}): Promise<ResolveRecordPlaceResult> => {
  await requireUser();
  const idResult = validateKakaoPlaceId(input.providerPlaceId);
  const queryResult = validateKakaoQuery(input.query);
  if (!idResult.valid || !queryResult.valid) return { error: "선택한 장소를 확인할 수 없어요." };

  const scope = normalizeKakaoScope(input.scope?.latitude, input.scope?.longitude);
  const [result] = await verifyKakaoPlaces([
    {
      page: input.page,
      placeId: idResult.id,
      query: queryResult.query,
      scope,
    },
  ]);
  if (result.error === "place") return { error: "선택한 장소를 다시 검색해 주세요." };
  if (result.error === "region") return { error: "장소의 지역을 확인하지 못했어요." };
  const { place, region } = result;

  return {
    place: {
      address: place.address,
      key: `kakao:${place.id}`,
      name: place.name,
      reference: {
        kind: "kakao" as const,
        page: normalizeKakaoPage(input.page),
        providerPlaceId: place.id,
        query: queryResult.query,
        save: false,
        scope,
      },
      region: { ...region, label: region.name },
    },
  };
};
