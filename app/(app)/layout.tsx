import { type ReactNode, Suspense } from "react";

import { MainDataPrefetch } from "@/app/providers/main-data-prefetch";
import { AppLoading } from "@/app/ui/app-loading";
import { requireMember } from "@/entities/member/server";
import { BottomNavigation } from "@/widgets/bottom-navigation";
import { NotificationBell } from "@/widgets/notification/notification-bell";

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
      <div className="pointer-events-none fixed inset-x-0 top-0 z-30">
        <div className="mx-auto flex w-full max-w-(--app-width) justify-end px-4 pt-[calc(16px+env(safe-area-inset-top))]">
          <div className="pointer-events-auto">
            <NotificationBell memberId={member.id} />
          </div>
        </div>
      </div>
      {children}
      <BottomNavigation />
    </>
  );
}
