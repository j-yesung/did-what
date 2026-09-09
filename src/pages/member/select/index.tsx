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
        </div>
      ) : (
        <ListHeader title="누가 사용 중인가요?" />
      )}
      <MemberSelect
        currentMemberId={currentMemberId}
        destination={destination}
        members={members.filter((member) => member.is_active)}
      />
    </PageShell>
  );
}
