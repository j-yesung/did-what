import type { ReactNode } from "react";

import { redirect } from "next/navigation";

import { createClient } from "@/shared/api/supabase/server";
import { BottomNavigation } from "@/widgets/bottom-navigation";

export const dynamic = "force-dynamic";

export default async function Layout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims.sub) {
    redirect("/login");
  }

  return (
    <>
      {children}
      <BottomNavigation />
    </>
  );
}
