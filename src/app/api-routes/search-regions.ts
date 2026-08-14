import { type NextRequest, NextResponse } from "next/server";

import { searchKakaoRegions, validateKakaoQuery } from "@/shared/api/kakao-local";
import { createClient } from "@/shared/api/supabase/server";

/** 장소 검색과 같은 창구 규칙. 카카오 REST 키는 이 서버에서만 읽고, 로그인한 사용자에게만 응답한다. */
export async function searchRegions(request: NextRequest) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const queryResult = validateKakaoQuery(request.nextUrl.searchParams.get("query") ?? "");

  if (!queryResult.valid) {
    return NextResponse.json({ error: queryResult.error }, { status: 400 });
  }

  const result = await searchKakaoRegions(queryResult.query);

  if (!("regions" in result)) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json({ query: queryResult.query, regions: result.regions, related: result.related });
}
