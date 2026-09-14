import "server-only";

import { cache } from "react";

import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import type { Database } from "@/shared/api/supabase/database.types";
import { requireUser } from "@/shared/api/supabase/require-user";

import type { AccountMember } from "../model/types";

const CURRENT_MEMBER_COOKIE = "did-what-member";
const ONE_YEAR = 60 * 60 * 24 * 365;

export const getAccountMembers = async (supabase: SupabaseClient<Database>, ownerId: string) => {
  const { data, error } = await supabase
    .from("account_members")
    .select("id, name, is_active, created_at, updated_at, owner_id")
    .eq("owner_id", ownerId)
    .order("created_at");

  if (error) throw error;
  return data satisfies AccountMember[];
};

export const setCurrentMember = async (memberId: string) => {
  const store = await cookies();
  store.set(CURRENT_MEMBER_COOKIE, memberId, {
    httpOnly: true,
    maxAge: ONE_YEAR,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
};

export const getCurrentMemberId = async () => {
  return (await cookies()).get(CURRENT_MEMBER_COOKIE)?.value;
};

export const requireMember = cache(async () => {
  const { supabase, user } = await requireUser();
  const members = await getAccountMembers(supabase, user.id);

  if (!members.length) redirect("/members/setup");

  const memberId = await getCurrentMemberId();
  const member = members.find((candidate) => candidate.id === memberId && candidate.is_active);

  if (!member) redirect("/members/select");

  return { member, members, supabase, user };
});
