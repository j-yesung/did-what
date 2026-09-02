type SavedPlace = {
  id: string;
  provider: string | null;
  provider_place_id: string | null;
};

export function getSavedKakaoPlaces(places: SavedPlace[]) {
  return new Map(
    places.flatMap((place) =>
      place.provider === "kakao" && place.provider_place_id ? [[place.provider_place_id, place.id] as const] : [],
    ),
  );
}
