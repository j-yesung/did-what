import "server-only";

import { requireMember } from "@/entities/member/server";

export const getMetOn = async () => {
  const { supabase, user } = await requireMember();
  const { data, error } = await supabase.from("profiles").select("met_on").eq("id", user.id).maybeSingle();
  if (error) throw error;
  return data?.met_on ?? null;
};
