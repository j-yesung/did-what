import type { ReactNode } from "react";

import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";

import { getTheme } from "@/features/switch-theme";
import { QueryProvider } from "@/shared/lib/react-query";
import { cn } from "@/shared/lib/utils";
import { NoticeProvider } from "@/shared/ui/notice-provider";
import { PressListener } from "@/shared/ui/press-listener";

import "@/app/styles/globals.css";

const pretendard = localFont({
  src: "./fonts/PretendardVariable.woff2",
  weight: "45 920",
  display: "swap",
  variable: "--font-pretendard",
});

const THEME_COLOR = { dark: "#191f28", light: "#f9fafb" };

export const metadata: Metadata = {
  title: "뭐했지",
  description: "둘만의 순간과 방문한 지역을 지도 위에 기록하는 커플 라이프로그",
  applicationName: "뭐했지",
  other: { "apple-mobile-web-app-capable": "yes" },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "뭐했지",
  },
};

export async function generateViewport(): Promise<Viewport> {
  const theme = await getTheme();

  return {
    themeColor:
      theme === "system"
        ? [
            { color: THEME_COLOR.light, media: "(prefers-color-scheme: light)" },
            { color: THEME_COLOR.dark, media: "(prefers-color-scheme: dark)" },
          ]
        : THEME_COLOR[theme],
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
  };
}

export default async function Layout({ children }: { children: ReactNode }) {
  const theme = await getTheme();

  return (
    <html className={cn(pretendard.variable, theme !== "system" && theme)} lang="ko">
      <body>
        <QueryProvider>{children}</QueryProvider>
        <PressListener />
        <NoticeProvider />
      </body>
    </html>
  );
}
