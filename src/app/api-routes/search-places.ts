import { type NextRequest, NextResponse } from "next/server";

import { normalizeKakaoPage, searchKakaoPlaces, validateKakaoQuery } from "@/shared/api/kakao-local";
import { createClient } from "@/shared/api/supabase/server";

/**
 * 브라우저가 카카오를 직접 부르지 않도록 앞에 세우는 창구.
 * REST 키는 이 함수가 도는 서버에서만 읽히고, 로그인한 사용자에게만 응답한다.
 */
export async function searchPlaces(request: NextRequest) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const queryResult = validateKakaoQuery(params.get("query") ?? "");

  if (!queryResult.valid) {
    return NextResponse.json({ error: queryResult.error }, { status: 400 });
  }

  // 지역 안에서 찾도록 지역 이름을 검색어 앞에 붙인다. 고른 장소를 서버가 다시 확인할 때 같은 검색어가 필요하다.
  const regionName = (params.get("regionName") ?? "").trim();
  const query = regionName ? `${regionName} ${queryResult.query}` : queryResult.query;
  const page = normalizeKakaoPage(params.get("page"));
  const result = await searchKakaoPlaces(query, page);

  if (!result.places) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json({
    isEnd: result.isEnd,
    page: result.page,
    pageableCount: result.pageableCount,
    places: result.places,
    query,
  });
}
