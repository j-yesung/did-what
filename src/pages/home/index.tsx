import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { requireMember } from "@/entities/member/server";
import { getMetOn } from "@/features/met-on/api/met-on";
import { createQueryClient } from "@/shared/lib/react-query/query-client";

import { fetchHomeData, homeQueryOptions } from "./api/home-data";
import { HomeScreen } from "./ui/home-screen";

export async function HomePage() {
  const queryClient = createQueryClient();
  const [{ member }, metOn] = await Promise.all([
    requireMember(),
    getMetOn(),
    queryClient.prefetchQuery({
      ...homeQueryOptions,
      queryFn: async () => fetchHomeData((await requireMember()).supabase),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HomeScreen member={{ name: member.name }} metOn={metOn} />
    </HydrationBoundary>
  );
}
