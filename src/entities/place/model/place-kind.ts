export type PlaceKind = "cafe" | "restaurant" | "park" | "other";

export type PlaceClassification = {
  category_group_code?: string | null;
  category_name?: string | null;
};

export const getPlaceKind = (place: PlaceClassification): PlaceKind => {
  if (place.category_group_code === "CE7") return "cafe";
  if (place.category_group_code === "FD6") return "restaurant";
  if (place.category_name?.split(">").some((part) => part.trim() === "공원")) return "park";
  return "other";
};
