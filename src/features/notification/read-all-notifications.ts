"use server";

import { requireMember } from "@/entities/member/server";

type ReadAllNotificationsState = {
  message?: string;
  status: "error" | "success";
};

export const readAllNotifications = async (): Promise<ReadAllNotificationsState> => {
  const { member, supabase } = await requireMember();
  const { error } = await supabase.rpc("mark_all_notifications_read", {
    p_recipient_member_id: member.id,
  });

  if (error) return { message: "알림을 모두 읽음 처리하지 못했습니다.", status: "error" };

  return { status: "success" };
};
