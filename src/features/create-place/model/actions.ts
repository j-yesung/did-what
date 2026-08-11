"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { searchKakaoPlaces, validateKakaoPlaceId } from "@/shared/api/kakao-local";
import { createClient } from "@/shared/api/supabase/server";

import type { CreatePlaceActionState } from "./place-form";

export async function createPlace(_state: CreatePlaceActionState, formData: FormData): Promise<CreatePlaceActionState> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login");
  }

  const placeIdResult = validateKakaoPlaceId(String(formData.get("placeId") ?? ""));

  if (!placeIdResult.valid) {
    return { message: placeIdResult.error, status: "error" };
  }

  const searchResult = await searchKakaoPlaces(String(formData.get("query") ?? ""), String(formData.get("page") ?? ""));

  if (!searchResult.places) {
    return { message: searchResult.error, status: "error" };
  }

  const place = searchResult.places.find((item) => item.id === placeIdResult.id);

  if (!place) {
    return { message: "선택한 장소를 확인할 수 없습니다. 다시 검색해 주세요.", status: "error" };
  }

  const { error } = await supabase.from("places").insert({
    address: place.address,
    latitude: place.latitude,
    longitude: place.longitude,
    name: place.name,
    owner_id: userData.user.id,
    provider: "kakao",
    provider_place_id: place.id,
  });

  if (error?.code === "23505") {
    return { message: "이미 저장한 장소예요.", status: "error" };
  }

  if (error) {
    return { message: "장소를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.", status: "error" };
  }

  revalidatePath("/places");
  revalidatePath("/records/new");

  return { status: "success" };
}
