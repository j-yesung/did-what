import webpush from "web-push";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

/**
 * VAPID 키가 없거나 형태가 잘못되면 setVapidDetails가 예외를 던진다.
 * 알림 설정 실수로 기록 저장까지 막히면 안 되므로 여기서 끊고, 알림만 조용히 꺼진 상태로 둔다.
 */
export const isPushConfigured = (() => {
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

export const isExpiredPushError = (error: unknown) => {
  return GONE_STATUS_CODES.has((error as { statusCode?: number }).statusCode ?? 0);
};

type PushTarget = { endpoint: string; auth_key: string; p256dh: string };
type PushPayload = { title: string; body?: string; url: string; tag: string };

export const sendPush = (target: PushTarget, payload: PushPayload, options?: webpush.RequestOptions) => {
  return webpush.sendNotification(
    { endpoint: target.endpoint, keys: { auth: target.auth_key, p256dh: target.p256dh } },
    JSON.stringify(payload),
    options,
  );
};
