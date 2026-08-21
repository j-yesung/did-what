import { toRecentRegions } from "./location-picker.ts";
import assert from "node:assert/strict";
import { test } from "node:test";

const row = (code, label, name) => ({
  region_code: code,
  region_label: label,
  region_latitude: 37.5,
  region_longitude: 127,
  region_name: name,
});

test("최근 순서를 유지하면서 같은 지역은 한 번만 남는다", () => {
  const regions = toRecentRegions([
    row("1144012300", "망원", "서울 마포구 망원동"),
    row("1168010100", "역삼", "서울 강남구 역삼동"),
    row("1144012300", "홍대", "서울 마포구 망원동"),
  ]);

  assert.deepEqual(
    regions.map((region) => region.code),
    ["1144012300", "1168010100"],
  );
  // 중복은 뒤엣것이 아니라 먼저 만난 기록의 이름표를 쓴다.
  assert.equal(regions[0].label, "망원");
});

test("짧은 이름은 전체 이름의 마지막 마디에서 얻는다", () => {
  const [region] = toRecentRegions([row("1144012300", "망원", "서울 마포구 망원동")]);

  assert.equal(region.name, "망원동");
  assert.equal(region.fullName, "서울 마포구 망원동");
});

test("마디가 하나뿐이면 전체 이름을 그대로 쓴다", () => {
  const [region] = toRecentRegions([row("1100000000", "서울", "서울")]);

  assert.equal(region.name, "서울");
});

test("limit까지만 돌려준다", () => {
  const rows = Array.from({ length: 10 }, (_, index) => row(`${index}`.padStart(10, "0"), `${index}`, `지역 ${index}`));

  assert.equal(toRecentRegions(rows).length, 6);
  assert.equal(toRecentRegions(rows, 2).length, 2);
});

test("지역 코드가 비어 있는 기록은 건너뛴다", () => {
  const regions = toRecentRegions([row("", "없음", "알 수 없음"), row("1144012300", "망원", "서울 마포구 망원동")]);

  assert.deepEqual(
    regions.map((region) => region.code),
    ["1144012300"],
  );
});
