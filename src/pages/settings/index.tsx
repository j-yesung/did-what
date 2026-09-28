import { requireMember } from "@/entities/member/server";
import { LogoutButton } from "@/features/auth";
import { CurrentMemberSetting } from "@/features/member/select-member";
import { PushToggle } from "@/features/push-notification";
import { ThemeSelect } from "@/features/switch-theme";
import { getTheme } from "@/features/switch-theme/server";
import { PageSection, PageShell } from "@/shared/ui/layouts";

export async function SettingsPage() {
  const [theme, { member }] = await Promise.all([getTheme(), requireMember()]);

  return (
    <PageShell className="gap-4" withBottomNavigation>
      <header className="min-h-13">
        <h1 className="sr-only">설정</h1>
      </header>

      <div className="flex flex-1 flex-col">
        <PageSection className="pt-4 pb-4">
          <CurrentMemberSetting name={member.name} />
        </PageSection>
        <PageSection className="pt-4 pb-4">
          <ThemeSelect value={theme} />
        </PageSection>
        <PageSection className="pt-4 pb-4">
          <PushToggle />
        </PageSection>
        <PageSection className="mt-auto pt-4">
          <LogoutButton />
        </PageSection>
      </div>
    </PageShell>
  );
}
