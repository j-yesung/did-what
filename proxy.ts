import { type NextRequest, NextResponse } from "next/server";

import { updateSession } from "@/shared/api/supabase/session";
import { shouldShowAppShell } from "@/shared/lib/navigation/app-shell";
import { RETURN_TO_HEADER } from "@/shared/lib/navigation/return-to";

export async function proxy(request: NextRequest) {
  request.headers.set(RETURN_TO_HEADER, `${request.nextUrl.pathname}${request.nextUrl.search}`);
  if (request.nextUrl.pathname === "/app-start") {
    return NextResponse.next({ request });
  }

  // 체험 데모는 로그인 없이 샘플 데이터로만 동작하므로 세션을 확인하지 않는다.
  if (request.nextUrl.pathname === "/demo" || request.nextUrl.pathname.startsWith("/demo/")) {
    return NextResponse.next({ request });
  }

  if (
    shouldShowAppShell(
      request.method,
      request.nextUrl.pathname,
      request.headers,
      request.cookies.getAll().map(({ name }) => name),
    )
  ) {
    // 첫 문서는 개인 정보 없이 보내고, 이후 RSC 요청에서 세션을 갱신한다.
    const destination = request.nextUrl.clone();
    destination.pathname = "/app-start";
    const response = NextResponse.rewrite(destination, { request });
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }

  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
