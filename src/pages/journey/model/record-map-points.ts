export type MapRecord = {
  activity: string;
  category: string[];
  id: string;
  recorded_at: string;
  recorded_until: string | null;
  record_comments?: { count: number }[];
  record_places: { place: { id: string; latitude: number; longitude: number; name: string } | null }[];
  record_regions: { region_code: string; region_latitude: number; region_longitude: number; region_name: string }[];
};

// region_name은 "서울 중구", "충북 청주시 상당구"처럼 시·도 약칭 뒤에 시·군·구가 붙는다.
// 시 아래 일반구는 같은 시로 묶어야 청주 여행 한 번이 시트에서 청주시 칩 하나로 모인다.
export const getSubregionName = (regionName: string) => regionName.split(" ")[1] ?? regionName;
