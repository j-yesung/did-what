"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/shared/api/supabase/require-user";
import { isUuid } from "@/shared/lib/validation/is-uuid";

type PlaceActionState = { message?: string; status: "error" | "success" };

export const deletePlace = async (placeId: string): Promise<PlaceActionState> => {
  if (!isUuid(placeId)) return { message: "삭제할 장소를 확인할 수 없어요.", status: "error" };

  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("remove_saved_place", { p_place_id: placeId });
  if (error || !data) return { message: "장소를 삭제하지 못했습니다.\n잠시 후 다시 시도해 주세요.", status: "error" };

  revalidatePath("/places");
  revalidatePath("/records");
  return { status: "success" };
};
