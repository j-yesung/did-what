import { LogoutButton } from "@/features/auth";
import { PushToggle } from "@/features/push-notification";
import { getTheme, ThemeSelect } from "@/features/switch-theme";
import { requireUser } from "@/shared/api/supabase/require-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { PageHeader, PageShell } from "@/shared/ui/layouts";

export async function SettingsPage() {
  const { user } = await requireUser();

  const theme = await getTheme();

  return (
    <PageShell withBottomNavigation>
      <PageHeader title="설정" />

      <Card>
        <CardHeader className="justify-items-center text-center">
          <CardTitle className="font-medium text-base">{user.email}</CardTitle>
        </CardHeader>
      </Card>

      <Card className="flex-1">
        <CardContent className="flex flex-col gap-6">
          <ThemeSelect value={theme} />
          <PushToggle />
          <LogoutButton />
        </CardContent>
      </Card>
    </PageShell>
  );
}
