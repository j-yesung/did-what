"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/shared/api/supabase/server";

export async function logout() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (data.user) await supabase.auth.signOut();
  redirect("/login");
}
