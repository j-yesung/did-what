import { requireMember } from "@/entities/member/server";
import { getSavedPlaces } from "@/entities/place/server";
import { PageShell } from "@/shared/ui/layouts";

import { PlaceSearchBottomSheet } from "./place-search-bottom-sheet";
import { SavedPlaceList } from "./saved-place-list";

type PlacesPageProps = { searchParams: Promise<{ q?: string | string[] }> };

export async function PlacesPage({ searchParams }: PlacesPageProps) {
  const [params, { user }] = await Promise.all([searchParams, requireMember()]);
  const initialPlaces = await getSavedPlaces(user.id);
  return (
    <>
      <PageShell className="gap-4" withBottomNavigation>
        <header className="min-h-13">
          <h1 className="sr-only">내 장소</h1>
        </header>
        <SavedPlaceList initialPlaces={initialPlaces} />
      </PageShell>
      <PlaceSearchBottomSheet
        initialPlaces={initialPlaces}
        initialQuery={typeof params.q === "string" ? params.q : undefined}
      />
    </>
  );
}
