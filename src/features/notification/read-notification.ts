"use server";

import { requireMember } from "@/entities/member/server";

type ReadNotificationState = {
  message?: string;
  status: "error" | "success";
};

export async function readNotification(notificationId: number): Promise<ReadNotificationState> {
  if (!Number.isSafeInteger(notificationId) || notificationId < 1) {
    return { message: "알림을 확인할 수 없습니다.", status: "error" };
  }

  const { member, supabase } = await requireMember();
  const { data: read, error } = await supabase.rpc("mark_notification_read", {
    p_notification_id: notificationId,
    p_recipient_member_id: member.id,
  });

  if (error || !read) return { message: "알림을 읽음 처리하지 못했습니다.", status: "error" };

  return { status: "success" };
}
