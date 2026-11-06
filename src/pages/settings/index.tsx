import { getMemberHomeAddress, requireMember } from "@/entities/member/server";
import { LogoutButton } from "@/features/auth";
import { HomeAddressSetting } from "@/features/home-address/ui/home-address-setting";
import { CurrentMemberSetting } from "@/features/member/select-member";
import { getMetOn } from "@/features/met-on/api/met-on";
import { MetOnSetting } from "@/features/met-on/ui/met-on-setting";
import { PushToggle } from "@/features/push-notification";
import { ThemeSelect } from "@/features/switch-theme";
import { getTheme } from "@/features/switch-theme/server";
import { PageSection, PageShell } from "@/shared/ui/layouts";

export async function SettingsPage() {
  const [{ member, members }, { data: home, error: homeError }, theme, metOn] = await Promise.all([
    requireMember(),
    getMemberHomeAddress(),
    getTheme(),
    getMetOn(),
  ]);

  return (
    <PageShell className="gap-4" withBottomNavigation>
      <header className="min-h-13">
        <h1 className="sr-only">설정</h1>
      </header>

      <div className="flex flex-1 flex-col">
        <PageSection className="pt-4 pb-4">
          <CurrentMemberSetting member={member} members={members} />
        </PageSection>
        <PageSection className="pt-4 pb-4">
          <MetOnSetting metOn={metOn} />
        </PageSection>
        <PageSection className="pt-4 pb-4">
          {homeError ? (
            <p className="text-muted-foreground text-sm">
              집 주소 설정을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
            </p>
          ) : (
            <HomeAddressSetting address={home?.address ?? null} memberName={member.name} />
          )}
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
