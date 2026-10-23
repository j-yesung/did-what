import ts from "typescript";

import { getRecordRegionKey } from "@/entities/record/model/record-region";

import * as locations from "./location-picker.ts";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";

const source = ts.transpileModule(readFileSync(new URL("./use-place-picker-selection.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

const setup = () => {
  const slots = [];
  const effects = [];
  const requests = [];
  const added = [];
  let index = 0;
  const react = {
    useState: (initial) => {
      const slot = index++;
      if (!(slot in slots)) slots[slot] = typeof initial === "function" ? initial() : initial;
      return [
        slots[slot],
        (update) => {
          slots[slot] = typeof update === "function" ? update(slots[slot]) : update;
        },
      ];
    },
    useRef: (current) => {
      const slot = index++;
      return (slots[slot] ??= { current });
    },
    useMemo: (compute) => compute(),
    useEffect: (effect, deps) => {
      const slot = index++;
      if (!slots[slot] || deps.some((dep, i) => !Object.is(dep, slots[slot].deps[i]))) {
        effects.push(() => {
          slots[slot]?.cleanup?.();
          slots[slot] = { deps, cleanup: effect() };
        });
      }
    },
  };
  const props = {
    mode: "places",
    draft: locations.createPlacePickerDraft(),
    onDraftChange: (update) => {
      props.draft = update(props.draft);
    },
    maxSelectionCount: 2,
    onAdd: (places, regions) => {
      added.push({ places, regions });
    },
    regions: [],
    selectedKeys: new Set(),
    savedByProviderId: new Map(),
  };
  const modules = {
    react,
    "@tanstack/react-query": { useMutation: ({ mutationFn }) => ({ mutateAsync: mutationFn }) },
    "@/entities/record": { getRecordRegionKey, MAX_VISITED_PLACES: 20 },
    "@/shared/lib/demo-override": { useDemoOverride: (action) => action },
    "@/shared/lib/toast": { showToast() {} },
    "../api/resolve-record-location": {
      resolveRecordPlace: () => new Promise((resolve, reject) => requests.push({ resolve, reject })),
    },
    "./location-picker": locations,
  };
  const exports = {};
  runInNewContext(source, {
    exports,
    require: (name) => {
      assert.ok(modules[name], `Unexpected import: ${name}`);
      return modules[name];
    },
  });
  return {
    props,
    requests,
    added,
    render: () => {
      index = 0;
      const result = exports.usePlacePickerSelection(props);
      for (const effect of effects.splice(0)) effect();
      return result;
    },
    unmount: () => {
      for (const slot of slots) slot?.cleanup?.();
    },
  };
};

const place = { id: "1", name: "카페", categoryGroupCode: "CE7", categoryName: "카페" };
const searched = { page: 1, query: "카페", scope: null };
const result = (name) => ({ place: { key: "kakao:1", name, reference: {}, region: {} } });
const settle = () => new Promise((resolve) => setImmediate(resolve));

test("해제 후 재선택하면 이전 요청의 응답이 새 선택을 덮어쓰지 않는다", async () => {
  const run = setup();
  run.render().selectPlace(place, searched);
  run.render().selectPlace(place, searched);
  run.render().selectPlace(place, searched);
  assert.equal(run.requests.length, 2);
  run.requests[0].resolve(result("이전 응답"));
  await settle();
  assert.equal(run.props.draft.selectedPlaces.size, 0);
  assert.equal(run.render().pendingPlaceKeys.size, 1);
  run.requests[1].resolve(result("새 응답"));
  await settle();
  assert.equal(run.props.draft.selectedPlaces.get("kakao:1").name, "새 응답");
  assert.equal(run.render().pendingPlaceKeys.size, 0);
});

test("확인 중 추가를 누르면 요청 완료 뒤 한 번만 추가한다", async () => {
  const run = setup();
  run.render().selectPlace(place, searched);
  run.render().addSelection();
  assert.equal(run.render().addQueued, true);
  assert.equal(run.added.length, 0);
  run.requests[0].resolve(result("확인된 장소"));
  await settle();
  assert.equal(run.props.draft.selectedPlaces.size, 1);
  assert.equal(run.render().pendingPlaceKeys.size, 0);
  run.render();
  assert.equal(run.added.length, 1);
  assert.equal(run.added[0].places[0].name, "확인된 장소");
});

test("확인 실패 시 일괄 추가를 멈추고 시트를 닫은 후 응답은 무시한다", async () => {
  const run = setup();
  run.render().selectPlace(place, searched);
  run.render().addSelection();
  run.render();
  run.requests[0].resolve({ error: "다시 선택해 주세요" });
  await settle();
  assert.equal(run.render().selectionError, "다시 선택해 주세요");
  assert.equal(run.added.length, 0);
  run.render().selectPlace(place, searched);
  run.unmount();
  run.requests[1].resolve(result("닫힌 뒤 응답"));
  await settle();
  assert.equal(run.props.draft.selectedPlaces.size, 0);
});

test("지역과 장소 시트는 각자의 선택만 세고 추가한다", () => {
  const run = setup();
  const region = { code: "1156000000", label: "문래" };
  const place = { key: "existing:1", name: "카페" };
  run.props.draft.selectedRegions.set(getRecordRegionKey(region), region);
  run.props.draft.selectedPlaces.set(place.key, place);
  assert.equal(run.render().selectedCount, 1);
  run.render().addSelection();
  assert.deepEqual(Array.from(run.added[0].places), [place]);
  assert.equal(run.added[0].regions.length, 0);

  run.props.mode = "regions";
  assert.equal(run.render().selectedCount, 1);
  run.render().addSelection();
  assert.equal(run.added[1].places.length, 0);
  assert.deepEqual(Array.from(run.added[1].regions), [region]);
});
