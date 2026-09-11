export const PLACE_DETAIL_COLUMNS =
  "id, name, address, created_at, saved_at, region_code, region_name, provider, provider_place_id";

export const SAVED_PLACE_COLUMNS = `${PLACE_DETAIL_COLUMNS}, record_places(count)`;
