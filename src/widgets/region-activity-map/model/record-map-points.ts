export type MapRecord = {
  activity: string;
  category: string[];
  id: string;
  recorded_at: string;
  recorded_until: string | null;
  record_places: { place: { id: string; latitude: number; longitude: number; name: string } | null }[];
  record_regions: { region_code: string; region_latitude: number; region_longitude: number; region_name: string }[];
};

/** 지도 셀 농도만 정하므로 좌표와 중복을 가를 id만 둔다. */
export type RecordMapPoint = {
  id: string;
  latitude: number;
  longitude: number;
};

export const toRecordMapPoints = (records: readonly MapRecord[]): RecordMapPoint[] =>
  records.flatMap<RecordMapPoint>((record) => {
    const places = record.record_places.flatMap(({ place }) => (place ? [place] : []));
    if (places.length > 0) {
      return places.map((place) => ({
        id: `place:${record.id}:${place.id}`,
        latitude: place.latitude,
        longitude: place.longitude,
      }));
    }

    return record.record_regions
      .filter((region, index, all) => all.findIndex((item) => item.region_code === region.region_code) === index)
      .map((region) => ({
        id: `region:${record.id}:${region.region_code}`,
        latitude: region.region_latitude,
        longitude: region.region_longitude,
      }));
  });

// region_name은 "서울 중구", "충북 청주시 상당구"처럼 시·도 약칭 뒤에 시·군·구가 붙는다.
// 시 아래 일반구는 같은 시로 묶어야 청주 여행 한 번이 시트에서 청주시 칩 하나로 모인다.
export const getSubregionName = (regionName: string) => regionName.split(" ")[1] ?? regionName;
