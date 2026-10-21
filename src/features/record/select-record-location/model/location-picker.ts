import type { PlaceOption } from "@/entities/place";
import type { RecordPlaceReference, RecordRegionLocationRow } from "@/entities/record";
import { MAX_VISITED_PLACES, MAX_VISITED_REGIONS } from "@/entities/record/model/limits";
import { getRecordRegionKey, mergeVisitedRegions } from "@/entities/record/model/record-region";
import type { KakaoRegion } from "@/shared/api/kakao-local";

export type RecordLocationRegion = KakaoRegion & { label: string };

export type RecordLocationPlace = Pick<PlaceOption, "category_group_code" | "category_name"> & {
  address: string | null;
  key: string;
  name: string;
  reference: RecordPlaceReference;
  /** 장소가 속한 지역. 장소를 담으면 이 지역도 방문 지역에 따라 들어간다. */
  region: RecordLocationRegion;
};

export type PlacePickerTab = "places" | "regions";

export type PlacePickerDraft = {
  keyword: string;
  query: string;
  regionKeyword: string;
  regionQuery: string;
  scopeCode: string | null;
  selectedPlaces: Map<string, RecordLocationPlace>;
  selectedRegions: Map<string, RecordLocationRegion>;
  tab: PlacePickerTab;
};

export const createPlacePickerDraft = (): PlacePickerDraft => ({
  keyword: "",
  query: "",
  regionKeyword: "",
  regionQuery: "",
  scopeCode: null,
  selectedPlaces: new Map(),
  selectedRegions: new Map(),
  tab: "places",
});

/** "서울 마포구 망원동"에서 "망원동"처럼 전체 지역명의 마지막 마디. */
export const toShortRegionName = (fullName: string) => fullName.split(" ").at(-1) ?? fullName;

/** 이미 있는 장소를 작성 화면의 방문 장소로 바꾼다. 장소의 지역이 그대로 방문 지역이 된다. */
export const toExistingRecordLocationPlace = (place: Omit<PlaceOption, "saved_at">): RecordLocationPlace => {
  const fullName = place.region_name ?? "";
  const name = toShortRegionName(fullName);

  return {
    address: place.address,
    category_group_code: place.category_group_code,
    category_name: place.category_name,
    key: `existing:${place.id}`,
    name: place.name,
    reference: { kind: "existing", placeId: place.id, save: false },
    region: {
      code: place.region_code,
      fullName,
      label: name,
      latitude: place.latitude,
      longitude: place.longitude,
      name,
    },
  };
};

/** 지역 칩에 몇 개까지 보여줄지. 한 줄이나 두 줄에 들어가는 선. */
const RECENT_REGION_LIMIT = 6;

/**
 * 기록에 남은 지역을 최근 순으로 훑어 중복을 거른다.
 *
 * records 쿼리가 이미 recorded_at 내림차순으로 정렬해 주므로 여기서 다시 정렬하지 않는다.
 * 짧은 이름(name)은 전체 이름의 마지막 마디에서 얻는다. "서울 마포구 망원동" → "망원동".
 */
export const toRecentRegions = (
  records: readonly Pick<RecordRegionLocationRow, "record_regions">[],
  limit = RECENT_REGION_LIMIT,
): RecordLocationRegion[] => {
  const seen = new Set<string>();
  const regions: RecordLocationRegion[] = [];

  for (const record of records) {
    for (const region of record.record_regions) {
      const key = getRecordRegionKey({ code: region.region_code, label: region.region_label });
      if (!region.region_code || seen.has(key)) continue;

      seen.add(key);
      regions.push({
        code: region.region_code,
        fullName: region.region_name,
        label: region.region_label,
        latitude: region.region_latitude,
        longitude: region.region_longitude,
        name: toShortRegionName(region.region_name),
      });

      if (regions.length >= limit) return regions;
    }
  }

  return regions;
};

/** 화면에 보여줄 방문 지역. 직접 고른 지역이 앞에 오고, 장소에서 따라온 지역이 뒤를 잇는다. */
export const toVisitedRegions = (
  regions: readonly RecordLocationRegion[],
  places: readonly RecordLocationPlace[],
): RecordLocationRegion[] => {
  return mergeVisitedRegions(
    regions,
    places.map((place) => place.region),
  );
};

export const getRecordLocationSelectionError = (
  regions: readonly RecordLocationRegion[],
  places: readonly RecordLocationPlace[],
): string | undefined => {
  if (places.length > MAX_VISITED_PLACES)
    return `방문 장소는 ${MAX_VISITED_PLACES}곳까지 담을 수 있어요. 선택한 장소를 줄여 주세요.`;
  if (toVisitedRegions(regions, places).length > MAX_VISITED_REGIONS) {
    return `방문 지역은 ${MAX_VISITED_REGIONS}곳까지 담을 수 있어요. 선택한 장소를 줄이거나 작성 화면에서 지역을 정리해 주세요.`;
  }
};

export type ResolveRecordPlaceResult = { error: string } | { place: RecordLocationPlace };

export const removeRecordLocationRegion = (
  regions: readonly RecordLocationRegion[],
  places: readonly RecordLocationPlace[],
  target: RecordLocationRegion,
) => {
  const nextRegions = regions.filter((region) => getRecordRegionKey(region) !== getRecordRegionKey(target));
  const keepsRegion = nextRegions.some((region) => region.code === target.code);
  return {
    places: keepsRegion ? [...places] : places.filter((place) => place.region.code !== target.code),
    regions: nextRegions,
  };
};
