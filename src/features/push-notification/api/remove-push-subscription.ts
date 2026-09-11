"use server";

import { requireUser } from "@/shared/api/supabase/require-user";

import type { PushActionState } from "../model/push-subscription";

export const removeSubscription = async (endpoint: string): Promise<PushActionState> => {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);

  if (error) return { message: "알림을 끄지 못했습니다.\n잠시 후 다시 시도해 주세요.", status: "error" };
  return { status: "success" };
};
