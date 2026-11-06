import { jsx, jsxs } from "react/jsx-runtime";
import ts from "typescript";

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";

const setup = () => {
  const exports = {};
  const prefetches = [];
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
  return { RecordCard: exports.RecordCard, RecordDetailLink, prefetches };
};

const record = { id: "record-1", activity: "산책", category: ["daily"] };

test("목록에서는 상세 링크로 시트를 연다", () => {
  const { RecordCard, RecordDetailLink } = setup();
  const button = RecordCard({ record }).props.children;
  assert.equal(button.props.nativeButton, false);
  assert.equal(button.props.render.type, RecordDetailLink);
  assert.equal(button.props.render.props.href, "/records/record-1");
});

test("미니지도에서는 카드를 눌러 지도 쪽 상세 열기를 바로 호출한다", () => {
  const { RecordCard, prefetches } = setup();
  const opened = [];
  const button = RecordCard({ record, onOpen: (id) => opened.push(id) }).props.children;
  assert.equal(button.props.nativeButton, true);
  assert.equal(button.props.render.type, "button");
  button.props.onFocus();
  assert.deepEqual(prefetches, [{ client: "query-client", id: record.id }]);

  button.props.render.props.onClick();
  assert.deepEqual(opened, [record.id]);
});
