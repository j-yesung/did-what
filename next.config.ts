import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  reactCompiler: true,
  experimental: {
    /**
     * 하단 탭이 미리 받은 화면 구조를 하루 동안 재사용한다. 탭 화면의 데이터는 TanStack Query가
     * 따로 최신화하므로, 이 캐시는 화면 구조만 붙잡아 탭 이동을 서버 응답 없이 바로 끝낸다.
     */
    staleTimes: { static: 86_400 },
  },
};

export default nextConfig;
