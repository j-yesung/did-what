"use server";

import { requireUser } from "@/shared/api/supabase/require-user";

export type PushActionState = {
  message?: string;
  status: "error" | "success";
};

export type PushSubscriptionInput = {
  auth: string;
  endpoint: string;
  p256dh: string;
};

const MAX_ENDPOINT_LENGTH = 1000;
const MAX_KEY_LENGTH = 200;

/** 브라우저가 돌려준 값을 그대로 저장하므로 저장 전에 형태를 확인한다. */
function isValid({ auth, endpoint, p256dh }: PushSubscriptionInput) {
  if (!endpoint.startsWith("https://") || endpoint.length > MAX_ENDPOINT_LENGTH) return false;
  if (!p256dh || p256dh.length > MAX_KEY_LENGTH) return false;
  if (!auth || auth.length > MAX_KEY_LENGTH) return false;

  return true;
}

export async function saveSubscription(input: PushSubscriptionInput): Promise<PushActionState> {
  if (!isValid(input)) return { message: "알림 정보를 확인할 수 없습니다.", status: "error" };

  const { supabase, user } = await requireUser();

  /**
   * endpoint는 기기당 하나라 유일 제약이 걸려 있다.
   * 같은 기기에서 껐다 다시 켜는 경우가 흔해 insert 대신 upsert를 쓴다.
   */
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      auth_key: input.auth,
      endpoint: input.endpoint,
      owner_id: user.id,
      p256dh: input.p256dh,
    },
    { onConflict: "endpoint" },
  );

  if (error) {
    return { message: "알림을 켜지 못했습니다.\n잠시 후 다시 시도해 주세요.", status: "error" };
  }

  return { status: "success" };
}

export async function removeSubscription(endpoint: string): Promise<PushActionState> {
  const { supabase } = await requireUser();

  const { error } = await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);

  if (error) {
    return { message: "알림을 끄지 못했습니다.\n잠시 후 다시 시도해 주세요.", status: "error" };
  }

  return { status: "success" };
}
