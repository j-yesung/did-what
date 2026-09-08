import type { ReactNode } from "react";

import { requireUser } from "@/shared/api/supabase/require-user";

export const dynamic = "force-dynamic";

export default async function Layout({ children }: { children: ReactNode }) {
  await requireUser();
  return children;
}
