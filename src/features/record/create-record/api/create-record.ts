"use server";

import { revalidatePath } from "next/cache";

import { type RecordFieldErrors, readRecordInput, validateRecordInput } from "@/entities/record";
import { sendRecordPush } from "@/features/push-notification/server";
import { validateRecordSelections } from "@/features/record/select-record-location/server";
import { requireUser } from "@/shared/api/supabase/require-user";

type CreateRecordState = {
  fieldErrors?: RecordFieldErrors;
  message?: string;
  status: "error" | "success";
};

export async function createRecord(formData: FormData): Promise<CreateRecordState> {
  const { supabase, user } = await requireUser();
  const result = validateRecordInput(readRecordInput(formData));
  if (!result.data) return { fieldErrors: result.fieldErrors, status: "error" };

  const selections = await validateRecordSelections(result.data, user.id, supabase);
  if (!selections) {
    return { message: "선택한 지역·장소를 확인할 수 없습니다.", status: "error" };
  }

  const { data: recordId, error } = await supabase.rpc("create_owned_record", {
    p_activity: result.data.activity,
    p_memo: result.data.memo ?? "",
    p_place_ids: selections.placeIds,
    p_recorded_at: result.data.recordedAt,
    p_recorded_until: result.data.recordedUntil ?? null,
    p_region_code: selections.region.code,
    p_region_label: result.data.regionLabel,
    p_region_latitude: selections.region.latitude,
    p_region_longitude: selections.region.longitude,
    p_region_name: selections.region.fullName,
    p_weather: result.data.weather,
  });
  if (error || !recordId) {
    return { message: "기록을 저장하지 못했습니다.\n잠시 후 다시 시도해 주세요.", status: "error" };
  }

  try {
    await sendRecordPush({
      ownerId: user.id,
      recordId,
      senderEndpoint: String(formData.get("senderEndpoint") ?? ""),
      supabase,
    });
  } catch {
    // 알림은 부가 기능이라 저장 결과를 바꾸지 않는다.
  }

  revalidatePath("/");
  revalidatePath("/records");
  revalidatePath("/places");
  return { status: "success" };
}
