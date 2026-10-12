import { type ReactNode, Suspense } from "react";

import { headers } from "next/headers";

import { MainDataPrefetch } from "@/app/providers/main-data-prefetch";
import { AppLoading } from "@/app/ui/app-loading";
import { requireMember } from "@/entities/member/server";
import { RETURN_TO_HEADER } from "@/shared/lib/navigation/return-to";
import { PageBackSlot } from "@/shared/ui/layouts/page-back-button";
import { AppToolbar } from "@/widgets/app-toolbar";
import { BottomNavigation } from "@/widgets/bottom-navigation";

export const dynamic = "force-dynamic";

export default async function Layout({ children }: { children: ReactNode }) {
  const requestHeaders = await headers();
  const content = <AuthenticatedApp>{children}</AuthenticatedApp>;

  // 홈 갱신 중에는 첫 로딩 화면을 유지해 물음표 애니메이션이 다시 시작되지 않게 한다.
  if (requestHeaders.get(RETURN_TO_HEADER)?.split("?")[0] === "/") {
    return content;
  }

  return <Suspense fallback={<AppLoading />}>{content}</Suspense>;
}

async function AuthenticatedApp({ children }: { children: ReactNode }) {
  // 화면별 검증이 빠져도 앱 진입점에서 로그인 계정과 현재 구성원을 모두 확인한다.
  const { member } = await requireMember();

  return (
    <>
      <MainDataPrefetch />
      <AppToolbar memberId={member.id} />
      {/* 상세 화면의 고정 뒤로가기 버튼이 옮겨 오는 자리. 툴바 다음, 본문보다 앞에서 읽힌다. */}
      <PageBackSlot />
      {children}
      <BottomNavigation />
    </>
  );
}
