"use server";

import { requireUser } from "@/shared/api/supabase/require-user";
import type { ActionState } from "@/shared/lib/server-action/action-state";
import { isUuid } from "@/shared/lib/validation/is-uuid";

export const deletePlace = async (placeId: string): Promise<ActionState> => {
  if (!isUuid(placeId)) return { message: "저장을 해제할 장소를 확인할 수 없어요.", status: "error" };

  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("remove_saved_place", { p_place_id: placeId });
  if (error || !data)
    return { message: "장소 저장을 해제하지 못했습니다.\n잠시 후 다시 시도해 주세요.", status: "error" };

  return { status: "success" };
};
