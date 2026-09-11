"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/shared/api/supabase/server";

export const logout = async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (data.user) await supabase.auth.signOut();
  redirect("/login");
};
