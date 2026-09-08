const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

export { getPushEndpoint } from "@/shared/lib/push/get-push-endpoint";

const SERVICE_WORKER_PATH = "/sw.js";

export type PushKeys = {
  auth: string;
  endpoint: string;
  p256dh: string;
};

export type EnablePushResult =
  | { keys: PushKeys; status: "granted" }
  | { status: "denied" }
  | { status: "dismissed" }
  | { status: "unsupported" };

/**
 * VAPID 공개키를 바이트 배열로 바꾼다.
 *
 * 스펙상 applicationServerKey에 base64url 문자열을 그대로 넣을 수 있지만 브라우저마다 지원이 갈린다.
 * 대상이 iOS 홈 화면 설치본이라 확실한 쪽인 BufferSource로 넘긴다.
 */
function toApplicationServerKey(base64Url: string) {
  const padded = base64Url.padEnd(base64Url.length + ((4 - (base64Url.length % 4)) % 4), "=");
  const binary = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));

  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export function isPushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window &&
    Boolean(VAPID_PUBLIC_KEY)
  );
}

/** 이미 구독된 기기의 정보만 읽는다. 서비스 워커를 새로 등록하지 않는다. */
export async function getCurrentPushKeys(): Promise<PushKeys | null> {
  if (!isPushSupported()) return null;

  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return null;

  const { auth, p256dh } = subscription.toJSON().keys ?? {};
  if (!auth || !p256dh) return null;

  return { auth, endpoint: subscription.endpoint, p256dh };
}

/** 권한 요청은 사용자 제스처 안에서만 뜨므로 버튼 클릭에서 곧장 부른다. */
export async function enablePush(): Promise<EnablePushResult> {
  if (!isPushSupported()) return { status: "unsupported" };

  /**
   * 차단(denied)과 창을 그냥 닫은 것(default)은 다르다.
   * 앞은 브라우저 설정에 들어가야 풀리고, 뒤는 다시 누르면 창이 또 뜬다.
   */
  const permission = await Notification.requestPermission();
  if (permission === "denied") return { status: "denied" };
  if (permission !== "granted") return { status: "dismissed" };

  const registration = await navigator.serviceWorker.register(SERVICE_WORKER_PATH);
  await navigator.serviceWorker.ready;

  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      applicationServerKey: toApplicationServerKey(VAPID_PUBLIC_KEY as string),
      userVisibleOnly: true,
    }));

  const { auth, p256dh } = subscription.toJSON().keys ?? {};
  if (!auth || !p256dh) return { status: "unsupported" };

  return { keys: { auth, endpoint: subscription.endpoint, p256dh }, status: "granted" };
}

/** 브라우저 구독을 해지하고 서버에서 지울 endpoint를 돌려준다. */
