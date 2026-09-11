import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/shared/api/supabase/database.types";

type ReassignPushSubscriptionInput = {
  endpoint: string | null | undefined;
  memberId: string;
  ownerId: string;
  supabase: SupabaseClient<Database>;
};

export const reassignPushSubscription = async ({
  endpoint,
  memberId,
  ownerId,
  supabase,
}: ReassignPushSubscriptionInput) => {
  if (!endpoint) return null;
  if (!endpoint.startsWith("https://") || endpoint.length > 1000) return new Error("Invalid push endpoint");

  const { error } = await supabase
    .from("push_subscriptions")
    .update({ member_id: memberId })
    .eq("owner_id", ownerId)
    .eq("endpoint", endpoint);

  return error;
};
