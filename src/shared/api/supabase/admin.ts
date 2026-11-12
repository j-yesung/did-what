import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

export const createAdminClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) throw new Error("Supabase 서버 환경 변수가 설정되지 않았습니다.");

  return createClient<Database>(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
};
