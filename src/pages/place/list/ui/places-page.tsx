import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { requireMember } from "@/entities/member/server";
import { fetchPlaces, placesQueryOptions } from "@/entities/place";
import { createQueryClient } from "@/shared/lib/react-query/query-client";
import { PageShell } from "@/shared/ui/layouts";

import { PlaceSearchBottomSheet } from "./place-search-bottom-sheet";
import { SavedPlaceList } from "./saved-place-list";

type PlacesPageProps = { searchParams: Promise<{ q?: string | string[] }> };

export async function PlacesPage({ searchParams }: PlacesPageProps) {
  const [params, { supabase }] = await Promise.all([searchParams, requireMember()]);
  const queryClient = createQueryClient();
  await queryClient.prefetchQuery({ ...placesQueryOptions, queryFn: () => fetchPlaces(supabase) });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PageShell className="gap-4" withBottomNavigation>
        <header className="min-h-13">
          <h1 className="sr-only">내 장소</h1>
        </header>
        <SavedPlaceList />
      </PageShell>
      <PlaceSearchBottomSheet initialQuery={typeof params.q === "string" ? params.q : undefined} />
    </HydrationBoundary>
  );
}
