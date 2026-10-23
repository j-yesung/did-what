"use server";

import { headers } from "next/headers";
import { RedirectType, redirect } from "next/navigation";

import { ensureProfile } from "@/entities/profile";
import { deletePushSubscription } from "@/features/push-notification/server";
import { createClient } from "@/shared/api/supabase/server";
import { toSafeReturnTo } from "@/shared/lib/navigation/return-to";

import { getLoginErrorMessage, getSignupErrorMessage } from "../model/auth-error-message";
import type { AuthActionState } from "../model/auth-form";
import { validateLoginInput, validateSignupInput } from "../model/auth-form";

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

  // 로그인 화면이 뒤로가기에 다시 나오지 않도록 replace로 이동한다.
  redirect(toSafeReturnTo(formData.get("returnTo")), RedirectType.replace);
};

/** 이 기기의 푸시 구독도 함께 지운다. 남겨 두면 로그아웃한 기기로 이전 계정의 알림이 가고, 다른 계정은 이 기기로 알림을 켤 수 없다. */
export const logout = async (endpoint?: string | null) => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    // 구독 삭제는 부가 작업이라 실패해도 로그아웃은 진행한다. 남은 행은 발송 때 만료(404·410)로 정리된다.
    await deletePushSubscription({ endpoint, supabase });
    await supabase.auth.signOut();
  }
  redirect("/login");
};

export const signup = async (formData: FormData): Promise<AuthActionState> => {
  const displayName = String(formData.get("displayName") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("passwordConfirm") ?? "");
  const fieldErrors = validateSignupInput(displayName, email, password, passwordConfirm);

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors, status: "error" };

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
  if (error || !data.user) return { message: getSignupErrorMessage(error?.code), status: "error" };

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
};
