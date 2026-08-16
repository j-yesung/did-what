import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  experimental: {
    /**
     * 동적 라우트 페이로드를 클라이언트 라우터 캐시에 얼마나 둘지. 기본값 0이라 하단 탭이 미리 받아 둔 페이지를
     * 곧바로 버리고 매번 서버를 다시 다녀왔다.
     * 화면 데이터는 본인 뮤테이션으로만 바뀌고 서버 액션의 revalidatePath가 이 캐시까지 무효화하므로 길게 잡아도 낡지 않는다.
     * 다른 기기에서 고친 내용만 최대 이 시간만큼 늦게 보인다.
     */
    staleTimes: { dynamic: 300 },
  },
};

export default nextConfig;
