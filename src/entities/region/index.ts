export { REGION_SEARCH_KEY, useRegionSearch } from "./api/queries";
export type { RegionSearchResult } from "./api/search-regions";
export { searchRegions } from "./api/search-regions";
export {
  createKoreaMap,
  createRegionActivityMaps,
  filterRecordsByRegion,
  getActivityLevel,
  getRegion,
  getRegionCode,
  getRegionProgressLabel,
  isRegionCode,
  KOREA_MAP_CELL_STYLE,
  type KoreaMapCell,
  type KoreaMapGrid,
  REGIONS,
  type RecordLocation,
  type Region,
  type RegionActivityMap,
  type RegionCode,
  type RegionRecordLocation,
} from "./model/korea-map";
export { KoreaActivityMap, RegionMiniMap } from "./ui/activity-map";
