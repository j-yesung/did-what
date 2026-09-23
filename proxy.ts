import type { NextRequest } from "next/server";

import { updateSession } from "@/shared/api/supabase/session";
import { RETURN_TO_HEADER } from "@/shared/lib/navigation/return-to";

export async function proxy(request: NextRequest) {
  request.headers.set(RETURN_TO_HEADER, `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
