"use server";

import type { RecordInput, RecordPlaceReference } from "@/entities/record";
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

import type { ResolveRecordPlaceResult } from "../model/location-picker";

type SupabaseClient = Awaited<ReturnType<typeof requireUser>>["supabase"];

const LEGACY_INTEGRATED_REGION_PREFIXES = new Set(["29", "46"]);

/**
 * 고른 지역이 실재하는지 이름으로 다시 조회해 확인한다.
 * 시·군·구가 없는 세종은 읍·면·동 8자리, 나머지는 시·군·구 5자리로 맞춰 본다.
 */
async function verifyRegion(code: string, name: string) {
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
}

async function verifyKakaoPlace(reference: Extract<RecordPlaceReference, { kind: "kakao" }>) {
  const result = await searchKakaoPlaces(reference.query, reference.page, reference.scope);
  const place = result.places?.find((item) => item.id === reference.providerPlaceId);
  if (!place) return null;

  const region = await resolveKakaoRegion(place.longitude, place.latitude);
  return region ? { place, reference, region } : null;
}

async function verifyRecordPlaces(references: RecordPlaceReference[], ownerId: string, supabase: SupabaseClient) {
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
          .select("id, saved_at")
          .eq("owner_id", ownerId)
          .in(
            "id",
            existingReferences.map((reference) => reference.placeId),
          )
      : Promise.resolve({ data: [], error: null }),
    Promise.all(kakaoReferences.map(verifyKakaoPlace)),
  ]);

  if (
    existingResult.error ||
    existingResult.data.length !== existingReferences.length ||
    verifiedKakaoPlaces.some((result) => !result)
  ) {
    return null;
  }

  const kakaoPlaces = verifiedKakaoPlaces.filter((place): place is NonNullable<typeof place> => place !== null);

  return [
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
  ];
}

export async function validateRecordSelections(data: RecordInput, ownerId: string, supabase: SupabaseClient) {
  const region = await verifyRegion(data.regionCode, data.regionName);
  if (!region) return null;

  const places = await verifyRecordPlaces(data.places, ownerId, supabase);
  if (!places) return null;
  return { places, region };
}

export async function resolveRecordPlace(input: {
  page: number;
  providerPlaceId: string;
  query: string;
  scope: KakaoSearchScope | null;
}): Promise<ResolveRecordPlaceResult> {
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

  return {
    place: {
      address: place.address,
      key: `kakao:${place.id}`,
      name: place.name,
      reference: {
        kind: "kakao",
        page: normalizeKakaoPage(input.page),
        providerPlaceId: place.id,
        query: queryResult.query,
        save: false,
        scope,
      },
      saved: false,
    },
    region: { ...region, label: region.name },
  };
}
