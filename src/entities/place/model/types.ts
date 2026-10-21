export type PlaceOption = {
  category_group_code?: string | null;
  category_name?: string | null;
  address: string | null;
  id: string;
  latitude: number;
  longitude: number;
  name: string;
  provider?: string | null;
  provider_place_id?: string | null;
  region_code: string;
  region_name: string | null;
  saved_at: string | null;
};
