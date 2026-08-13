import { getProfileName } from "@/entities/profile";
import { LogoutButton } from "@/features/auth";
import { requireUser } from "@/shared/api/supabase/require-user";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { PageHeader, PageShell } from "@/shared/ui/layouts";

export async function SettingsPage() {
  const { user } = await requireUser();

  const displayName = (await getProfileName(user.id)) || "기록자";

  return (
    <PageShell>
      <PageHeader title="설정" />

      <Card className="flex-1">
        <CardHeader className="justify-items-center text-center">
          <CardTitle className="text-lg">{displayName}</CardTitle>
          <CardDescription>{user.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <LogoutButton />
        </CardContent>
      </Card>
    </PageShell>
  );
}
