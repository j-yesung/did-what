"use server";

import { revalidatePath } from "next/cache";

import {
  normalizeKakaoPage,
  validateKakaoPlaceId,
  validateKakaoQuery,
  verifyKakaoPlaces,
} from "@/shared/api/kakao-local/server";
import { requireUser } from "@/shared/api/supabase/require-user";
import { isUuid } from "@/shared/lib/validation/is-uuid";

import type { CreatePlaceInput, PlaceActionState } from "../model/place-form";

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const normalizeCreatePlaceInput = (value: unknown): CreatePlaceInput | null => {
  if (!isRecord(value) || typeof value.placeId !== "string" || typeof value.query !== "string") return null;

  const placeIdResult = validateKakaoPlaceId(value.placeId);
  const queryResult = validateKakaoQuery(value.query);
  if (!placeIdResult.valid || !queryResult.valid) return null;

  return {
    page: normalizeKakaoPage(value.page),
    placeId: placeIdResult.id,
    query: queryResult.query,
  };
};

export const createPlaces = async (inputs: CreatePlaceInput[]): Promise<PlaceActionState> => {
  const normalizedInputs = Array.isArray(inputs) ? inputs.map(normalizeCreatePlaceInput) : [];
  if (!normalizedInputs.length || normalizedInputs.some((input) => !input)) {
    return { message: "저장할 장소를 다시 선택해 주세요.", status: "error" };
  }

  const validInputs = normalizedInputs.filter((input): input is CreatePlaceInput => input !== null);
  const uniqueInputs = [...new Map(validInputs.map((input) => [input.placeId, input])).values()];
  const { supabase } = await requireUser();
  const groups = new Map<string, CreatePlaceInput[]>();
  for (const input of uniqueInputs) {
    const key = JSON.stringify([input.query, input.page]);
    const group = groups.get(key);
    if (group) group.push(input);
    else groups.set(key, [input]);
  }
  const verifiedPlaces = await verifyKakaoPlaces([...groups.values()].flat());
  if (verifiedPlaces.some((result) => result.error)) {
    return { message: "선택한 장소를 확인할 수 없습니다. 다시 검색해 주세요.", status: "error" };
  }

  const places = verifiedPlaces.filter((result) => !result.error);
  const { data: saved, error } = await supabase.rpc("save_owned_places", {
    p_places: places.map(({ place, region }) => ({
      address: place.address,
      category_group_code: place.categoryGroupCode,
      category_name: place.categoryName,
      latitude: place.latitude,
      longitude: place.longitude,
      name: place.name,
      provider_place_id: place.id,
      region_code: region.code,
      region_name: region.fullName,
    })),
  });
  if (error || !saved) {
    return { message: "장소를 저장하지 못했습니다.\n잠시 후 다시 시도해 주세요.", status: "error" };
  }

  revalidatePath("/places");
  revalidatePath("/records/new");
  return { status: "success" };
};

export const setPlaceSaved = async (placeId: string, saved: boolean): Promise<PlaceActionState> => {
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
};
