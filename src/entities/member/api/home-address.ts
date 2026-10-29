import "server-only";

import { cache } from "react";

import { requireMember } from "./member-session";

export const getMemberHomeAddress = cache(async () => {
  const { supabase, user, member } = await requireMember();
  return supabase
    .from("member_home_addresses")
    .select("address, updated_at")
    .eq("owner_id", user.id)
    .eq("member_id", member.id)
    .maybeSingle();
});
