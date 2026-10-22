"use server";

import {
  MAX_VISITED_REGIONS,
  mergeVisitedRegions,
  type RecordInput,
  type RecordPlaceReference,
} from "@/entities/record";
import { getRegionCode } from "@/entities/region/model/region";
import type { KakaoSearchScope } from "@/shared/api/kakao-local";
import {
  normalizeKakaoPage,
  normalizeKakaoScope,
  searchKakaoRegions,
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
  toShortRegionName,
} from "../model/location-picker";

type SupabaseClient = Awaited<ReturnType<typeof requireUser>>["supabase"];

type ExistingPlaceRow = {
  id: string;
  latitude: number;
  longitude: number;
  region_code: string;
  region_name: string | null;
  saved_at: string | null;
};

type RecordRegionValue = {
  code: string;
  label: string;
  latitude: number;
  longitude: number;
  name: string;
  selected_directly: boolean;
};

const LEGACY_INTEGRATED_REGION_PREFIXES = new Set(["29", "46"]);

/**
 * 고른 지역이 실재하는지 이름으로 다시 조회해 확인한다.
 * 시·군·구가 없는 세종은 읍·면·동 8자리, 나머지는 시·군·구 5자리로 맞춰 본다.
 */
const verifyRegion = async (code: string, name: string) => {
  const result = await searchKakaoRegions(name);
  if (!("regions" in result)) return null;

  if (code === "3611000000") {
    const region = result.regions[0];
    return region ? { ...region, code, fullName: name, name } : null;
  }

  const codeLength = code.startsWith("36") ? 8 : 5;
  const requestedRegionCode = getRegionCode(code);
  const requestedDistrictName = name.trim().split(/\s+/).at(-1);
  const isLegacyIntegratedRegion = LEGACY_INTEGRATED_REGION_PREFIXES.has(code.slice(0, 2));
  return (
    result.regions.find((region) => {
      if (region.code.slice(0, codeLength) === code.slice(0, codeLength)) return true;

      return (
        isLegacyIntegratedRegion &&
        requestedRegionCode === "KR-12" &&
        region.name === requestedDistrictName &&
        getRegionCode(region.code) === "KR-12"
      );
    }) ?? null
  );
};

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

const verifyRecordPlaces = async (references: RecordPlaceReference[], ownerId: string, supabase: SupabaseClient) => {
  const existingReferences = references.filter(
    (reference): reference is Extract<RecordPlaceReference, { kind: "existing" }> => reference.kind === "existing",
  );
  const kakaoReferences = references.filter(
    (reference): reference is Extract<RecordPlaceReference, { kind: "kakao" }> => reference.kind === "kakao",
  );

  const [existingResult, verifiedKakaoPlaces] = await Promise.all([
    existingReferences.length
      ? supabase
          .from("places")
          .select("id, saved_at, latitude, longitude, region_code, region_name")
          .eq("owner_id", ownerId)
          .in(
            "id",
            existingReferences.map((reference) => reference.placeId),
          )
      : Promise.resolve({ data: [] as ExistingPlaceRow[], error: null }),
    verifyKakaoPlaces(
      kakaoReferences.map((reference) => ({
        page: reference.page,
        placeId: reference.providerPlaceId,
        query: reference.query,
        scope: reference.scope,
      })),
    ),
  ]);

  if (
    existingResult.error ||
    existingResult.data.length !== existingReferences.length ||
    verifiedKakaoPlaces.some((result) => result.error)
  ) {
    return null;
  }

  const kakaoPlaces = verifiedKakaoPlaces
    .map((result, index) => ({ ...result, reference: kakaoReferences[index] }))
    .filter((result) => !result.error);
  const existingPlaces = new Map(existingResult.data.map((place) => [place.id, place]));
  const kakaoPlacesByReference = new Map(kakaoPlaces.map((verified) => [verified.reference, verified]));

  return {
    places: [
      ...existingReferences.map((reference) => ({
        kind: "existing" as const,
        place_id: reference.placeId,
        save: reference.save,
      })),
      ...kakaoPlaces.map((verified) => ({
        address: verified.place.address,
        category_group_code: verified.place.categoryGroupCode,
        category_name: verified.place.categoryName,
        kind: "kakao" as const,
        latitude: verified.place.latitude,
        longitude: verified.place.longitude,
        name: verified.place.name,
        provider_place_id: verified.place.id,
        region_code: verified.region.code,
        region_name: verified.region.fullName,
        save: verified.reference.save,
      })),
    ],
    /**
     * 장소에서 따라오는 지역. 화면에 담은 장소 순서를 따라야 첫 지역, 곧 대표 지역이 화면과 같아진다.
     * 저장한 장소는 좌표를 그대로 지역 좌표로 쓴다. 지역 중심점을 다시 조회해 봐야 지도 셀은 같은 곳을 가리키고,
     * 외부 호출만 늘어난다.
     */
    regions: references.flatMap((reference) => {
      if (reference.kind === "kakao") {
        const verified = kakaoPlacesByReference.get(reference);
        return verified
          ? [
              {
                code: verified.region.code,
                label: verified.region.name,
                latitude: verified.region.latitude,
                longitude: verified.region.longitude,
                name: verified.region.fullName,
              },
            ]
          : [];
      }

      const place = existingPlaces.get(reference.placeId);
      return place?.region_name
        ? [
            {
              code: place.region_code,
              label: toShortRegionName(place.region_name),
              latitude: place.latitude,
              longitude: place.longitude,
              name: place.region_name,
            },
          ]
        : [];
    }),
  };
};

export const validateRecordSelections = async (data: RecordInput, ownerId: string, supabase: SupabaseClient) => {
  const [verifiedRegions, verifiedPlaces] = await Promise.all([
    Promise.all(data.regions.map((region) => verifyRegion(region.code, region.name))),
    verifyRecordPlaces(data.places, ownerId, supabase),
  ]);
  if (!verifiedPlaces || verifiedRegions.some((region) => !region)) return null;

  // 표시명이 다른 직접 선택은 보존하고, 장소의 지역은 코드별로 한 번만 보충한다.
  const directRegions: RecordRegionValue[] = verifiedRegions.flatMap((region, index) =>
    region
      ? [
          {
            code: region.code,
            label: data.regions[index].label,
            latitude: region.latitude,
            longitude: region.longitude,
            name: region.fullName,
            selected_directly: true,
          },
        ]
      : [],
  );
  const regions = mergeVisitedRegions(
    directRegions,
    verifiedPlaces.regions.map((region) => ({
      ...region,
      selected_directly: false,
    })),
  );

  if (regions.length < 1 || regions.length > MAX_VISITED_REGIONS) return null;
  return { places: verifiedPlaces.places, regions };
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
