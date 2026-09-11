"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/shared/api/supabase/require-user";
import { isUuid } from "@/shared/lib/validation/is-uuid";

type DeleteRecordState = { message?: string; status: "error" | "success" };

export const deleteRecord = async (recordId: string): Promise<DeleteRecordState> => {
  if (!isUuid(recordId)) return { message: "삭제할 기록을 확인할 수 없습니다.", status: "error" };

  const { supabase } = await requireUser();
  const { data: deleted, error } = await supabase.rpc("delete_owned_record", { p_record_id: recordId });

  if (error || !deleted) {
    return { message: "기록을 삭제하지 못했습니다.\n잠시 후 다시 시도해 주세요.", status: "error" };
  }

  revalidatePath("/");
  revalidatePath("/records");
  return { status: "success" };
};
