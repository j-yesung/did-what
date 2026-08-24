import { LogoutButton } from "@/features/auth";
import { PushToggle } from "@/features/push-notification";
import { getTheme, ThemeSelect } from "@/features/switch-theme";
import { Card, CardContent } from "@/shared/ui/card";
import { PageHeader, PageShell } from "@/shared/ui/layouts";

export async function SettingsPage() {
  const theme = await getTheme();

  return (
    <PageShell withBottomNavigation>
      <PageHeader title="설정" />

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
