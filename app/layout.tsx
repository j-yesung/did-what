import type { ReactNode } from "react";

import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";

import { getTheme } from "@/features/switch-theme/server";
import { QueryProvider } from "@/shared/lib/react-query/query-provider";
import { cn } from "@/shared/lib/utils";
import { NoticeProvider } from "@/shared/ui/notice-provider";
import { PressListener } from "@/shared/ui/press-listener";
import { PreventForwardSwipe } from "@/shared/ui/prevent-forward-swipe";

import "@/app/styles/globals.css";
import "@/app/styles/liquid-glass.css";

const pretendard = localFont({
  src: "./fonts/PretendardVariable.woff2",
  weight: "45 920",
  display: "swap",
  variable: "--font-pretendard",
});

const THEME_COLOR = { dark: "#191f28", light: "#f9fafb" };

const IOS_SPLASH_SCREENS = [
  { height: 568, scale: 2, width: 320 },
  { height: 667, scale: 2, width: 375 },
  { height: 736, scale: 3, width: 414 },
  { height: 812, scale: 3, width: 375 },
  { height: 896, scale: 2, width: 414 },
  { height: 896, scale: 3, width: 414 },
  { height: 780, scale: 3, width: 360 },
  { height: 844, scale: 3, width: 390 },
  { height: 926, scale: 3, width: 428 },
  { height: 852, scale: 3, width: 393 },
  { height: 932, scale: 3, width: 430 },
  { height: 874, scale: 3, width: 402 },
  { height: 912, scale: 3, width: 420 },
  { height: 956, scale: 3, width: 440 },
] as const;

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
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
  };
}

export default async function Layout({ children }: { children: ReactNode }) {
  const theme = await getTheme();
  const splashColorSchemes: readonly (keyof typeof THEME_COLOR)[] = theme === "system" ? ["light", "dark"] : [theme];

  return (
    <html className={cn(pretendard.variable, theme !== "system" && theme)} lang="ko">
      <head>
        {IOS_SPLASH_SCREENS.flatMap(({ height, scale, width }) =>
          splashColorSchemes.map((colorScheme) => (
            <link
              href={`/splash/${width * scale}x${height * scale}-${colorScheme}.png`}
              key={`${width}x${height}@${scale}-${colorScheme}`}
              media={
                theme === "system"
                  ? `(device-width: ${width}px) and (device-height: ${height}px) and (-webkit-device-pixel-ratio: ${scale}) and (orientation: portrait) and (prefers-color-scheme: ${colorScheme})`
                  : `(device-width: ${width}px) and (device-height: ${height}px) and (-webkit-device-pixel-ratio: ${scale}) and (orientation: portrait)`
              }
              rel="apple-touch-startup-image"
            />
          )),
        )}
      </head>
      <body>
        <QueryProvider>{children}</QueryProvider>
        <PressListener />
        <PreventForwardSwipe />
        <NoticeProvider />
      </body>
    </html>
  );
}
