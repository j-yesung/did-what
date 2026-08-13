import { redirect } from "next/navigation";

import { createClient } from "./server";

// 로그인 세션이 없으면 로그인 화면으로 보낸다. 화면과 서버 액션의 공통 진입점
export async function requireUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  return { supabase, user: data.user };
}
