import type { SupabaseClient, User } from "@supabase/supabase-js";

import type { Database } from "@/shared/api/supabase/database.types";
import { createClient } from "@/shared/api/supabase/server";

// 표시 이름. 없으면 null이다.
export async function getProfileName(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("display_name").eq("id", userId).maybeSingle();

  return data?.display_name ?? null;
}

// 가입·인증 직후 프로필을 만든다. 세션이 갓 갱신된 클라이언트를 그대로 받아야 해서 인자로 넘긴다.
export async function ensureProfile(supabase: SupabaseClient<Database>, user: User) {
  const metadataName = user.user_metadata.display_name;
  const displayName = typeof metadataName === "string" && metadataName.trim() ? metadataName.trim() : null;

  return supabase.from("profiles").upsert({ display_name: displayName, id: user.id }, { onConflict: "id" });
}
