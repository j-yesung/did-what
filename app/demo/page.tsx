import { toSafeAppPath } from "@demo/lib/demo-href";
import { DemoShell } from "@demo/ui/demo-shell";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  description: "가입 없이 샘플 데이터로 뭐했지의 지도, 기록, 댓글, 알림을 직접 써 보는 체험 페이지",
  title: "체험하기 · 뭐했지",
};

// 앱 화면은 확대를 막지만, 체험 페이지는 데스크톱·모바일 브라우저에서 읽는 문서라 확대를 허용한다.
export const viewport: Viewport = { maximumScale: 5, userScalable: true };

type DemoPageProps = { searchParams: Promise<{ path?: string | string[] }> };

export default async function DemoPage({ searchParams }: DemoPageProps) {
  const { path } = await searchParams;
  return <DemoShell initialPath={toSafeAppPath(path)} />;
}
