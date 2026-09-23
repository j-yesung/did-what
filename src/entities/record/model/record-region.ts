import type { RecordSummary } from "./types";

const VISIBLE_REGION_LIMIT = 2;

/**
 * 대표 지역(records.region_code)을 맨 앞으로 옮기고 나머지 순서는 그대로 둔다.
 * record_regions 조인 결과에는 순서가 없어서, 그대로 쓰면 조회할 때마다 앞에 오는 지역이 바뀔 수 있다.
 */
export const sortPrimaryRegionFirst = <T>(
  items: readonly T[],
  primaryCode: string | undefined,
  getCode: (item: T) => string,
) => items.toSorted((a, b) => Number(getCode(b) === primaryCode) - Number(getCode(a) === primaryCode));

/**
 * 방문 지역 문구. 대표 지역을 앞에 두고 limit곳까지 적은 뒤 나머지는 "외 N곳"으로 줄인다.
 * 지역은 이름이 아니라 코드로 가린다. 서울 중구와 부산 중구처럼 이름이 같은 지역이 한 기록에 함께 있을 수 있다.
 */
export const formatRecordRegionLabels = (
  record: Pick<RecordSummary, "record_regions" | "region_code" | "region_label">,
  limit = VISIBLE_REGION_LIMIT,
): string => {
  const labels = record.record_regions?.length
    ? sortPrimaryRegionFirst(record.record_regions, record.region_code, (region) => region.region_code).map(
        (region) => region.region_label,
      )
    : [record.region_label ?? ""].filter(Boolean);

  if (labels.length <= limit) return labels.join(" · ");
  return `${labels.slice(0, limit).join(" · ")} 외 ${labels.length - limit}곳`;
};
