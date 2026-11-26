"use server";

import { requireMember } from "@/entities/member/server";
import type { ActionState } from "@/shared/lib/server-action/action-state";

export const readAllNotifications = async (): Promise<ActionState> => {
  const { member, supabase } = await requireMember();
  const { error } = await supabase.rpc("mark_all_notifications_read", {
    p_recipient_member_id: member.id,
  });

  if (error) return { message: "알림을 모두 읽음 처리하지 못했습니다.", status: "error" };

  return { status: "success" };
};
