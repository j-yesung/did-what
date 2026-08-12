"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { findPersonIds } from "@/entities/person";
import { findPlace } from "@/entities/place";
import { createClient } from "@/shared/api/supabase/server";
import { isUuid } from "@/shared/lib/is-uuid";

import type { RecordActionState, RecordInputValues } from "./record-form";
import { validateRecordInput } from "./record-form";

function readRecordInput(formData: FormData): RecordInputValues {
  return {
    recordedAt: String(formData.get("recordedAt") ?? ""),
    personIds: formData.getAll("personIds").map(String),
    placeId: String(formData.get("placeId") ?? ""),
    activity: String(formData.get("activity") ?? ""),
    memo: String(formData.get("memo") ?? ""),
  };
}

async function ownsRecordSelections(personIds: string[], placeId: string, ownerId: string) {
  const [placeResult, peopleResult] = await Promise.all([
    findPlace(placeId, ownerId),
    findPersonIds(personIds, ownerId),
  ]);

  return (
    !placeResult.error &&
    !peopleResult.error &&
    Boolean(placeResult.data) &&
    peopleResult.data.length === personIds.length
  );
}

export async function createRecord(_state: RecordActionState, formData: FormData): Promise<RecordActionState> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login");
  }

  const result = validateRecordInput(readRecordInput(formData));

  if (!result.data) {
    return { fieldErrors: result.fieldErrors, status: "error" };
  }

  const { data } = result;
  if (!(await ownsRecordSelections(data.personIds, data.placeId, userData.user.id))) {
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

export async function updateRecord(
  recordId: string,
  _state: RecordActionState,
  formData: FormData,
): Promise<RecordActionState> {
  if (!isUuid(recordId)) {
    return { message: "수정할 기록을 확인할 수 없습니다.", status: "error" };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login");
  }

  const result = validateRecordInput(readRecordInput(formData));

  if (!result.data) {
    return { fieldErrors: result.fieldErrors, status: "error" };
  }

  const { data } = result;
  const [ownsSelections, recordResult] = await Promise.all([
    ownsRecordSelections(data.personIds, data.placeId, userData.user.id),
    supabase.from("records").select("id").eq("id", recordId).eq("owner_id", userData.user.id).maybeSingle(),
  ]);

  if (!ownsSelections || recordResult.error || !recordResult.data) {
    return {
      message: "수정할 기록이나 선택한 사람·장소를 확인할 수 없습니다.",
      status: "error",
    };
  }

  const { data: updated, error } = await supabase.rpc("update_owned_record", {
    p_activity: data.activity,
    p_memo: data.memo ?? null,
    p_person_ids: data.personIds,
    p_place_id: data.placeId,
    p_record_id: recordId,
    p_recorded_at: data.recordedAt,
  });

  if (error || !updated) {
    return { message: "기록을 수정하지 못했습니다. 잠시 후 다시 시도해 주세요.", status: "error" };
  }

  revalidatePath("/");
  revalidatePath("/records");
  revalidatePath(`/records/${recordId}`);
  redirect(`/records/${recordId}`);
}

export async function deleteRecord(
  recordId: string,
  _state: RecordActionState,
  _formData: FormData,
): Promise<RecordActionState> {
  if (!isUuid(recordId)) {
    return { message: "삭제할 기록을 확인할 수 없습니다.", status: "error" };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login");
  }

  const { data: deleted, error } = await supabase
    .from("records")
    .delete()
    .eq("id", recordId)
    .eq("owner_id", userData.user.id)
    .select("id")
    .maybeSingle();

  if (error || !deleted) {
    return { message: "기록을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.", status: "error" };
  }

  revalidatePath("/");
  revalidatePath("/records");
  redirect("/records");
}
