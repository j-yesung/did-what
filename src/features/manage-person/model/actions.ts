"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/shared/api/supabase/require-user";
import { isUuid } from "@/shared/lib/validation/is-uuid";

import type { PersonActionState } from "./person-form";
import { validatePersonName } from "./person-form";

// 사람 이름은 기록 목록·상세·작성 폼에 모두 노출된다.
function revalidatePerson(personId?: string) {
  revalidatePath("/people");
  revalidatePath("/records");
  revalidatePath("/records/new");

  if (personId) {
    revalidatePath(`/people/${personId}`);
  }
}

export async function createPerson(formData: FormData): Promise<PersonActionState> {
  const { supabase, user } = await requireUser();
  const result = validatePersonName(String(formData.get("name") ?? ""));

  if (!result.name) {
    return { fieldError: result.error, status: "error" };
  }

  const { error } = await supabase.from("people").insert({ name: result.name, owner_id: user.id });

  if (error) {
    return { message: "사람을 추가하지 못했습니다.\n잠시 후 다시 시도해 주세요.", status: "error" };
  }

  revalidatePerson();

  return { message: `${result.name}님을 추가했습니다.`, status: "success" };
}

export async function renamePerson(personId: string, formData: FormData): Promise<PersonActionState> {
  if (!isUuid(personId)) {
    return { message: "수정할 사람을 확인할 수 없습니다.", status: "error" };
  }

  const { supabase, user } = await requireUser();
  const result = validatePersonName(String(formData.get("name") ?? ""));

  if (!result.name) {
    return { fieldError: result.error, status: "error" };
  }

  const { data, error } = await supabase
    .from("people")
    .update({ name: result.name })
    .eq("id", personId)
    .eq("owner_id", user.id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { message: "이름을 바꾸지 못했습니다.\n잠시 후 다시 시도해 주세요.", status: "error" };
  }

  revalidatePerson(personId);

  return { message: `${result.name}님으로 바꿨습니다.`, status: "success" };
}

export async function deletePerson(personId: string): Promise<PersonActionState> {
  if (!isUuid(personId)) {
    return { message: "삭제할 사람을 확인할 수 없습니다.", status: "error" };
  }

  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("people")
    .delete()
    .eq("id", personId)
    .eq("owner_id", user.id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { message: "사람을 삭제하지 못했습니다.\n잠시 후 다시 시도해 주세요.", status: "error" };
  }

  revalidatePerson(personId);
  redirect("/people");
}
