import { requireMember } from "@/entities/member/server";
import { LogoutButton } from "@/features/auth";
import { CurrentMemberSetting } from "@/features/member/select-member";
import { PushToggle } from "@/features/push-notification";
import { ThemeSelect } from "@/features/switch-theme";
import { getTheme } from "@/features/switch-theme/server";
import { PageSection, PageShell } from "@/shared/ui/layouts";
import { ListHeader } from "@/shared/ui/list-header";

export async function SettingsPage() {
  const [theme, { member }] = await Promise.all([getTheme(), requireMember()]);

  return (
    <PageShell withBottomNavigation>
      <ListHeader title="설정" />

      <div className="flex flex-1 flex-col">
        <PageSection className="pb-5">
          <CurrentMemberSetting name={member.name} />
        </PageSection>
        <PageSection className="pb-5">
          <ThemeSelect value={theme} />
        </PageSection>
        <PageSection className="pb-5">
          <PushToggle />
        </PageSection>
        <PageSection className="mt-auto">
          <LogoutButton />
        </PageSection>
      </div>
    </PageShell>
  );
}
