"use server";

import { redirect } from "next/navigation";

import { ensureProfile } from "@/entities/profile";
import { createClient } from "@/shared/api/supabase/server";

import { getLoginErrorMessage } from "../model/auth-error-message";
import type { AuthActionState } from "../model/auth-form";
import { validateLoginInput } from "../model/auth-form";

export const login = async (formData: FormData): Promise<AuthActionState> => {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const fieldErrors = validateLoginInput(email, password);

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors, status: "error" };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { message: getLoginErrorMessage(error?.code), status: "error" };

  const { error: profileError } = await ensureProfile(supabase, data.user);
  if (profileError) {
    await supabase.auth.signOut();
    return { message: "프로필을 준비하지 못했습니다.\n다시 시도해 주세요.", status: "error" };
  }

  redirect("/");
};
