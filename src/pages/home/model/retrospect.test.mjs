import {
  countSubregions,
  getGreeting,
  getRelationshipStats,
  getSubregions,
  pickAroundThisTime,
  pickUpcomingAnniversary,
  rankPlaces,
  summarizeRegions,
  toVisitPoints,
} from "./retrospect.ts";
import assert from "node:assert/strict";
import { test } from "node:test";

const place = (id, name, extra = {}) => ({ id, latitude: 37.5, longitude: 127, name, ...extra });

const record = (id, recorded_at, extra = {}) => ({
  id,
  activity: id,
  category: [],
  recorded_at,
  recorded_until: null,
  region_code: "11",
  region_label: "서울",
  record_places: [],
  record_regions: [],
  weather: "sunny",
  ...extra,
});

const ids = (records) => records.map(({ id }) => id);

test("인사말은 이름 뒤에 받침에 맞는 호격 조사를 붙인다", () => {
  assert.equal(getGreeting("예성"), "어디 다녀왔어, 예성아?");
  assert.equal(getGreeting("민지"), "어디 다녀왔어, 민지야?");
  assert.equal(getGreeting(" 예성 "), "어디 다녀왔어, 예성아?");
  assert.equal(getGreeting("Alex"), "어디 다녀왔어, Alex?");
});

test("함께한 시간은 첫 기록, 함께한 날, 마지막 기록부터 지난 날을 센다", () => {
  const stats = getRelationshipStats(
    [
      record("a", "2026-11-01", { recorded_until: "2026-11-03" }),
      record("b", "2026-11-03"),
      record("c", "2026-10-30"),
      record("future", "2026-12-25"),
    ],
    "2026-11-06",
  );
  assert.deepEqual(stats, { daysTogether: 4, recorded: { daysSinceLast: 3, firstDate: "2026-10-30" } });
  assert.equal(
    getRelationshipStats([record("x", "2026-11-05", { recorded_until: "2026-11-09" })], "2026-11-06").recorded
      .daysSinceLast,
    0,
  );
  assert.equal(getRelationshipStats([record("a", "2026-12-25")], "2026-11-06"), null);
});

test("만난 날이 있으면 기록이 없어도 함께한 날을 만난 날부터 1일로 센다", () => {
  const records = [record("a", "2026-11-01")];
  const stats = getRelationshipStats(records, "2026-11-06", "2025-12-25");
  assert.equal(stats.daysTogether, 317);
  assert.deepEqual(getRelationshipStats([], "2026-11-06", "2025-12-25"), { daysTogether: 317, recorded: null });
  assert.equal(getRelationshipStats([], "2026-11-06"), null);
  assert.equal(getRelationshipStats(records, "2025-12-25", "2025-12-25").recorded, null);
  assert.equal(getRelationshipStats(records, "2026-11-06", "2026-11-06").daysTogether, 1);
  assert.equal(getRelationshipStats(records, "2026-11-06", "2026-12-01").daysTogether, 1);
});

test("이맘때는 오늘 앞뒤 3일 안의 지난 해 기록을 가까운 해부터 모은다", () => {
  const records = [
    record("d", "2026-11-06"),
    record("e", "2025-11-10"),
    record("a", "2025-11-09"),
    record("b", "2025-11-03"),
    record("c", "2024-11-06"),
  ];
  const picked = pickAroundThisTime(records, "2026-11-06");
  assert.equal(picked.yearsAgo, 1);
  assert.equal(picked.record.id, "a");
  assert.deepEqual(ids(picked.records), ["a", "b", "c"]);
  assert.equal(pickAroundThisTime([record("x", "2026-01-01")], "2026-11-06"), null);
});

test("이맘때는 연말과 연초를 넘어서도 짝을 맞춘다", () => {
  const picked = pickAroundThisTime(
    [record("x", "2025-12-30"), record("a", "2024-12-30"), record("b", "2025-01-02")],
    "2026-01-01",
  );
  assert.deepEqual(ids(picked.records), ["b", "a"]);
});

test("다가오는 기념일은 30일 안의 가장 가까운 기념일 기록", () => {
  const records = [
    record("a", "2025-11-18", { category: ["anniversary"] }),
    record("b", "2025-11-10", { category: ["anniversary"] }),
    record("c", "2025-11-08", { category: ["date"] }),
    record("d", "2025-12-25", { category: ["anniversary"] }),
  ];
  const picked = pickUpcomingAnniversary(records, "2026-11-06");
  assert.equal(picked.record.id, "b");
  assert.equal(picked.dday, 4);
  assert.equal(pickUpcomingAnniversary(records, "2026-01-20"), null);
  assert.equal(
    pickUpcomingAnniversary([record("e", "2025-01-03", { category: ["anniversary"] })], "2026-12-28").dday,
    6,
  );
});

const region = (region_code, region_name) => ({
  region_code,
  region_label: region_name,
  region_latitude: 37.5,
  region_longitude: 127,
  region_name,
});

test("시·도는 기록을 한 번만 세고, 시·군·구는 기록 수 순으로 센다", () => {
  const records = [
    record("a", "2026-11-01", {
      record_regions: [region("1168000000", "서울특별시 강남구"), region("1144000000", "서울특별시 마포구")],
    }),
    record("b", "2026-10-01", { record_regions: [region("1168010100", "서울특별시 강남구")] }),
    record("c", "2026-09-01", { record_regions: [region("4111000000", "경기도 수원시")] }),
    record("d", "2026-08-01", { record_regions: [region("2911000000", "광주광역시 동구")] }),
  ];
  const regions = Object.fromEntries(summarizeRegions(records).map(({ code, records }) => [code, ids(records)]));
  assert.deepEqual(regions["KR-11"], ["a", "b"]);
  assert.deepEqual(regions["KR-41"], ["c"]);
  assert.deepEqual(regions["KR-12"], ["d"]);
  assert.deepEqual(regions["KR-26"], []);
  assert.equal(summarizeRegions(records).length, 16);

  const entries = getSubregions(
    regions["KR-11"].map((id) => records.find((r) => r.id === id)),
    "KR-11",
  );
  assert.deepEqual(countSubregions(entries), [
    ["강남구", 2],
    ["마포구", 1],
  ]);
});

test("자주 간 곳은 전체 기록에 연결된 장소를 횟수순으로 셋까지, 가장 최근 기록과 함께", () => {
  const cafe = place("p1", "카페", { latitude: 37.54, longitude: 127.05 });
  const park = place("p2", "공원", { latitude: 37.53, longitude: 127.06 });
  const old = place("p3", "옛날");
  const records = [
    record("a", "2026-11-01", { record_places: [{ place: cafe }, { place: park }] }),
    record("b", "2026-10-01", { record_places: [{ place: cafe }, { place: null }] }),
    record("c", "2025-10-01", { record_places: [{ place: old }] }),
    record("d", "2026-12-01", { activity: "다시 카페", record_places: [{ place: cafe }] }),
  ];
  assert.deepEqual(
    rankPlaces(records).map(({ id, count, last }) => [id, count, last.activity, last.recorded_at]),
    [
      ["p1", 3, "다시 카페", "2026-12-01"],
      ["p2", 1, "a", "2026-11-01"],
      ["p3", 1, "c", "2025-10-01"],
    ],
  );
});

test("지도 점은 장소가 있으면 장소 좌표를, 없으면 기록의 지역 좌표를 지역마다 한 번 쓴다", () => {
  const place = { id: "p1", name: "카페", latitude: 37.54, longitude: 127.05 };
  const records = [
    record("a", "2026-11-01", {
      record_places: [{ place }],
      record_regions: [region("1120000000", "서울특별시 성동구")],
    }),
    record("b", "2026-10-01", {
      record_regions: [region("1168000000", "서울특별시 강남구"), region("1168000000", "서울특별시 강남구")],
    }),
  ];
  assert.deepEqual(toVisitPoints(records), [
    { latitude: 37.54, longitude: 127.05 },
    { latitude: 37.5, longitude: 127 },
  ]);
});
