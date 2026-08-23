import { cache } from "react";

import { redirect } from "next/navigation";

import { SUPABASE_JWKS } from "./jwks";
import { createClient } from "./server";

/**
 * 로그인 세션이 없으면 로그인 화면으로 보낸다. 화면과 서버 액션의 공통 진입점.
 *
 * getClaims는 토큰 서명을 로컬에서 검증한다. 프로젝트가 비대칭 키(ES256)를 쓰므로 Auth 서버를 다녀오지 않는다.
 * 한 요청 안에서 layout과 page가 각각 부르므로 cache로 감싸 검증과 클라이언트 생성을 한 번만 한다.
 */
export const requireUser = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims(undefined, { jwks: SUPABASE_JWKS });
  const claims = data?.claims;

  if (!claims?.sub) {
    redirect("/login");
  }

  return { supabase, user: { email: claims.email, id: claims.sub } };
});
