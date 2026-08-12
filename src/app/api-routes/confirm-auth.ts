import { type NextRequest, NextResponse } from "next/server";

import { ensureProfile } from "@/entities/profile";
import { createClient } from "@/shared/api/supabase/server";

export async function confirmAuth(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = request.nextUrl.searchParams.get("next");
  const destination = next?.startsWith("/") && !next.startsWith("//") ? next : "/";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const { error: profileError } = await ensureProfile(supabase, data.user);

      if (!profileError) {
        return NextResponse.redirect(new URL(destination, request.url));
      }

      await supabase.auth.signOut();
    }
  }

  return NextResponse.redirect(new URL("/login", request.url));
}
