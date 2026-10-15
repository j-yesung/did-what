import { getRegionRecordCounts } from "@/widgets/region-activity-map/model/region-visit-summary";

import assert from "node:assert/strict";
import test from "node:test";

const record = (...codes) => ({ record_regions: codes.map((region_code) => ({ region_code })) });

test("같은 시·도의 여러 지역을 방문한 기록은 한 번만 세고 여러 시·도에는 각각 센다", () => {
  const counts = getRegionRecordCounts([record("11110", "11200", "26350"), record("11110")]);
  assert.deepEqual(
    [...counts],
    [
      ["KR-11", 2],
      ["KR-26", 1],
    ],
  );
});

test("통합 전 지역 코드는 같은 지역으로 세고 알 수 없는 코드는 무시한다", () => {
  assert.deepEqual([...getRegionRecordCounts([record("29110", "46130", "12", "unknown")])], [["KR-12", 1]]);
});

test("기록이나 방문 지역이 없으면 빈 집계를 반환한다", () => {
  assert.equal(getRegionRecordCounts([]).size, 0);
  assert.equal(getRegionRecordCounts([record()]).size, 0);
});
