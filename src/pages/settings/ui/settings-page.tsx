import { UserRoundIcon } from "lucide-react";
import { redirect } from "next/navigation";

import { getProfileName } from "@/entities/profile";
import { LogoutButton } from "@/features/auth";
import { createClient } from "@/shared/api/supabase/server";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { PageHeader } from "@/shared/ui/layouts/page-header";
import { PageShell } from "@/shared/ui/layouts/page-shell";

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
          <Avatar size="lg" className="mb-2 size-16">
            <AvatarFallback className="bg-secondary text-secondary-foreground">
              <UserRoundIcon className="size-6" aria-hidden="true" />
            </AvatarFallback>
          </Avatar>
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
