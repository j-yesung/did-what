import { redirect } from "next/navigation";

import { getAccountMembers, getCurrentMemberId } from "@/entities/member/server";
import { MemberSelect } from "@/features/member/select-member";
import { requireUser } from "@/shared/api/supabase/require-user";
import { PageHeader, PageShell } from "@/shared/ui/layouts";
import { ListHeader } from "@/shared/ui/list-header";

type MemberSelectPageProps = {
  searchParams: Promise<{ returnTo?: string }>;
};

export async function MemberSelectPage({ searchParams }: MemberSelectPageProps) {
  const [{ returnTo }, { supabase, user }] = await Promise.all([searchParams, requireUser()]);
  const members = await getAccountMembers(supabase, user.id);
  if (!members.length) redirect("/members/setup");

  const currentMemberId = await getCurrentMemberId();
  const destination = returnTo === "/settings" ? "/settings" : "/";

  return (
    <PageShell className="gap-8">
      {destination === "/settings" ? (
        <div className="flex flex-col gap-5">
          <PageHeader back="/settings" title="누가 사용 중인가요?" />
          <p className="px-1 text-muted-foreground text-sm leading-relaxed">
            이 기기에서 기록을 남기고 알림을 확인할 사람을 선택해 주세요.
          </p>
        </div>
      ) : (
        <ListHeader
          description="이 기기에서 기록을 남기고 알림을 확인할 사람을 선택해 주세요."
          title="누가 사용 중인가요?"
        />
      )}
      <MemberSelect
        currentMemberId={currentMemberId}
        destination={destination}
        members={members.filter((member) => member.is_active)}
      />
    </PageShell>
  );
}
