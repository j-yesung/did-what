import type { ReactNode } from "react";

import { redirect } from "next/navigation";

import { SUPABASE_JWKS } from "@/shared/api/supabase/jwks";
import { createClient } from "@/shared/api/supabase/server";

export const dynamic = "force-dynamic";

export default async function Layout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims(undefined, { jwks: SUPABASE_JWKS });

  if (!error && data?.claims.sub) {
    redirect("/");
  }

  return children;
}
