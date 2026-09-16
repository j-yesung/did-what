import { type ReactNode, Suspense } from "react";

import { MainDataPrefetch } from "@/app/providers/main-data-prefetch";
import { AppLoading } from "@/app/ui/app-loading";
import { requireMember } from "@/entities/member/server";
import { AppToolbar } from "@/widgets/app-toolbar";
import { BottomNavigation } from "@/widgets/bottom-navigation";

export const dynamic = "force-dynamic";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<AppLoading />}>
      <AuthenticatedApp>{children}</AuthenticatedApp>
    </Suspense>
  );
}

async function AuthenticatedApp({ children }: { children: ReactNode }) {
  // 화면별 검증이 빠져도 앱 진입점에서 로그인 계정과 현재 구성원을 모두 확인한다.
  const { member } = await requireMember();

  return (
    <>
      <MainDataPrefetch />
      <AppToolbar memberId={member.id} />
      {children}
      <BottomNavigation />
    </>
  );
}
