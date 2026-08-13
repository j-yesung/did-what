"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { ensureProfile } from "@/entities/profile";
import { createClient } from "@/shared/api/supabase/server";

import { getLoginErrorMessage, getSignupErrorMessage } from "./auth-error-message";
import type { AuthActionState } from "./auth-form";
import { validateLoginInput, validateSignupInput } from "./auth-form";

export async function login(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const fieldErrors = validateLoginInput(email, password);

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors, status: "error" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return { message: getLoginErrorMessage(error?.code), status: "error" };
  }

  const { error: profileError } = await ensureProfile(supabase, data.user);

  if (profileError) {
    await supabase.auth.signOut();
    return { message: "프로필을 준비하지 못했습니다.\n다시 시도해 주세요.", status: "error" };
  }

  redirect("/");
}

export async function signup(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const displayName = String(formData.get("displayName") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("passwordConfirm") ?? "");
  const fieldErrors = validateSignupInput(displayName, email, password, passwordConfirm);

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors, status: "error" };
  }

  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
      ...(origin ? { emailRedirectTo: `${origin}/auth/confirm` } : {}),
    },
  });

  if (error || !data.user) {
    return { message: getSignupErrorMessage(error?.code), status: "error" };
  }

  if (!data.session) {
    return {
      message: "인증 메일을 보냈습니다.\n메일의 링크를 누르면 가입이 완료됩니다.",
      status: "success",
    };
  }

  const { error: profileError } = await ensureProfile(supabase, data.user);

  if (profileError) {
    await supabase.auth.signOut();
    return {
      message: "계정은 생성됐지만 프로필을 준비하지 못했습니다.\n다시 로그인해 주세요.",
      status: "error",
    };
  }

  redirect("/");
}

export async function logout() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    await supabase.auth.signOut();
  }

  redirect("/login");
}
