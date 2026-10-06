const RECORD_REGION_COLUMNS =
  "record_regions(region_code, region_name, region_label, region_latitude, region_longitude, selected_directly)";

export const RECORD_DETAIL_COLUMNS = `id, activity, category, memo, weather, recorded_at, recorded_until, region_code, region_label, ${RECORD_REGION_COLUMNS}, record_places(place:places(id, name, address, saved_at, category_group_code, category_name, latitude, longitude, region_code, region_name))`;

// 홈 지도는 점을 장소 좌표에 찍고, 지역을 누르면 활동명 목록을 보여줘서 둘 다 함께 가져온다.
export const RECORD_LOCATION_COLUMNS = `id, activity, category, recorded_at, recorded_until, created_at, ${RECORD_REGION_COLUMNS}, record_places(place:places(id, name, latitude, longitude))`;
