import { createElement, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { useJourneySheet } from "@/pages/journey/model/use-journey-sheet";

import assert from "node:assert/strict";
import { test } from "node:test";

const checkNavigation = (steps) => {
  function Probe() {
    const sheet = useJourneySheet(true);
    const [step, setStep] = useState(0);
    const [expected, action] = steps[step];
    assert.equal(sheet.kind, expected);
    if (action) {
      action(sheet);
      setStep(step + 1);
    }
    return sheet.content;
  }

  assert.equal(renderToStaticMarkup(createElement(Probe)), steps.at(-1)[0]);
};

test("지역의 기록 목록에서 뒤로 가면 전체 지역 목록으로 돌아간다", () => {
  checkNavigation([
    [null, (sheet) => sheet.show("regions")],
    ["regions", (sheet) => sheet.show("records")],
    ["records", (sheet) => sheet.back()],
    ["regions"],
  ]);
});

test("겹친 지역에서 들어온 기록 목록은 해당 지역 선택 목록으로 돌아간다", () => {
  const choices = [{ code: "11", name: "서울", count: 1, latitude: 37.56, longitude: 126.97 }];
  checkNavigation([
    [null, (sheet) => sheet.showChoices(choices)],
    ["choices", (sheet) => sheet.show("records")],
    [
      "records",
      (sheet) => {
        assert.deepEqual(sheet.choices, choices);
        sheet.back();
      },
    ],
    ["choices"],
  ]);
});

test("시트를 닫은 뒤 직접 기록 목록을 열면 뒤로 가기는 전체 지역 목록으로 향한다", () => {
  checkNavigation([
    [null, (sheet) => sheet.showChoices([])],
    ["choices", (sheet) => sheet.show("records")],
    ["records", (sheet) => sheet.show(null)],
    [null, (sheet) => sheet.show("records")],
    ["records", (sheet) => sheet.back()],
    ["regions"],
  ]);
});
