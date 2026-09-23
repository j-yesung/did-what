"use server";

import { MAX_VISITED_REGIONS, type RecordInput, type RecordPlaceReference } from "@/entities/record";
import { getRegionCode } from "@/entities/region";
import type { KakaoSearchScope } from "@/shared/api/kakao-local";
import {
  normalizeKakaoPage,
  normalizeKakaoScope,
  resolveKakaoRegion,
  searchKakaoPlaces,
  searchKakaoRegions,
  validateKakaoPlaceId,
  validateKakaoQuery,
} from "@/shared/api/kakao-local/server";
import { requireUser } from "@/shared/api/supabase/require-user";
import { isUuid } from "@/shared/lib/validation/is-uuid";

import type { ResolveRecordPlaceResult } from "../model/location-picker";

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

export const resolveSavedRecordLocation = async (placeId: string): Promise<ResolveRecordPlaceResult | null> => {
  if (!isUuid(placeId)) return null;

  const { supabase, user } = await requireUser();
  const { data: place, error } = await supabase
    .from("places")
    .select("id, name, address, latitude, longitude, region_code, region_name")
    .eq("id", placeId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (error || !place?.region_name) return null;
  const regionName = place.region_name.split(" ").pop() ?? place.region_name;
  const region = {
    code: place.region_code,
    fullName: place.region_name,
    label: regionName,
    latitude: place.latitude,
    longitude: place.longitude,
    name: regionName,
  };

  return {
    place: {
      address: place.address,
      key: `existing:${place.id}`,
      name: place.name,
      reference: { kind: "existing" as const, placeId: place.id, save: false },
      region,
    },
    region,
  };
};

type KakaoSearches = Map<string, ReturnType<typeof searchKakaoPlaces>>;

/**
 * 검색어·페이지·검색 범위가 같은 항목은 같은 검색 결과에서 고른 것이라 한 번만 검색한다.
 * 요청 수가 장소 수가 아니라 검색 그룹 수에 비례한다.
 */
const searchOnce = (reference: Extract<RecordPlaceReference, { kind: "kakao" }>, searches: KakaoSearches) => {
  const key = `${reference.page}|${reference.scope?.latitude ?? ""}|${reference.scope?.longitude ?? ""}|${reference.query}`;
  const cached = searches.get(key);
  if (cached) return cached;

  const search = searchKakaoPlaces(reference.query, reference.page, reference.scope);
  searches.set(key, search);
  return search;
};

const verifyKakaoPlace = async (
  reference: Extract<RecordPlaceReference, { kind: "kakao" }>,
  searches: KakaoSearches,
) => {
  const result = await searchOnce(reference, searches);
  const place = result.places?.find((item) => item.id === reference.providerPlaceId);
  if (!place) return null;

  const region = await resolveKakaoRegion(place.longitude, place.latitude);
  return region ? { place, reference, region } : null;
};

const verifyRecordPlaces = async (references: RecordPlaceReference[], ownerId: string, supabase: SupabaseClient) => {
  const existingReferences = references.filter(
    (reference): reference is Extract<RecordPlaceReference, { kind: "existing" }> => reference.kind === "existing",
  );
  const kakaoReferences = references.filter(
    (reference): reference is Extract<RecordPlaceReference, { kind: "kakao" }> => reference.kind === "kakao",
  );

  const searches: KakaoSearches = new Map();
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
    Promise.all(kakaoReferences.map((reference) => verifyKakaoPlace(reference, searches))),
  ]);

  if (
    existingResult.error ||
    existingResult.data.length !== existingReferences.length ||
    verifiedKakaoPlaces.some((result) => !result)
  ) {
    return null;
  }

  const kakaoPlaces = verifiedKakaoPlaces.filter((place): place is NonNullable<typeof place> => place !== null);
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
              label: place.region_name.split(" ").pop() ?? place.region_name,
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

  // 사용자가 고른 지역이 먼저다. 첫 지역이 기록의 대표 지역이 되고, 같은 지역은 한 번만 저장한다.
  const regions = new Map<string, RecordRegionValue>();
  verifiedRegions.forEach((region, index) => {
    if (!region || regions.has(region.code)) return;
    regions.set(region.code, {
      code: region.code,
      label: data.regions[index].label,
      latitude: region.latitude,
      longitude: region.longitude,
      name: region.fullName,
      selected_directly: true,
    });
  });
  for (const region of verifiedPlaces.regions) {
    if (!regions.has(region.code)) regions.set(region.code, { ...region, selected_directly: false });
  }

  if (regions.size < 1 || regions.size > MAX_VISITED_REGIONS) return null;
  return { places: verifiedPlaces.places, regions: [...regions.values()] };
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
  const result = await searchKakaoPlaces(queryResult.query, input.page, scope);
  const place = result.places?.find((item) => item.id === idResult.id);
  if (!place) return { error: "선택한 장소를 다시 검색해 주세요." };

  const region = await resolveKakaoRegion(place.longitude, place.latitude);
  if (!region) return { error: "장소의 지역을 확인하지 못했어요." };

  const placeRegion = { ...region, label: region.name };

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
      region: placeRegion,
    },
    region: placeRegion,
  };
};
