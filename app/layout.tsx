import type { ReactNode } from "react";

import type { Metadata, Viewport } from "next";

import "@/app/styles/globals.css";

export const metadata: Metadata = {
  title: "뭐했지",
  description: "함께한 사람과 방문한 지역을 지도 위에 기록하는 관계 기반 라이프로그",
};

export const viewport: Viewport = {
  themeColor: "#FAFAF8",
  width: "device-width",
  initialScale: 1,
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
