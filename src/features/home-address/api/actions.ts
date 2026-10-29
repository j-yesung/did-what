"use server";

import { revalidatePath } from "next/cache";

import { requireMember } from "@/entities/member/server";

import { geocodeHomeAddress } from "./geocode";

export const saveHomeAddress = async (address: string) => {
  const { supabase, user, member } = await requireMember();
  const trimmed = address.trim();
  if (trimmed.length < 5 || trimmed.length > 200) return { error: "주소 찾기에서 주소를 다시 골라 주세요." };
  try {
    await geocodeHomeAddress(trimmed);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "주소를 확인하지 못했어요." };
  }
  const { error } = await supabase
    .from("member_home_addresses")
    .upsert({ owner_id: user.id, member_id: member.id, address: trimmed, updated_at: new Date().toISOString() });
  if (error) return { error: "주소를 저장하지 못했어요. 잠시 후 다시 시도해 주세요." };
  revalidatePath("/settings");
  revalidatePath("/journey");
  return { success: true };
};

export const deleteHomeAddress = async () => {
  const { supabase, user, member } = await requireMember();
  const { error } = await supabase
    .from("member_home_addresses")
    .delete()
    .eq("owner_id", user.id)
    .eq("member_id", member.id);
  if (error) return { error: "주소를 삭제하지 못했어요." };
  revalidatePath("/settings");
  revalidatePath("/journey");
  return { success: true };
};
