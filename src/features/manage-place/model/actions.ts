"use server";

import { revalidatePath } from "next/cache";

import {
  normalizeKakaoPage,
  resolveKakaoRegion,
  searchKakaoPlaces,
  validateKakaoPlaceId,
  validateKakaoQuery,
} from "@/shared/api/kakao-local";
import { requireUser } from "@/shared/api/supabase/require-user";
import { isUuid } from "@/shared/lib/validation/is-uuid";

import type { CreatePlaceInput, PlaceActionState } from "./place-form";

type VerifiedPlace = {
  place: NonNullable<Awaited<ReturnType<typeof searchKakaoPlaces>>["places"]>[number];
  region: NonNullable<Awaited<ReturnType<typeof resolveKakaoRegion>>>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeCreatePlaceInput(value: unknown): CreatePlaceInput | null {
  if (!isRecord(value) || typeof value.placeId !== "string" || typeof value.query !== "string") return null;

  const placeIdResult = validateKakaoPlaceId(value.placeId);
  const queryResult = validateKakaoQuery(value.query);
  if (!placeIdResult.valid || !queryResult.valid) return null;

  return {
    page: normalizeKakaoPage(value.page),
    placeId: placeIdResult.id,
    query: queryResult.query,
  };
}

async function verifyPlace(input: CreatePlaceInput): Promise<VerifiedPlace | null> {
  const searchResult = await searchKakaoPlaces(input.query, input.page);
  const place = searchResult.places?.find((item) => item.id === input.placeId);
  if (!place) return null;

  const region = await resolveKakaoRegion(place.longitude, place.latitude);
  return region ? { place, region } : null;
}

export async function createPlaces(inputs: CreatePlaceInput[]): Promise<PlaceActionState> {
  const normalizedInputs = Array.isArray(inputs) ? inputs.map(normalizeCreatePlaceInput) : [];
  if (!normalizedInputs.length || normalizedInputs.some((input) => !input)) {
    return { message: "저장할 장소를 다시 선택해 주세요.", status: "error" };
  }

  const validInputs = normalizedInputs.filter((input): input is CreatePlaceInput => input !== null);
  const uniqueInputs = [...new Map(validInputs.map((input) => [input.placeId, input])).values()];
  const { supabase, user } = await requireUser();
  const verifiedPlaces = await Promise.all(uniqueInputs.map(verifyPlace));
  if (verifiedPlaces.some((verified): verified is null => verified === null)) {
    return { message: "선택한 장소를 확인할 수 없습니다. 다시 검색해 주세요.", status: "error" };
  }

  const savedAt = new Date().toISOString();
  for (const verified of verifiedPlaces) {
    if (!verified) return { message: "선택한 장소를 확인할 수 없습니다. 다시 검색해 주세요.", status: "error" };

    const { data: existing, error: findError } = await supabase
      .from("places")
      .select("id, saved_at")
      .eq("owner_id", user.id)
      .eq("provider", "kakao")
      .eq("provider_place_id", verified.place.id)
      .maybeSingle();
    if (findError) return { message: "장소를 저장하지 못했습니다.\n잠시 후 다시 시도해 주세요.", status: "error" };

    const { error } = existing
      ? await supabase
          .from("places")
          .update({
            region_code: verified.region.code,
            region_name: verified.region.fullName,
            saved_at: existing.saved_at ?? savedAt,
          })
          .eq("id", existing.id)
          .eq("owner_id", user.id)
      : await supabase.from("places").insert({
          address: verified.place.address,
          latitude: verified.place.latitude,
          longitude: verified.place.longitude,
          name: verified.place.name,
          owner_id: user.id,
          provider: "kakao",
          provider_place_id: verified.place.id,
          region_code: verified.region.code,
          region_name: verified.region.fullName,
          saved_at: savedAt,
        });

    if (error) return { message: "장소를 저장하지 못했습니다.\n잠시 후 다시 시도해 주세요.", status: "error" };
  }

  revalidatePath("/places");
  revalidatePath("/records/new");
  return { status: "success" };
}

export async function createPlace(formData: FormData): Promise<PlaceActionState> {
  return createPlaces([
    {
      page: normalizeKakaoPage(formData.get("page")),
      placeId: String(formData.get("placeId") ?? ""),
      query: String(formData.get("query") ?? ""),
    },
  ]);
}

export async function deletePlace(placeId: string): Promise<PlaceActionState> {
  if (!isUuid(placeId)) return { message: "삭제할 장소를 확인할 수 없어요.", status: "error" };

  const { supabase, user } = await requireUser();

  /** record_places는 장소 삭제를 따라 정리되므로 기록은 남고 방문 장소만 빠진다. */
  const { data, error } = await supabase
    .from("places")
    .delete()
    .eq("id", placeId)
    .eq("owner_id", user.id)
    .select("id")
    .maybeSingle();
  if (error || !data) return { message: "장소를 삭제하지 못했습니다.\n잠시 후 다시 시도해 주세요.", status: "error" };

  revalidatePath("/places");
  revalidatePath("/records");
  return { status: "success" };
}

export async function setPlaceSaved(placeId: string, saved: boolean): Promise<PlaceActionState> {
  if (!isUuid(placeId)) return { message: "장소를 확인할 수 없어요.", status: "error" };

  const { supabase, user } = await requireUser();

  const { data, error } = await supabase
    .from("places")
    .update({ saved_at: saved ? new Date().toISOString() : null })
    .eq("id", placeId)
    .eq("owner_id", user.id)
    .select("id")
    .maybeSingle();
  if (error || !data) return { message: "장소 저장 상태를 변경하지 못했어요.", status: "error" };

  revalidatePath("/places");
  revalidatePath(`/places/${placeId}`);
  revalidatePath("/records");
  return { status: "success" };
}
