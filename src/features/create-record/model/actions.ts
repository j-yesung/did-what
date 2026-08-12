"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { findPersonIds } from "@/entities/person";
import { findPlace } from "@/entities/place";
import { createClient } from "@/shared/api/supabase/server";

import type { CreateRecordActionState, RecordInputValues } from "./record-form";
import { validateRecordInput } from "./record-form";

export async function createRecord(
  _state: CreateRecordActionState,
  formData: FormData,
): Promise<CreateRecordActionState> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login");
  }

  const values: RecordInputValues = {
    recordedAt: String(formData.get("recordedAt") ?? ""),
    personIds: formData.getAll("personIds").map(String),
    placeId: String(formData.get("placeId") ?? ""),
    activity: String(formData.get("activity") ?? ""),
    memo: String(formData.get("memo") ?? ""),
  };
  const result = validateRecordInput(values);

  if (!result.data) {
    return { fieldErrors: result.fieldErrors, status: "error" };
  }

  const { data } = result;
  const [placeResult, peopleResult] = await Promise.all([
    findPlace(data.placeId, userData.user.id),
    findPersonIds(data.personIds, userData.user.id),
  ]);

  if (
    placeResult.error ||
    peopleResult.error ||
    !placeResult.data ||
    peopleResult.data.length !== data.personIds.length
  ) {
    return {
      message: "선택한 사람 또는 장소를 확인할 수 없습니다. 다시 선택해 주세요.",
      status: "error",
    };
  }

  const { data: record, error: recordError } = await supabase
    .from("records")
    .insert({
      activity: data.activity,
      memo: data.memo ?? null,
      owner_id: userData.user.id,
      place_id: data.placeId,
      recorded_at: data.recordedAt,
    })
    .select("id")
    .single();

  if (recordError || !record) {
    return { message: "기록을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.", status: "error" };
  }

  const { error: peopleError } = await supabase
    .from("record_people")
    .insert(data.personIds.map((personId) => ({ person_id: personId, record_id: record.id })));

  if (peopleError) {
    const { error: cleanupError } = await supabase
      .from("records")
      .delete()
      .eq("id", record.id)
      .eq("owner_id", userData.user.id);

    return {
      message: cleanupError
        ? "기록 연결을 완료하지 못했습니다. 기록 목록을 확인한 뒤 다시 시도해 주세요."
        : "함께한 사람을 연결하지 못했습니다. 다시 시도해 주세요.",
      status: "error",
    };
  }

  revalidatePath("/");
  revalidatePath("/records");
  redirect("/records");
}
