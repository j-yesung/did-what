import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { anniversariesQueryOptions, fetchAnniversaries } from "@/entities/anniversary/api/anniversaries";
import { requireMember } from "@/entities/member/server";
import { AnniversaryManager } from "@/features/manage-anniversaries/ui/anniversary-manager";
import { getToday } from "@/shared/lib/date/get-today";
import { createQueryClient } from "@/shared/lib/react-query/query-client";
import { PageHeader, PageShell } from "@/shared/ui/layouts";

export async function AnniversariesPage() {
  const { supabase } = await requireMember();
  const queryClient = createQueryClient();
  await queryClient.prefetchQuery({
    ...anniversariesQueryOptions,
    queryFn: () => fetchAnniversaries(supabase),
  });

  return (
    <PageShell>
      <PageHeader back="/" title="기념일 관리" />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <AnniversaryManager today={getToday()} />
      </HydrationBoundary>
    </PageShell>
  );
}
