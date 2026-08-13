import { redirect } from "next/navigation";

import { getProfileName } from "@/entities/profile";
import { LogoutButton } from "@/features/auth";
import { createClient } from "@/shared/api/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { PageHeader, PageShell } from "@/shared/ui/layouts";

export async function SettingsPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  const displayName = (await getProfileName(data.user.id)) || "기록자";

  return (
    <PageShell>
      <PageHeader title="설정" />

      <Card className="flex-1">
        <CardHeader className="justify-items-center text-center">
          <CardTitle className="text-lg">{displayName}</CardTitle>
          <CardDescription>{data.user.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <LogoutButton />
        </CardContent>
      </Card>
    </PageShell>
  );
}
