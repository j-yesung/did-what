import { formatRecordRegionLabels } from "./record-region.ts";
import assert from "node:assert/strict";
import { test } from "node:test";

const labels = (...names) => names.map((region_label) => ({ region_label }));

test("두 곳까지는 그대로 이어 붙인다", () => {
  assert.equal(formatRecordRegionLabels({ region_label: "마포구", record_regions: labels("마포구") }), "마포구");
  assert.equal(
    formatRecordRegionLabels({ region_label: "마포구", record_regions: labels("마포구", "목포시") }),
    "마포구 · 목포시",
  );
});

test("세 곳부터는 나머지를 외 N곳으로 줄인다", () => {
  assert.equal(
    formatRecordRegionLabels({
      region_label: "마포구",
      record_regions: labels("목포시", "마포구", "여수시", "순천시"),
    }),
    "마포구 · 목포시 외 2곳",
  );
});

test("대표 지역만 있으면 그것만 보여준다", () => {
  assert.equal(formatRecordRegionLabels({ region_label: "마포구" }), "마포구");
  assert.equal(formatRecordRegionLabels({}), "");
});
