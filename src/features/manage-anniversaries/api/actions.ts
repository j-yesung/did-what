"use server";

import { revalidatePath } from "next/cache";

import { validateAnniversary } from "@/entities/anniversary/model/anniversary";
import type { Anniversary, AnniversaryActionResult } from "@/entities/anniversary/model/types";
import { requireMember } from "@/entities/member/server";
import { isUuid } from "@/shared/lib/validation/is-uuid";

export const createAnniversary = async (input: Anniversary): Promise<AnniversaryActionResult> => {
  const message = validateAnniversary(input);
  if (message) return { message, status: "error" };
  if (!isUuid(input.id)) return { message: "기념일을 다시 등록해 주세요.", status: "error" };
  const { supabase, user } = await requireMember();
  const { error } = await supabase.from("anniversaries").upsert(
    {
      id: input.id,
      name: input.name.trim(),
      date: input.date,
      owner_id: user.id,
    },
    { onConflict: "id", ignoreDuplicates: true },
  );
  if (error) return { message: "기념일을 저장하지 못했어요.", status: "error" };
  revalidatePath("/");
  return { status: "success" };
};

export const deleteAnniversary = async (id: string): Promise<AnniversaryActionResult> => {
  if (!isUuid(id)) return { message: "기념일을 확인할 수 없어요.", status: "error" };
  const { supabase, user } = await requireMember();
  const { error } = await supabase.from("anniversaries").delete().eq("id", id).eq("owner_id", user.id);
  if (error) return { message: "기념일을 삭제하지 못했어요.", status: "error" };
  revalidatePath("/");
  return { status: "success" };
};
