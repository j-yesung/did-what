import { LogoutButton } from "@/features/auth";
import { PushToggle } from "@/features/push-notification";
import { ThemeSelect } from "@/features/switch-theme";
import { getTheme } from "@/features/switch-theme/server";
import { Card, CardContent } from "@/shared/ui/card";
import { PageHeader, PageShell } from "@/shared/ui/layouts";

export async function SettingsPage() {
  const theme = await getTheme();

  return (
    <PageShell withBottomNavigation>
      <PageHeader title="설정" />

      <Card className="flex-1">
        <CardContent className="flex flex-1 flex-col gap-6">
          <ThemeSelect value={theme} />
          <PushToggle />
          <LogoutButton />
        </CardContent>
      </Card>
    </PageShell>
  );
}
