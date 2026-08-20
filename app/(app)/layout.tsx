import { type ReactNode, Suspense } from "react";

import { requireUser } from "@/shared/api/supabase/require-user";
import { PageShell } from "@/shared/ui/layouts";
import { Spinner } from "@/shared/ui/spinner";
import { BottomNavigation } from "@/widgets/bottom-navigation";
import { MainDataPrefetch } from "@/widgets/main-data-prefetch";

export const dynamic = "force-dynamic";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <PageShell className="items-center justify-center" withBottomNavigation>
          <Spinner aria-label="화면을 불러오는 중" className="text-muted-foreground" />
        </PageShell>
      }
    >
      <AuthenticatedApp>{children}</AuthenticatedApp>
    </Suspense>
  );
}

async function AuthenticatedApp({ children }: { children: ReactNode }) {
  // 아래 화면들도 각자 부르지만 cache로 묶여 있어 검증은 요청당 한 번이다. 새 화면이 빠뜨려도 여기서 막힌다.
  await requireUser();

  return (
    <>
      <MainDataPrefetch />
      {children}
      <BottomNavigation />
    </>
  );
}
