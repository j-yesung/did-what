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

type PlaceSearchGroup = {
  inputs: CreatePlaceInput[];
  page: number;
  query: string;
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

async function verifyPlaceSearchGroup(group: PlaceSearchGroup): Promise<VerifiedPlace[] | null> {
  const searchResult = await searchKakaoPlaces(group.query, group.page);
  if (!searchResult.places) return null;

  const placesById = new Map(searchResult.places.map((place) => [place.id, place]));
  const verifiedPlaces = await Promise.all(
    group.inputs.map(async (input): Promise<VerifiedPlace | null> => {
      const place = placesById.get(input.placeId);
      if (!place) return null;

      const region = await resolveKakaoRegion(place.longitude, place.latitude);
      return region ? { place, region } : null;
    }),
  );

  return verifiedPlaces.some((place) => place === null)
    ? null
    : verifiedPlaces.filter((place): place is VerifiedPlace => place !== null);
}

async function verifyPlaces(inputs: CreatePlaceInput[]): Promise<VerifiedPlace[] | null> {
  const groups = new Map<string, PlaceSearchGroup>();

  for (const input of inputs) {
    const key = JSON.stringify([input.query, input.page]);
    const group = groups.get(key);
    if (group) {
      group.inputs.push(input);
    } else {
      groups.set(key, { inputs: [input], page: input.page, query: input.query });
    }
  }

  const results = await Promise.all([...groups.values()].map(verifyPlaceSearchGroup));
  const verifiedPlaces: VerifiedPlace[] = [];
  for (const result of results) {
    if (!result) return null;
    verifiedPlaces.push(...result);
  }

  return verifiedPlaces;
}

export async function createPlaces(inputs: CreatePlaceInput[]): Promise<PlaceActionState> {
  const normalizedInputs = Array.isArray(inputs) ? inputs.map(normalizeCreatePlaceInput) : [];
  if (!normalizedInputs.length || normalizedInputs.some((input) => !input)) {
    return { message: "저장할 장소를 다시 선택해 주세요.", status: "error" };
  }

  const validInputs = normalizedInputs.filter((input): input is CreatePlaceInput => input !== null);
  const uniqueInputs = [...new Map(validInputs.map((input) => [input.placeId, input])).values()];
  const { supabase } = await requireUser();
  const verifiedPlaces = await verifyPlaces(uniqueInputs);
  if (!verifiedPlaces) {
    return { message: "선택한 장소를 확인할 수 없습니다. 다시 검색해 주세요.", status: "error" };
  }

  const { data: saved, error } = await supabase.rpc("save_owned_places", {
    p_places: verifiedPlaces.map(({ place, region }) => ({
      address: place.address,
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
