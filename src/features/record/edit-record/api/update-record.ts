"use server";

import { revalidatePath } from "next/cache";

import { type RecordFieldErrors, readRecordInput, validateRecordInput } from "@/entities/record";
import { validateRecordSelections } from "@/features/record/select-record-location/server";
import { requireUser } from "@/shared/api/supabase/require-user";
import { isUuid } from "@/shared/lib/validation/is-uuid";

type UpdateRecordState = {
  fieldErrors?: RecordFieldErrors;
  message?: string;
  status: "error" | "success";
};

export const updateRecord = async (recordId: string, formData: FormData): Promise<UpdateRecordState> => {
  if (!isUuid(recordId)) return { message: "수정할 기록을 확인할 수 없습니다.", status: "error" };

  const { supabase, user } = await requireUser();
  const result = validateRecordInput(readRecordInput(formData));
  if (!result.data) return { fieldErrors: result.fieldErrors, status: "error" };

  const selections = await validateRecordSelections(result.data, user.id, supabase);
  if (!selections) {
    return { message: "수정할 기록이나 선택 항목을 확인할 수 없습니다.", status: "error" };
  }

  const { data: updated, error } = await supabase.rpc("update_owned_record_with_places", {
    p_activity: result.data.activity,
    p_category: result.data.category,
    p_memo: result.data.memo ?? "",
    p_places: selections.places,
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
};
