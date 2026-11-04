import { jsx, jsxs } from "react/jsx-runtime";
import ts from "typescript";

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";

const setup = () => {
  const exports = {};
  const prefetches = [];
  const morphs = [];
  const RecordDetailLink = () => null;
  const modules = {
    "react/jsx-runtime": { jsx, jsxs },
    "@tanstack/react-query": { useQueryClient: () => "query-client" },
    "@/shared/lib/interaction": { PRESS_FEEDBACK: "press-feedback" },
    "@/shared/lib/utils": { cn: (...classes) => classes.join(" ") },
    "@/shared/ui/button": { Button: () => null },
    "../api/prefetch-record-detail": {
      prefetchRecordDetail: (client, id) => prefetches.push({ client, id }),
    },
    "../model/category": { normalizeRecordCategory: () => "daily", RECORD_CATEGORY_BADGE: { daily: "daily" } },
    "../model/record-sheet-morph": { openRecordSheetFromCard: (card, open) => morphs.push({ card, open }) },
    "./record-card-content": { RECORD_CARD_BUTTON_CLASS: "record-card", RecordCardContent: () => null },
    "./record-detail-link": { RecordDetailLink },
  };
  const source = readFileSync(new URL("./record-card.tsx", import.meta.url), "utf8");
  runInNewContext(
    ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    }).outputText,
    {
      exports,
      require: (name) => {
        assert.ok(modules[name], `Unexpected import: ${name}`);
        return modules[name];
      },
    },
  );
  return { RecordCard: exports.RecordCard, RecordDetailLink, prefetches, morphs };
};

const record = { id: "record-1", activity: "산책", category: ["daily"] };

test("목록에서는 카드 출처와 복귀 위치를 가진 상세 링크를 유지한다", () => {
  const { RecordCard, RecordDetailLink } = setup();
  const button = RecordCard({ record }).props.children;
  assert.equal(button.props.nativeButton, false);
  assert.equal(button.props.render.type, RecordDetailLink);
  assert.equal(button.props.render.props.href, "/records/record-1?from=card");
  assert.equal(button.props.render.props["data-record-card"], record.id);
  assert.equal(button.props.render.props.morph, true);
});

test("미니지도에서는 누른 카드에서 확장을 시작하고 지도 쪽 상세 열기를 호출한다", () => {
  const { RecordCard, morphs, prefetches } = setup();
  const opened = [];
  const button = RecordCard({ record, onOpen: (id) => opened.push(id) }).props.children;
  assert.equal(button.props.nativeButton, true);
  assert.equal(button.props.render.type, "button");
  assert.equal(button.props.render.props["data-record-card"], record.id);
  button.props.onFocus();
  assert.deepEqual(prefetches, [{ client: "query-client", id: record.id }]);

  const card = {};
  button.props.render.props.onClick({ currentTarget: card });
  assert.equal(morphs[0].card, card);
  assert.deepEqual(opened, []);
  morphs[0].open();
  assert.deepEqual(opened, [record.id]);
});
