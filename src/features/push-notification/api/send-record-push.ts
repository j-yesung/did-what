import webpush from "web-push";

import type { requireMember } from "@/entities/member/server";

type SupabaseClient = Awaited<ReturnType<typeof requireMember>>["supabase"];

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

/**
 * VAPID 키가 없거나 형태가 잘못되면 setVapidDetails가 예외를 던진다.
 * 알림 설정 실수로 기록 저장까지 막히면 안 되므로 여기서 끊고, 알림만 조용히 꺼진 상태로 둔다.
 */
const configured = (() => {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    // biome-ignore lint/suspicious/noConsole: 운영 환경의 VAPID 설정 누락을 기록한다.
    console.warn("[push] VAPID 키가 없어 알림을 보내지 않습니다.", {
      hasPrivateKey: Boolean(VAPID_PRIVATE_KEY),
      hasPublicKey: Boolean(VAPID_PUBLIC_KEY),
    });
    return false;
  }

  try {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT ?? "mailto:noreply@example.com",
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY,
    );
    return true;
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: 운영 환경의 잘못된 VAPID 설정을 기록한다.
    console.warn("[push] VAPID 설정이 잘못돼 알림을 보내지 않습니다.", error);
    return false;
  }
})();

/** 구독이 만료되거나 기기에서 앱이 지워졌을 때 푸시 서비스가 돌려주는 상태 코드. */
const GONE_STATUS_CODES = new Set([404, 410]);

type SendMemberPushInput = {
  ownerId: string;
  senderMemberId: string;
  supabase: SupabaseClient;
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
  if (!configured) return;

  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth_key, account_members!inner(is_active)")
    .eq("owner_id", ownerId)
    .eq("account_members.is_active", true)
    .neq("member_id", senderMemberId);

  if (!subscriptions?.length) return;

  const payload = JSON.stringify({
    tag,
    title,
    url,
  });

  const results = await Promise.all(
    subscriptions.map(async (target) => {
      try {
        await webpush.sendNotification(
          { endpoint: target.endpoint, keys: { auth: target.auth_key, p256dh: target.p256dh } },
          payload,
        );
        return null;
      } catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode;
        if (statusCode && GONE_STATUS_CODES.has(statusCode)) return target.endpoint;

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
    title: `${senderName}이가 기록을 추가했어요`,
    url: `/records/${recordId}`,
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
    url: `/records/${recordId}#comment-${commentId}`,
  });
};
