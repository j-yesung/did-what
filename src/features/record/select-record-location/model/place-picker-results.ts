import type { PlaceOption, PlaceSearchResult } from "@/entities/place";
import { getPlaceRegionLabel } from "@/entities/place/model/get-place-region-label";

import type { RecordLocationRegion } from "./location-picker";

export const getPlacePickerResults = (
  savedPlaces: readonly PlaceOption[],
  regions: readonly RecordLocationRegion[],
  query: string,
  pages: readonly PlaceSearchResult[],
) => {
  const searchResults = pages.flatMap((page) => page.places.map((place) => ({ page, place })));
  const savedByProviderId = new Map(
    savedPlaces
      .filter((place) => place.provider === "kakao" && place.region_name)
      .map((place) => [place.provider_place_id, place]),
  );
  const inRegion = (place: PlaceOption) =>
    regions.some((region) => place.region_code.slice(0, 5) === region.code.slice(0, 5));
  const searchScopes = regions.filter(
    (region, index) => regions.findIndex((item) => item.code === region.code) === index,
  );
  const selectableSavedPlaces = savedPlaces
    .filter((place) => place.region_name)
    .toSorted((a, b) => Number(inRegion(b)) - Number(inRegion(a)));
  const savedMatches = query.trim()
    ? selectableSavedPlaces.filter(
        (place) =>
          `${place.name} ${place.address ?? ""} ${getPlaceRegionLabel(place.region_name, place.address)}`
            .toLocaleLowerCase("ko")
            .includes(query.trim().toLocaleLowerCase("ko")) ||
          searchResults.some(({ place: result }) => result.id === place.provider_place_id),
      )
    : [];
  const savedMatchIds = new Set(savedMatches.map((place) => place.provider_place_id).filter(Boolean));
  const savedMatchNames = new Set(
    savedMatches.map((place) => `${place.name.trim().toLocaleLowerCase("ko")}|${place.address?.trim() ?? ""}`),
  );
  const uniqueSearchResults = searchResults.filter(({ place }) => {
    const providerMatch = savedMatchIds.has(place.id);
    const nameAddressMatch = savedMatchNames.has(
      `${place.name.trim().toLocaleLowerCase("ko")}|${place.address?.trim() ?? ""}`,
    );
    return !providerMatch && !nameAddressMatch;
  });
  return { savedByProviderId, searchScopes, savedMatches, uniqueSearchResults };
};
