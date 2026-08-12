"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { resolveKakaoRegion, searchKakaoPlaces, validateKakaoPlaceId } from "@/shared/api/kakao-local";
import { createClient } from "@/shared/api/supabase/server";
import { isUuid } from "@/shared/lib/is-uuid";

import type { CreatePlaceActionState } from "./place-form";

export async function createPlace(_state: CreatePlaceActionState, formData: FormData): Promise<CreatePlaceActionState> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) redirect("/login");

  const placeIdResult = validateKakaoPlaceId(String(formData.get("placeId") ?? ""));
  if (!placeIdResult.valid) return { message: placeIdResult.error, status: "error" };

  const searchResult = await searchKakaoPlaces(String(formData.get("query") ?? ""), String(formData.get("page") ?? ""));
  const place = searchResult.places?.find((item) => item.id === placeIdResult.id);
  if (!place) return { message: "선택한 장소를 확인할 수 없습니다. 다시 검색해 주세요.", status: "error" };

  const region = await resolveKakaoRegion(place.longitude, place.latitude);
  if (!region) return { message: "장소의 지역을 확인하지 못했습니다. 다시 시도해 주세요.", status: "error" };

  const { data: existing, error: findError } = await supabase
    .from("places")
    .select("id, saved_at")
    .eq("owner_id", userData.user.id)
    .eq("provider", "kakao")
    .eq("provider_place_id", place.id)
    .maybeSingle();
  if (findError) return { message: "장소를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.", status: "error" };

  const { error } = existing
    ? await supabase
        .from("places")
        .update({ saved_at: existing.saved_at ?? new Date().toISOString() })
        .eq("id", existing.id)
        .eq("owner_id", userData.user.id)
    : await supabase.from("places").insert({
        address: place.address,
        latitude: place.latitude,
        longitude: place.longitude,
        name: place.name,
        owner_id: userData.user.id,
        provider: "kakao",
        provider_place_id: place.id,
        region_code: region.code,
        saved_at: new Date().toISOString(),
      });

  if (error) return { message: "장소를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.", status: "error" };

  revalidatePath("/places");
  revalidatePath("/records/new");
  return { status: "success" };
}

export async function setPlaceSaved(
  placeId: string,
  saved: boolean,
  _state: CreatePlaceActionState,
  _formData: FormData,
): Promise<CreatePlaceActionState> {
  if (!isUuid(placeId)) return { message: "장소를 확인할 수 없어요.", status: "error" };

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { data, error } = await supabase
    .from("places")
    .update({ saved_at: saved ? new Date().toISOString() : null })
    .eq("id", placeId)
    .eq("owner_id", userData.user.id)
    .select("id")
    .maybeSingle();
  if (error || !data) return { message: "장소 저장 상태를 바꾸지 못했어요.", status: "error" };

  revalidatePath("/places");
  revalidatePath(`/places/${placeId}`);
  revalidatePath("/records");
  return { saved, status: "success" };
}
