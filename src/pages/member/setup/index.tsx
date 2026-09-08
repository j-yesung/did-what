import { redirect } from "next/navigation";

import { getAccountMembers } from "@/entities/member/server";
import { MemberSetupForm } from "@/features/member/setup-members";
import { requireUser } from "@/shared/api/supabase/require-user";
import { Card, CardContent } from "@/shared/ui/card";
import { PageShell } from "@/shared/ui/layouts";
import { ListHeader } from "@/shared/ui/list-header";

export async function MemberSetupPage() {
  const { supabase, user } = await requireUser();
  const members = await getAccountMembers(supabase, user.id);
  if (members.length) redirect("/members/select");

  return (
    <PageShell className="gap-8 pt-[calc(48px+env(safe-area-inset-top))]">
      <ListHeader description="함께 기록할 사람들의 이름을 먼저 알려 주세요." title="누가 함께 쓰나요?" />
      <Card>
        <CardContent>
          <MemberSetupForm />
        </CardContent>
      </Card>
    </PageShell>
  );
}
