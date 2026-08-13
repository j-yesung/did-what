import { getProfileName } from "@/entities/profile";
import { LogoutButton } from "@/features/auth";
import { getTheme, ThemeSelect } from "@/features/switch-theme";
import { requireUser } from "@/shared/api/supabase/require-user";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { PageHeader, PageShell } from "@/shared/ui/layouts";

export async function SettingsPage() {
  const { user } = await requireUser();

  const [displayName, theme] = await Promise.all([getProfileName(user.id), getTheme()]);

  return (
    <PageShell withBottomNavigation>
      <PageHeader title="설정" />

      <Card>
        <CardHeader className="justify-items-center text-center">
          <CardTitle className="text-lg">{displayName || "기록자"}</CardTitle>
          <CardDescription>{user.email}</CardDescription>
        </CardHeader>
      </Card>

      <Card className="flex-1">
        <CardContent className="flex flex-col gap-6">
          <ThemeSelect value={theme} />
          <LogoutButton />
        </CardContent>
      </Card>
    </PageShell>
  );
}
