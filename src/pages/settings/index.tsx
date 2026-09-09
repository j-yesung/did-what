import { requireMember } from "@/entities/member/server";
import { LogoutButton } from "@/features/auth";
import { CurrentMemberSetting } from "@/features/member/select-member";
import { PushToggle } from "@/features/push-notification";
import { ThemeSelect } from "@/features/switch-theme";
import { getTheme } from "@/features/switch-theme/server";
import { Card, CardContent } from "@/shared/ui/card";
import { PageShell } from "@/shared/ui/layouts";
import { ListHeader } from "@/shared/ui/list-header";

export async function SettingsPage() {
  const [theme, { member }] = await Promise.all([getTheme(), requireMember()]);

  return (
    <PageShell withBottomNavigation>
      <ListHeader title="설정" />

      <Card className="flex-1">
        <CardContent className="flex flex-1 flex-col gap-6">
          <CurrentMemberSetting name={member.name} />
          <ThemeSelect value={theme} />
          <PushToggle />
          <LogoutButton />
        </CardContent>
      </Card>
    </PageShell>
  );
}
