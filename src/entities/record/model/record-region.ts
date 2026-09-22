/** 목록 쿼리가 돌려주는 행의 일부. 대표 지역과 나머지 방문 지역이 함께 온다. */
export type RecordRegionLabelSource = {
  record_regions?: { region_label: string }[];
  region_label?: string;
};

const VISIBLE_REGION_LIMIT = 2;

/**
 * 좁은 카드에 쓸 방문 지역 문구. 두 곳까지 적고 나머지는 "외 N곳"으로 줄인다.
 * 대표 지역을 앞에 두어 기록마다 순서가 흔들리지 않게 한다.
 */
export const formatRecordRegionLabels = (record: RecordRegionLabelSource): string => {
  const labels = (record.record_regions ?? []).map(({ region_label: label }) => label);
  const ordered = record.region_label
    ? [record.region_label, ...labels.filter((label) => label !== record.region_label)]
    : labels;

  if (ordered.length === 0) return "";
  if (ordered.length <= VISIBLE_REGION_LIMIT) return ordered.join(" · ");
  return `${ordered.slice(0, VISIBLE_REGION_LIMIT).join(" · ")} 외 ${ordered.length - VISIBLE_REGION_LIMIT}곳`;
};
