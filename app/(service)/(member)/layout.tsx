import type { ReactNode } from "react";

import { AppShown } from "@/app/ui/app-loading-fallback";
import { requireUser } from "@/shared/api/supabase/require-user";

export const dynamic = "force-dynamic";

export default async function Layout({ children }: { children: ReactNode }) {
  await requireUser();
  return (
    <>
      <AppShown />
      {children}
    </>
  );
}
