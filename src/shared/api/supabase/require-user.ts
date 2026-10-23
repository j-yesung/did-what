import { cache } from "react";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { RETURN_TO_HEADER, withReturnTo } from "@/shared/lib/navigation/return-to";

import { SUPABASE_JWKS } from "./jwks";
import { createClient } from "./server";

/**
 * 로그인 세션이 없으면 로그인 화면으로 보낸다. 화면과 서버 액션의 공통 진입점.
 * 알림으로 들어온 경우처럼 로그인 뒤 원래 화면으로 돌아가도록 요청 주소를 returnTo로 넘긴다.
 *
 * 유효한 ES256 토큰은 로컬 검증하지만, 만료가 가까운 세션은 인증 서버에서 갱신한다.
 * 한 요청 안에서 layout과 page가 각각 부르므로 cache로 감싸 검증과 클라이언트 생성을 한 번만 한다.
 */
export const requireUser = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims(undefined, { jwks: SUPABASE_JWKS });
  const claims = data?.claims;

  if (!claims?.sub) {
    redirect(withReturnTo("/login", (await headers()).get(RETURN_TO_HEADER)));
  }

  return { supabase, user: { id: claims.sub } };
});
