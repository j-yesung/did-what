export type RecordRegionLocationRow = {
  id: string;
  record_regions: {
    region_code: string;
    region_label: string;
    region_latitude: number;
    region_longitude: number;
    region_name: string;
  }[];
};

/**
 * 지도는 기록이 아니라 방문 지역 하나하나를 점으로 찍는다.
 * 한 기록이 여러 지역에 걸치면 그 지역 전부에 발자취가 남아야 해서다.
 */
export const toRegionLocations = (
  records: readonly {
    id: string;
    record_regions: readonly Pick<
      RecordRegionLocationRow["record_regions"][number],
      "region_code" | "region_latitude" | "region_longitude"
    >[];
  }[],
) => {
  return records.flatMap(({ id, record_regions: regions }) =>
    regions.map((region) => ({
      administrativeCode: region.region_code,
      id: `${id}:${region.region_code}`,
      latitude: region.region_latitude,
      longitude: region.region_longitude,
    })),
  );
};
