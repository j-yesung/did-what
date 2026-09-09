import { createClient } from "@/shared/api/supabase/client";

export async function fetchMembers() {
  const { data, error } = await createClient()
    .from("account_members")
    .select("id, name, is_active, created_at, updated_at, owner_id")
    .order("created_at");

  if (error) throw error;
  return data;
}
