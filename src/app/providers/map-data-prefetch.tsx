import type { ReactNode } from "react";

import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { fetchRecordLocations, recordLocationsQueryOptions } from "@/entities/record";
import { requireUser } from "@/shared/api/supabase/require-user";
import { createQueryClient } from "@/shared/lib/react-query/query-client";

export async function MapDataPrefetch({ children }: { children: ReactNode }) {
  const { supabase } = await requireUser();
  const queryClient = createQueryClient();

  await queryClient.prefetchQuery({
    ...recordLocationsQueryOptions,
    queryFn: () => fetchRecordLocations(supabase),
  });

  return <HydrationBoundary state={dehydrate(queryClient)}>{children}</HydrationBoundary>;
}
