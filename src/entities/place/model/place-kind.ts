export type PlaceKind = "cafe" | "restaurant" | "park" | "attraction" | "culture" | "shopping" | "other";

const SHOPPING_CATEGORIES = ["패션", "백화점", "복합쇼핑몰", "시장"];

export type PlaceClassification = {
  category_group_code?: string | null;
  category_name?: string | null;
};

export const getPlaceKind = (place: PlaceClassification): PlaceKind => {
  if (place.category_group_code === "CE7") return "cafe";
  if (place.category_group_code === "FD6") return "restaurant";
  if (place.category_group_code === "CT1") return "culture";
  const parts = place.category_name?.split(">").map((part) => part.trim()) ?? [];
  if (parts.includes("공원")) return "park";
  if (parts.includes("관광,명소")) return "attraction";
  if (parts.some((part) => SHOPPING_CATEGORIES.includes(part))) return "shopping";
  return "other";
};
