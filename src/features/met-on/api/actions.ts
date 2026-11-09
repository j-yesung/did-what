"use server";

import { revalidatePath } from "next/cache";

import { requireMember } from "@/entities/member/server";
import { getToday } from "@/shared/lib/date/get-today";
import { isIsoDate } from "@/shared/lib/validation/is-iso-date";

export const saveMetOn = async (metOn: string) => {
  if (!isIsoDate(metOn) || metOn > getToday()) return { error: "오늘이나 그 전 날짜를 골라 주세요." };
  const { supabase, user } = await requireMember();
  const { error } = await supabase.from("profiles").upsert({ id: user.id, met_on: metOn }, { onConflict: "id" });
  if (error) return { error: "만난 날을 저장하지 못했어요. 잠시 후 다시 시도해 주세요." };
  revalidatePath("/settings");
  revalidatePath("/");
  return { success: true };
};
