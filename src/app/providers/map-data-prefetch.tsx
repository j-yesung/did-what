import type { ReactNode } from "react";

import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { recordLocationsQueryOptions } from "@/entities/record";
import { getRecordLocations } from "@/entities/record/server";
import { requireUser } from "@/shared/api/supabase/require-user";
import { createQueryClient } from "@/shared/lib/react-query/query-client";

export async function MapDataPrefetch({ children }: { children: ReactNode }) {
  const { user } = await requireUser();
  const queryClient = createQueryClient();

  await queryClient.prefetchQuery({
    ...recordLocationsQueryOptions,
    queryFn: () => getRecordLocations(user.id),
  });

  return <HydrationBoundary state={dehydrate(queryClient)}>{children}</HydrationBoundary>;
}
