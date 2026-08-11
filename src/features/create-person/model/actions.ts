"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/shared/api/supabase/server";

import type { CreatePersonActionState } from "./person-form";
import { validatePersonName } from "./person-form";

export async function createPerson(
  _state: CreatePersonActionState,
  formData: FormData,
): Promise<CreatePersonActionState> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login");
  }

  const result = validatePersonName(String(formData.get("name") ?? ""));

  if (!result.name) {
    return { fieldError: result.error, status: "error" };
  }

  const { error } = await supabase.from("people").insert({ name: result.name, owner_id: userData.user.id });

  if (error) {
    return { message: "사람을 추가하지 못했습니다. 잠시 후 다시 시도해 주세요.", status: "error" };
  }

  revalidatePath("/people");
  revalidatePath("/records/new");

  return { message: `${result.name}님을 추가했습니다.`, status: "success" };
}
