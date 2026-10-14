import { buildRecordsHref, hasRecordFilters, parseRecordFilters } from "./record-filters.ts";
import assert from "node:assert/strict";

const EMPTY = { category: "", from: "", query: "", sort: "recent", to: "" };

assert.deepEqual(parseRecordFilters({}), EMPTY);
assert.deepEqual(parseRecordFilters({ q: ["a", "b"], sort: "unknown" }), EMPTY);

// or() 필터를 깨뜨리는 문자는 검색어에서 제거한다.
assert.equal(parseRecordFilters({ q: " 커피,(100%) " }).query, "커피100");

// 날짜 형식이 아니면 무시하고, 시작일이 종료일보다 늦으면 뒤집는다.
assert.equal(parseRecordFilters({ from: "2026-13-01" }).from, "");
assert.deepEqual(parseRecordFilters({ from: "2026-08-20", to: "2026-08-01" }), {
  category: "",
  from: "2026-08-01",
  query: "",
  sort: "recent",
  to: "2026-08-20",
});

assert.equal(hasRecordFilters(EMPTY), false);
assert.equal(hasRecordFilters({ ...EMPTY, sort: "oldest" }), true);
assert.equal(hasRecordFilters({ ...EMPTY, query: "커피" }), true);

assert.equal(buildRecordsHref(EMPTY), "/records");
assert.equal(
  buildRecordsHref({ ...EMPTY, query: "커 피", from: "2026-08-01" }),
  "/records?q=%EC%BB%A4+%ED%94%BC&from=2026-08-01",
);
assert.equal(
  buildRecordsHref({ ...EMPTY, query: "커피" }, { sort: "oldest" }),
  "/records?q=%EC%BB%A4%ED%94%BC&sort=oldest",
);

assert.equal(parseRecordFilters({ category: "travel" }).category, "travel");
assert.equal(parseRecordFilters({ category: "uncategorized" }).category, "uncategorized");
assert.equal(parseRecordFilters({ category: "invalid" }).category, "");
assert.equal(parseRecordFilters({ category: ["travel", "date"] }).category, "");
assert.equal(hasRecordFilters({ ...EMPTY, category: "travel" }), true);
const categoryFilters = { ...EMPTY, category: "travel", query: "바다", from: "2026-09-01", sort: "oldest" };
assert.deepEqual(
  parseRecordFilters(
    Object.fromEntries(new URL(buildRecordsHref(categoryFilters), "https://example.test").searchParams),
  ),
  categoryFilters,
);
assert.equal(buildRecordsHref({ ...EMPTY, category: "date" }, { category: "" }), "/records");
