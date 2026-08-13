"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { resolveKakaoRegion, searchKakaoPlaces, validateKakaoPlaceId } from "@/shared/api/kakao-local";
import { requireUser } from "@/shared/api/supabase/require-user";
import { isUuid } from "@/shared/lib/is-uuid";

import type { PlaceActionState } from "./place-form";

export async function createPlace(_state: PlaceActionState, formData: FormData): Promise<PlaceActionState> {
  const { supabase, user } = await requireUser();

  const placeIdResult = validateKakaoPlaceId(String(formData.get("placeId") ?? ""));
  if (!placeIdResult.valid) return { message: placeIdResult.error, status: "error" };

  const searchResult = await searchKakaoPlaces(String(formData.get("query") ?? ""), String(formData.get("page") ?? ""));
  const place = searchResult.places?.find((item) => item.id === placeIdResult.id);
  if (!place) return { message: "선택한 장소를 확인할 수 없습니다.\n다시 검색해 주세요.", status: "error" };

  const region = await resolveKakaoRegion(place.longitude, place.latitude);
  if (!region) return { message: "장소의 지역을 확인하지 못했습니다.\n다시 시도해 주세요.", status: "error" };

  const { data: existing, error: findError } = await supabase
    .from("places")
    .select("id, saved_at")
    .eq("owner_id", user.id)
    .eq("provider", "kakao")
    .eq("provider_place_id", place.id)
    .maybeSingle();
  if (findError) return { message: "장소를 저장하지 못했습니다.\n잠시 후 다시 시도해 주세요.", status: "error" };

  const { error } = existing
    ? await supabase
        .from("places")
        .update({ saved_at: existing.saved_at ?? new Date().toISOString() })
        .eq("id", existing.id)
        .eq("owner_id", user.id)
    : await supabase.from("places").insert({
        address: place.address,
        latitude: place.latitude,
        longitude: place.longitude,
        name: place.name,
        owner_id: user.id,
        provider: "kakao",
        provider_place_id: place.id,
        region_code: region.code,
        saved_at: new Date().toISOString(),
      });

  if (error) return { message: "장소를 저장하지 못했습니다.\n잠시 후 다시 시도해 주세요.", status: "error" };

  revalidatePath("/places");
  revalidatePath("/records/new");
  return { status: "success" };
}

export async function deletePlace(
  placeId: string,
  _state: PlaceActionState,
  _formData: FormData,
): Promise<PlaceActionState> {
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
  redirect("/places");
}

export async function setPlaceSaved(
  placeId: string,
  saved: boolean,
  _state: PlaceActionState,
  _formData: FormData,
): Promise<PlaceActionState> {
  if (!isUuid(placeId)) return { message: "장소를 확인할 수 없어요.", status: "error" };

  const { supabase, user } = await requireUser();

  const { data, error } = await supabase
    .from("places")
    .update({ saved_at: saved ? new Date().toISOString() : null })
    .eq("id", placeId)
    .eq("owner_id", user.id)
    .select("id")
    .maybeSingle();
  if (error || !data) return { message: "장소 저장 상태를 바꾸지 못했어요.", status: "error" };

  revalidatePath("/places");
  revalidatePath(`/places/${placeId}`);
  revalidatePath("/records");
  return { saved, status: "success" };
}
