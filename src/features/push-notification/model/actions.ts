"use server";

import { requireUser } from "@/shared/api/supabase/require-user";

export type PushActionState = {
  message?: string;
  status: "error" | "success";
};

export type PushSubscriptionInput = {
  auth: string;
  endpoint: string;
  label: string;
  p256dh: string;
};

const MAX_ENDPOINT_LENGTH = 1000;
const MAX_KEY_LENGTH = 200;
const MAX_LABEL_LENGTH = 100;

/** 브라우저가 돌려준 값을 그대로 저장하므로 저장 전에 형태를 확인한다. */
function validate({ auth, endpoint, label, p256dh }: PushSubscriptionInput) {
  const trimmedLabel = label.trim();

  if (!endpoint.startsWith("https://") || endpoint.length > MAX_ENDPOINT_LENGTH) return null;
  if (!p256dh || p256dh.length > MAX_KEY_LENGTH) return null;
  if (!auth || auth.length > MAX_KEY_LENGTH) return null;
  if (!trimmedLabel || trimmedLabel.length > MAX_LABEL_LENGTH) return null;

  return { auth, endpoint, label: trimmedLabel, p256dh };
}

export async function saveSubscription(input: PushSubscriptionInput): Promise<PushActionState> {
  const valid = validate(input);
  if (!valid) return { message: "알림 정보를 확인할 수 없습니다.", status: "error" };

  const { supabase, user } = await requireUser();

  /**
   * endpoint는 기기당 하나라 유일 제약이 걸려 있다.
   * 같은 기기에서 다시 켜거나 이름만 바꾸는 경우가 흔해 insert 대신 upsert를 쓴다.
   */
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      auth_key: valid.auth,
      endpoint: valid.endpoint,
      label: valid.label,
      owner_id: user.id,
      p256dh: valid.p256dh,
    },
    { onConflict: "endpoint" },
  );

  if (error) {
    return { message: "알림을 켜지 못했습니다.\n잠시 후 다시 시도해 주세요.", status: "error" };
  }

  /**
   * 기본 닉네임은 계정의 display_name이라 두 기기가 같은 값으로 시작한다.
   * 그대로 두면 알림 제목만 봐서는 누가 남겼는지 알 수 없어, 저장은 하되 겹쳤다는 사실을 알린다.
   */
  const { data: duplicate } = await supabase
    .from("push_subscriptions")
    .select("endpoint")
    .eq("owner_id", user.id)
    .eq("label", valid.label)
    .neq("endpoint", valid.endpoint)
    .limit(1)
    .maybeSingle();

  return duplicate
    ? { message: "다른 기기와 닉네임이 같아요.\n누가 남겼는지 구분되도록 바꿔 주세요.", status: "success" }
    : { status: "success" };
}

export async function removeSubscription(endpoint: string): Promise<PushActionState> {
  const { supabase } = await requireUser();

  const { error } = await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);

  if (error) {
    return { message: "알림을 끄지 못했습니다.\n잠시 후 다시 시도해 주세요.", status: "error" };
  }

  return { status: "success" };
}
