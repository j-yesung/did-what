import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  experimental: {
    /**
     * 하단 탭이 미리 받은 전체 RSC 화면 구조를 300초 동안 재사용한다. 메인 데이터는 TanStack Query가
     * 별도로 관리하므로 이 캐시는 인증된 레이아웃과 화면 구조의 반복 요청만 줄인다.
     */
    staleTimes: { dynamic: 300 },
  },
};

export default nextConfig;
