import { searchKakaoPlaces } from "./places.ts";
import { resolveKakaoRegion } from "./regions.ts";
import type { KakaoSearchScope } from "./types.ts";

type KakaoPlaceSelection = {
  page: number;
  placeId: string;
  query: string;
  scope?: KakaoSearchScope | null;
};

export const verifyKakaoPlaces = async (selections: readonly KakaoPlaceSelection[]) => {
  const searches = new Map<string, ReturnType<typeof searchKakaoPlaces>>();

  return Promise.all(
    selections.map(async ({ page, placeId, query, scope }) => {
      const key = JSON.stringify([query, page, scope?.latitude ?? null, scope?.longitude ?? null]);
      let search = searches.get(key);
      if (!search) {
        search = searchKakaoPlaces(query, page, scope);
        searches.set(key, search);
      }

      const result = await search;
      const place = result.places?.find((item) => item.id === placeId);
      if (!place) return { error: "place" as const };

      const region = await resolveKakaoRegion(place.longitude, place.latitude);
      return region ? { place, region } : { error: "region" as const };
    }),
  );
};
