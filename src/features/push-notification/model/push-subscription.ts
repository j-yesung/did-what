/** 푸시 서비스가 주는 구독 주소. 저장·변경·삭제 전에 모양만 확인한다. */
export const isPushEndpoint = (value: unknown): value is string =>
  typeof value === "string" && value.startsWith("https://") && value.length <= 1000;

export type PushSubscriptionInput = {
  auth: string;
  endpoint: string;
  p256dh: string;
};
