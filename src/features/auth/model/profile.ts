import type { SupabaseClient, User } from "@supabase/supabase-js";

import type { Database } from "@/shared/api/supabase/database.types";

export async function ensureProfile(supabase: SupabaseClient<Database>, user: User) {
  const metadataName = user.user_metadata.display_name;
  const displayName = typeof metadataName === "string" && metadataName.trim() ? metadataName.trim() : null;

  return supabase.from("profiles").upsert({ display_name: displayName, id: user.id }, { onConflict: "id" });
}
