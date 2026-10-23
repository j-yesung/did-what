import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/shared/api/supabase/database.types";

import { isPushEndpoint } from "../model/push-subscription";

/** 이 기기의 구독을 지운다. 로그아웃처럼 세션이 끝나기 전에 불러야 RLS를 통과한다. */
export const deletePushSubscription = async ({
  endpoint,
  supabase,
}: {
  endpoint: string | null | undefined;
  supabase: SupabaseClient<Database>;
}) => {
  if (!isPushEndpoint(endpoint)) return null;

  const { error } = await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
  return error;
};
