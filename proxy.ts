import type { NextRequest } from "next/server";

import { updateSession } from "@/shared/api/supabase/session";

export async function proxy(request: NextRequest) {
  const startedAt = performance.now();
  const response = await updateSession(request);

  response.headers.append("Server-Timing", `supabase-session;dur=${(performance.now() - startedAt).toFixed(1)}`);

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
