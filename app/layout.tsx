import type { ReactNode } from "react";

import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";

import "@/app/styles/globals.css";

import { APPLE_STARTUP_IMAGES } from "./startup-images";

const pretendard = localFont({
  src: "./fonts/PretendardVariable.woff2",
  weight: "45 920",
  display: "swap",
  variable: "--font-pretendard",
});

export const metadata: Metadata = {
  title: "뭐했지",
  description: "함께한 사람과 방문한 지역을 지도 위에 기록하는 관계 기반 라이프로그",
  applicationName: "뭐했지",
  appleWebApp: {
    capable: true,
    startupImage: APPLE_STARTUP_IMAGES,
    statusBarStyle: "default",
    title: "뭐했지",
  },
};

export const viewport: Viewport = {
  themeColor: "#FAFAF8",
  width: "device-width",
  initialScale: 1,
  // 화면 끝까지 그리고, 노치·홈 인디케이터는 각 화면이 env()로 피한다.
  viewportFit: "cover",
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko" className={pretendard.variable}>
      <body>{children}</body>
    </html>
  );
}
