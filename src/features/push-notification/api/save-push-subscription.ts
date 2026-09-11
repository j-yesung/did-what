"use server";

import { requireMember } from "@/entities/member/server";

import type { PushActionState, PushSubscriptionInput } from "../model/push-subscription";

const MAX_ENDPOINT_LENGTH = 1000;
const MAX_KEY_LENGTH = 200;

const isValid = ({ auth, endpoint, p256dh }: PushSubscriptionInput) => {
  if (!endpoint.startsWith("https://") || endpoint.length > MAX_ENDPOINT_LENGTH) return false;
  if (!p256dh || p256dh.length > MAX_KEY_LENGTH) return false;
  if (!auth || auth.length > MAX_KEY_LENGTH) return false;

  return true;
};

export const saveSubscription = async (input: PushSubscriptionInput): Promise<PushActionState> => {
  if (!isValid(input)) return { message: "알림 정보를 확인할 수 없습니다.", status: "error" };

  const { member, supabase, user } = await requireMember();
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      auth_key: input.auth,
      endpoint: input.endpoint,
      member_id: member.id,
      owner_id: user.id,
      p256dh: input.p256dh,
    },
    { onConflict: "endpoint" },
  );

  if (error) return { message: "알림을 켜지 못했습니다.\n잠시 후 다시 시도해 주세요.", status: "error" };
  return { status: "success" };
};
