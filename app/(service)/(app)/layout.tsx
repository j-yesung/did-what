import { type ReactNode, Suspense } from "react";

import { headers } from "next/headers";

import { MainDataPrefetch } from "@/app/providers/main-data-prefetch";
import { AppLoadingFallback, AppShown } from "@/app/ui/app-loading-fallback";
import { requireMember } from "@/entities/member/server";
import { RecordSearchProvider } from "@/entities/record/ui/record-search-provider";
import { RETURN_TO_HEADER } from "@/shared/lib/navigation/return-to";
import { PageBackSlot } from "@/shared/ui/layouts/page-back-button";
import { BottomNavigation } from "@/widgets/bottom-navigation";
import { RecordRouteSheet } from "@/widgets/record-detail";
import { Toolbar } from "@/widgets/toolbar";

export const dynamic = "force-dynamic";

export default async function Layout({ children }: { children: ReactNode }) {
  const requestHeaders = await headers();
  // 홈 전용 로딩 처리. 시작 화면에서 홈을 불러오는 동안 로딩 로고를 새로 그리지 않고 이어 보여 준다.
  const isHome = requestHeaders.get(RETURN_TO_HEADER)?.split("?")[0] === "/";

  return (
    <Suspense fallback={<AppLoadingFallback hold={isHome} />}>
      <AuthenticatedApp>{children}</AuthenticatedApp>
    </Suspense>
  );
}

async function AuthenticatedApp({ children }: { children: ReactNode }) {
  // 화면별 검증이 빠져도 앱 진입점에서 로그인 계정과 현재 구성원을 모두 확인한다.
  const { member } = await requireMember();

  return (
    <RecordSearchProvider>
      <MainDataPrefetch />
      <AppShown />
      <Toolbar memberId={member.id} />
      {/* 상세 화면의 고정 뒤로가기 버튼이 옮겨 오는 자리. 툴바 다음, 본문보다 앞에서 읽힌다. */}
      <PageBackSlot />
      {children}
      <BottomNavigation />
      <RecordRouteSheet member={{ id: member.id, name: member.name }} />
    </RecordSearchProvider>
  );
}
