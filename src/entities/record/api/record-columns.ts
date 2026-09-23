const RECORD_REGION_COLUMNS =
  "record_regions(region_code, region_name, region_label, region_latitude, region_longitude, selected_directly)";

export const RECORD_DETAIL_COLUMNS = `id, activity, category, memo, weather, recorded_at, recorded_until, region_code, region_label, ${RECORD_REGION_COLUMNS}, record_places(place:places(id, name, address, saved_at, latitude, longitude, region_code, region_name))`;

export const RECORD_LOCATION_COLUMNS = `id, recorded_at, created_at, ${RECORD_REGION_COLUMNS}`;
