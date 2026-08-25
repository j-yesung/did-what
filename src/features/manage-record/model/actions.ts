"use server";

import { revalidatePath } from "next/cache";

import { sendRecordPush } from "@/features/push-notification/model/send-record-push";
import {
  type KakaoSearchScope,
  normalizeKakaoPage,
  normalizeKakaoScope,
  resolveKakaoRegion,
  searchKakaoPlaces,
  searchKakaoRegions,
  validateKakaoPlaceId,
  validateKakaoQuery,
} from "@/shared/api/kakao-local";
import { requireUser } from "@/shared/api/supabase/require-user";
import { isUuid } from "@/shared/lib/validation/is-uuid";

import type { ResolveRecordPlaceResult } from "./location-picker";
import type { RecordActionState, RecordInput, RecordInputValues, RecordPlaceReference } from "./record-form";
import { validateRecordInput } from "./record-form";

type SupabaseClient = Awaited<ReturnType<typeof requireUser>>["supabase"];

function readRecordInput(formData: FormData): RecordInputValues {
  return {
    recordedAt: String(formData.get("recordedAt") ?? ""),
    recordedUntil: String(formData.get("recordedUntil") ?? ""),
    regionCode: String(formData.get("regionCode") ?? ""),
    regionLabel: String(formData.get("regionLabel") ?? ""),
    regionName: String(formData.get("regionName") ?? ""),
    places: String(formData.get("places") ?? "[]"),
    weather: String(formData.get("weather") ?? ""),
    activity: String(formData.get("activity") ?? ""),
    memo: String(formData.get("memo") ?? ""),
  };
}

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
  return result.regions.find((region) => region.code.slice(0, codeLength) === code.slice(0, codeLength)) ?? null;
}

async function verifyKakaoPlace(reference: Extract<RecordPlaceReference, { kind: "kakao" }>) {
  const result = await searchKakaoPlaces(reference.query, reference.page, reference.scope);
  const place = result.places?.find((item) => item.id === reference.providerPlaceId);
  if (!place) return null;

  const region = await resolveKakaoRegion(place.longitude, place.latitude);
  return region ? { place, reference, region } : null;
}

async function prepareRecordPlaces(references: RecordPlaceReference[], ownerId: string, supabase: SupabaseClient) {
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

  const placeIds = new Set(existingResult.data.map((place) => place.id));
  const saveExistingIds = existingReferences
    .filter((reference) => reference.save)
    .map((reference) => reference.placeId);
  if (saveExistingIds.length) {
    const { error } = await supabase
      .from("places")
      .update({ saved_at: new Date().toISOString() })
      .eq("owner_id", ownerId)
      .in("id", saveExistingIds);
    if (error) return null;
  }

  for (const verified of verifiedKakaoPlaces) {
    if (!verified) return null;

    const { data: existing, error: findError } = await supabase
      .from("places")
      .select("id, saved_at")
      .eq("owner_id", ownerId)
      .eq("provider", "kakao")
      .eq("provider_place_id", verified.place.id)
      .maybeSingle();
    if (findError) return null;

    if (existing) {
      placeIds.add(existing.id);
      if (verified.reference.save && !existing.saved_at) {
        const { error } = await supabase
          .from("places")
          .update({ saved_at: new Date().toISOString() })
          .eq("id", existing.id)
          .eq("owner_id", ownerId);
        if (error) return null;
      }
      continue;
    }

    const { data: inserted, error } = await supabase
      .from("places")
      .insert({
        address: verified.place.address,
        latitude: verified.place.latitude,
        longitude: verified.place.longitude,
        name: verified.place.name,
        owner_id: ownerId,
        provider: "kakao",
        provider_place_id: verified.place.id,
        region_code: verified.region.code,
        saved_at: verified.reference.save ? new Date().toISOString() : null,
      })
      .select("id")
      .single();
    if (error || !inserted) return null;
    placeIds.add(inserted.id);
  }

  return [...placeIds];
}

async function validateSelections(data: RecordInput, ownerId: string, supabase: SupabaseClient) {
  const region = await verifyRegion(data.regionCode, data.regionName);
  if (!region) return null;

  const placeIds = await prepareRecordPlaces(data.places, ownerId, supabase);
  if (!placeIds) return null;
  return { placeIds, region };
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

export async function createRecord(formData: FormData): Promise<RecordActionState> {
  const { supabase, user } = await requireUser();
  const result = validateRecordInput(readRecordInput(formData));
  if (!result.data) return { fieldErrors: result.fieldErrors, status: "error" };

  const selections = await validateSelections(result.data, user.id, supabase);
  if (!selections) {
    return { message: "선택한 지역·장소를 확인할 수 없습니다.", status: "error" };
  }

  const { data: recordId, error } = await supabase.rpc("create_owned_record", {
    p_activity: result.data.activity,
    p_memo: result.data.memo ?? "",
    p_place_ids: selections.placeIds,
    p_recorded_at: result.data.recordedAt,
    p_recorded_until: result.data.recordedUntil ?? null,
    p_region_code: selections.region.code,
    p_region_label: result.data.regionLabel,
    p_region_latitude: selections.region.latitude,
    p_region_longitude: selections.region.longitude,
    p_region_name: selections.region.fullName,
    p_weather: result.data.weather,
  });
  if (error || !recordId) {
    return { message: "기록을 저장하지 못했습니다.\n잠시 후 다시 시도해 주세요.", status: "error" };
  }

  /**
   * 계정을 함께 쓰는 다른 기기에 알린다. 발송이 실패해도 기록은 이미 저장됐으므로 성공으로 끝낸다.
   * 배럴이 아니라 모듈에서 직접 가져오는 이유는 그쪽 주석에 있다.
   */
  try {
    await sendRecordPush({
      ownerId: user.id,
      recordId,
      senderEndpoint: String(formData.get("senderEndpoint") ?? ""),
      supabase,
    });
  } catch {
    // 알림은 부가 기능이라 저장 결과를 바꾸지 않는다.
  }

  revalidatePath("/");
  revalidatePath("/records");
  revalidatePath("/places");
  return { status: "success" };
}

export async function updateRecord(recordId: string, formData: FormData): Promise<RecordActionState> {
  if (!isUuid(recordId)) return { message: "수정할 기록을 확인할 수 없습니다.", status: "error" };

  const { supabase, user } = await requireUser();
  const result = validateRecordInput(readRecordInput(formData));
  if (!result.data) return { fieldErrors: result.fieldErrors, status: "error" };

  const [selections, recordResult] = await Promise.all([
    validateSelections(result.data, user.id, supabase),
    supabase.from("records").select("id").eq("id", recordId).eq("owner_id", user.id).maybeSingle(),
  ]);
  if (!selections || recordResult.error || !recordResult.data) {
    return { message: "수정할 기록이나 선택 항목을 확인할 수 없습니다.", status: "error" };
  }

  const { data: updated, error } = await supabase.rpc("update_owned_record", {
    p_activity: result.data.activity,
    p_memo: result.data.memo ?? "",
    p_place_ids: selections.placeIds,
    p_record_id: recordId,
    p_recorded_at: result.data.recordedAt,
    p_recorded_until: result.data.recordedUntil ?? null,
    p_region_code: selections.region.code,
    p_region_label: result.data.regionLabel,
    p_region_latitude: selections.region.latitude,
    p_region_longitude: selections.region.longitude,
    p_region_name: selections.region.fullName,
    p_weather: result.data.weather,
  });
  if (error || !updated) {
    return { message: "기록을 수정하지 못했습니다.\n잠시 후 다시 시도해 주세요.", status: "error" };
  }

  revalidatePath("/");
  revalidatePath("/records");
  revalidatePath("/places");
  revalidatePath(`/records/${recordId}`);
  return { status: "success" };
}

export async function deleteRecord(recordId: string): Promise<RecordActionState> {
  if (!isUuid(recordId)) return { message: "삭제할 기록을 확인할 수 없습니다.", status: "error" };

  const { supabase, user } = await requireUser();
  const { data: deleted, error } = await supabase
    .from("records")
    .delete()
    .eq("id", recordId)
    .eq("owner_id", user.id)
    .select("id")
    .maybeSingle();

  if (error || !deleted) {
    return { message: "기록을 삭제하지 못했습니다.\n잠시 후 다시 시도해 주세요.", status: "error" };
  }

  revalidatePath("/");
  revalidatePath("/records");
  return { status: "success" };
}
