import type { ReactNode } from "react";

import { MainDataPrefetch } from "@/app/providers/main-data-prefetch";
import { RecordCreateButton } from "@/features/record/create-record";
import { requireUser } from "@/shared/api/supabase/require-user";
import { BottomNavigation } from "@/widgets/bottom-navigation";

export const dynamic = "force-dynamic";

export default function Layout({ children }: { children: ReactNode }) {
  return <AuthenticatedApp>{children}</AuthenticatedApp>;
}

async function AuthenticatedApp({ children }: { children: ReactNode }) {
  // 아래 화면들도 각자 부르지만 cache로 묶여 있어 검증은 요청당 한 번이다. 새 화면이 빠뜨려도 여기서 막힌다.
  await requireUser();

  return (
    <>
      <MainDataPrefetch />
      {children}
      <RecordCreateButton />
      <BottomNavigation />
    </>
  );
}
