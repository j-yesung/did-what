"use server";

import { requireMember } from "@/entities/member/server";
import { isUuid } from "@/shared/lib/validation/is-uuid";

type ReadRecordNotificationsState = {
  message?: string;
  status: "error" | "success";
};

/**
 * 알림(푸시·알림 목록)으로 기록을 열면 그 기록에 대해 받은 알림을 모두 읽음으로 바꾼다.
 * 기록과 댓글을 이미 본 셈이라 새 기록 알림과 그 기록의 댓글 알림을 함께 처리한다.
 */
export const readRecordNotifications = async (recordId: string): Promise<ReadRecordNotificationsState> => {
  if (!isUuid(recordId)) return { message: "알림을 확인할 수 없습니다.", status: "error" };

  const { member, supabase } = await requireMember();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_member_id", member.id)
    .eq("record_id", recordId)
    .is("read_at", null);

  if (error) return { message: "알림을 읽음 처리하지 못했습니다.", status: "error" };

  return { status: "success" };
};
