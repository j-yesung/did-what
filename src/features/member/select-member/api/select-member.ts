"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { setCurrentMember } from "@/entities/member/server";
import { reassignPushSubscription } from "@/features/push-notification/server";
import { requireUser } from "@/shared/api/supabase/require-user";
import { isUuid } from "@/shared/lib/validation/is-uuid";

type SelectMemberInput = {
  destination?: string;
  endpoint?: string | null;
  memberId: string;
};

export type SelectMemberState = { message: string; status: "error" };

export const selectMember = async (input: SelectMemberInput): Promise<SelectMemberState> => {
  if (!isUuid(input.memberId)) return { message: "구성원을 확인할 수 없습니다.", status: "error" };

  const { supabase, user } = await requireUser();
  const { data: member, error } = await supabase
    .from("account_members")
    .select("id")
    .eq("id", input.memberId)
    .eq("owner_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !member) return { message: "활성 구성원을 확인할 수 없습니다.", status: "error" };

  const subscriptionError = await reassignPushSubscription({
    endpoint: input.endpoint,
    memberId: member.id,
    ownerId: user.id,
    supabase,
  });
  if (subscriptionError) {
    return { message: "기기 정보를 변경하지 못했습니다.\n잠시 후 다시 시도해 주세요.", status: "error" };
  }

  await setCurrentMember(member.id);
  revalidatePath("/", "layout");
  redirect(input.destination === "/settings" ? "/settings" : "/");
};
