export const RECORD_DETAIL_COLUMNS =
  "id, activity, category, memo, weather, recorded_at, recorded_until, region_code, region_label, region_name, region_latitude, region_longitude, record_places(place:places(id, name, address, saved_at))";

export const RECORD_LOCATION_COLUMNS =
  "id, recorded_at, created_at, region_code, region_label, region_name, region_latitude, region_longitude";
