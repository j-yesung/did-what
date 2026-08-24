import { createClient } from "@/shared/api/supabase/client";

/** 이 기기에 저장된 닉네임을 읽는다. 닉네임은 기기마다 다르므로 endpoint로 찾는다. */
export async function fetchSubscriptionLabel(endpoint: string) {
  const { data } = await createClient()
    .from("push_subscriptions")
    .select("label")
    .eq("endpoint", endpoint)
    .maybeSingle();

  return data?.label ?? null;
}
