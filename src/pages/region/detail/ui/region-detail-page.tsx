import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { notFound } from "next/navigation";

import { recordsQueryOptions } from "@/entities/record";
import { getRecords } from "@/entities/record/server";
import { getRegion } from "@/entities/region";
import { requireUser } from "@/shared/api/supabase/require-user";
import { createQueryClient } from "@/shared/lib/react-query/query-client";

import { RegionDetailContent } from "./region-detail-content";

type RegionDetailPageProps = {
  params: Promise<{ regionCode: string }>;
};

export async function RegionDetailPage({ params }: RegionDetailPageProps) {
  const [{ regionCode }, { user }] = await Promise.all([params, requireUser()]);
  const region = getRegion(regionCode);

  if (!region) notFound();

  const { data: records, error } = await getRecords(user.id);

  if (error) throw error;

  const queryClient = createQueryClient();
  queryClient.setQueryData(recordsQueryOptions.queryKey, records);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <RegionDetailContent region={region} />
    </HydrationBoundary>
  );
}
