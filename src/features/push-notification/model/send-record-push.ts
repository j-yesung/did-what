import webpush from "web-push";

import type { requireUser } from "@/shared/api/supabase/require-user";

type SupabaseClient = Awaited<ReturnType<typeof requireUser>>["supabase"];

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

/**
 * VAPID 키가 없거나 형태가 잘못되면 setVapidDetails가 예외를 던진다.
 * 알림 설정 실수로 기록 저장까지 막히면 안 되므로 여기서 끊고, 알림만 조용히 꺼진 상태로 둔다.
 */
const configured = (() => {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return false;

  try {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT ?? "mailto:noreply@example.com",
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY,
    );
    return true;
  } catch {
    return false;
  }
})();

/** 구독이 만료되거나 기기에서 앱이 지워졌을 때 푸시 서비스가 돌려주는 상태 코드. */
const GONE_STATUS_CODES = new Set([404, 410]);

type SendRecordPushInput = {
  activity: string;
  ownerId: string;
  recordId: string;
  /** 기록을 작성한 기기의 구독 endpoint. 계정을 공유하므로 기기를 가르는 값은 이것뿐이다. */
  senderEndpoint: string;
  supabase: SupabaseClient;
};

/**
 * 같은 계정에 묶인 다른 기기로 새 기록 알림을 보낸다.
 *
 * 커플이 계정 하나를 함께 쓰는 것을 전제로 한다. 작성자 본인의 기기는 endpoint로 걸러내고,
 * 누가 썼는지는 구독을 만들 때 기기마다 저장해 둔 label에서 가져온다.
 */
export async function sendRecordPush({ activity, ownerId, recordId, senderEndpoint, supabase }: SendRecordPushInput) {
  if (!configured) return;

  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth_key, label")
    .eq("owner_id", ownerId);

  if (!subscriptions?.length) return;

  const targets = subscriptions.filter((subscription) => subscription.endpoint !== senderEndpoint);
  if (!targets.length) return;

  const senderLabel = subscriptions.find((subscription) => subscription.endpoint === senderEndpoint)?.label;

  const payload = JSON.stringify({
    body: activity,
    tag: `record-${recordId}`,
    title: senderLabel ? `${senderLabel}님이 기록을 남겼어요` : "새 기록이 추가됐어요",
    url: `/records/${recordId}`,
  });

  const results = await Promise.all(
    targets.map(async (target) => {
      try {
        await webpush.sendNotification(
          { endpoint: target.endpoint, keys: { auth: target.auth_key, p256dh: target.p256dh } },
          payload,
        );
        return null;
      } catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode;
        return statusCode && GONE_STATUS_CODES.has(statusCode) ? target.endpoint : null;
      }
    }),
  );

  const goneEndpoints = results.filter((endpoint): endpoint is string => endpoint !== null);
  if (goneEndpoints.length) {
    await supabase.from("push_subscriptions").delete().in("endpoint", goneEndpoints);
  }
}
