import type { SupabaseClient } from "@supabase/supabase-js";

import { getRecordNotificationHref } from "@/entities/notification/model/notification-page";
import type { Database } from "@/shared/api/supabase/database.types";

import { isExpiredPushError, isPushConfigured, sendPush } from "./send-push";

type SendMemberPushInput = {
  ownerId: string;
  senderMemberId: string;
  supabase: SupabaseClient<Database>;
  tag: string;
  title: string;
  url: string;
};

/**
 * 같은 계정에 묶인 다른 구성원의 기기로 알림을 보낸다.
 *
 * 작성 구성원의 모든 기기와 비활성 구성원의 기기는 발송 대상에서 제외한다.
 */
const sendMemberPush = async ({ ownerId, senderMemberId, supabase, tag, title, url }: SendMemberPushInput) => {
  if (!isPushConfigured) return;

  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth_key, account_members!inner(is_active)")
    .eq("owner_id", ownerId)
    .eq("account_members.is_active", true)
    .neq("member_id", senderMemberId);

  if (!subscriptions?.length) return;

  const payload = { tag, title, url };

  const results = await Promise.all(
    subscriptions.map(async (target) => {
      try {
        await sendPush(target, payload);
        return null;
      } catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode;
        if (isExpiredPushError(error)) return target.endpoint;

        // 만료 말고 다른 이유로 실패하면 흔적이 없어 원인을 찾을 수 없다. 키 불일치(403)가 대표적이다.
        // biome-ignore lint/suspicious/noConsole: 만료 이외의 푸시 발송 실패를 운영 로그로 남긴다.
        console.warn("[push] 발송 실패", { statusCode });
        return null;
      }
    }),
  );

  const goneEndpoints = results.filter((endpoint): endpoint is string => endpoint !== null);
  if (goneEndpoints.length) {
    await supabase.from("push_subscriptions").delete().in("endpoint", goneEndpoints);
  }
};

type SendRecordPushInput = Omit<SendMemberPushInput, "tag" | "title" | "url"> & {
  recordId: string;
  senderName: string;
};

/** 기록 내용은 잠금 화면에 노출하지 않는다. */
export const sendRecordPush = async ({ recordId, senderName, ...input }: SendRecordPushInput) => {
  return sendMemberPush({
    ...input,
    tag: `record-${recordId}`,
    title: `${senderName}님이 새 기록을 남겼어요`,
    url: getRecordNotificationHref(recordId),
  });
};

type SendCommentPushInput = Omit<SendMemberPushInput, "tag" | "title" | "url"> & {
  commentId: string;
  recordId: string;
  senderName: string;
};

/** 댓글 내용은 잠금 화면에 노출하지 않는다. */
export const sendCommentPush = async ({ commentId, recordId, senderName, ...input }: SendCommentPushInput) => {
  return sendMemberPush({
    ...input,
    tag: `comment-${commentId}`,
    title: `${senderName}님이 댓글을 남겼어요`,
    url: getRecordNotificationHref(recordId, commentId),
  });
};
