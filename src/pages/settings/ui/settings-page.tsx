import { LogoutButton } from "@/features/auth";
import { getTheme, ThemeSelect } from "@/features/switch-theme";
import { requireUser } from "@/shared/api/supabase/require-user";
import { Card, CardContent } from "@/shared/ui/card";
import { PageHeader, PageShell } from "@/shared/ui/layouts";

import { SettingsContent } from "./settings-content";

export async function SettingsPage() {
  const { user } = await requireUser();

  const theme = await getTheme();

  return (
    <PageShell withBottomNavigation>
      <PageHeader title="설정" />

      <SettingsContent email={user.email} />

      <Card className="flex-1">
        <CardContent className="flex flex-col gap-6">
          <ThemeSelect value={theme} />
          <LogoutButton />
        </CardContent>
      </Card>
    </PageShell>
  );
}
