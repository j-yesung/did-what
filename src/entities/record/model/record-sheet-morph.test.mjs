import ts from "typescript";

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";

const flush = () => new Promise((resolve) => setImmediate(resolve));

const createScene = () => {
  const animations = [];
  const element = (props = {}) => {
    const own = [];
    return {
      style: {},
      offsetLeft: 0,
      offsetTop: 0,
      offsetWidth: 400,
      offsetHeight: 800,
      getAnimations: () => own,
      animate(keyframes) {
        let finish;
        let reject;
        const animation = {
          keyframes,
          cancelled: false,
          finished: new Promise((resolve, fail) => {
            finish = resolve;
            reject = fail;
          }),
          finish: () => finish(),
          cancel() {
            this.cancelled = true;
            reject(new Error("Animation cancelled"));
          },
        };
        animation.finished.catch(() => {});
        own.push(animation);
        animations.push(animation);
        return animation;
      },
      ...props,
    };
  };
  const header = element({ offsetHeight: 240 });
  const parts = {
    "[data-record-header]": header,
    "[data-record-scroll]": element({ scrollTop: 0 }),
    "[data-record-body]": element(),
    "[data-record-actions]": element(),
  };
  const sheet = element({ querySelector: (selector) => parts[selector] });
  const card = element({
    getBoundingClientRect: () => ({ top: 200, bottom: 310, left: 20, right: 380, height: 110 }),
  });
  const overlay = element();
  const dataset = {};
  const exports = {};
  let cardVisible = true;
  const source = readFileSync(new URL("./record-sheet-morph.ts", import.meta.url), "utf8");
  runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, {
    exports,
    Element: { prototype: { animate() {} } },
    CSS: { escape: (value) => value },
    window: { innerHeight: 800 },
    matchMedia: () => ({ matches: false }),
    getComputedStyle: () => ({ paddingTop: "142", paddingBottom: "18" }),
    document: {
      documentElement: { dataset },
      querySelector: (selector) => {
        if (selector.includes("data-record-card")) return cardVisible ? card : null;
        if (selector.includes("data-record-header")) return header;
        if (selector.includes("bottom-sheet-overlay")) return overlay;
        if (selector.startsWith("body:")) return {};
        return sheet;
      },
    },
  });
  return {
    animations,
    card,
    dataset,
    exports,
    header,
    scroll: parts["[data-record-scroll]"],
    hideCard: () => (cardVisible = false),
  };
};

test("닫기 끝에서 헤더 높이를 유지하고 카드의 아래쪽 경계에 정확히 착지한다", () => {
  for (const scrollTop of [0, 180]) {
    const scene = createScene();
    scene.scroll.scrollTop = scrollTop;
    scene.exports.closeRecordSheetIntoCard("record", () => {});

    const headerAnimation = scene.animations.find((animation) => Array.isArray(animation.keyframes));
    const [from, to] = headerAnimation.keyframes;
    assert.equal(from.height, to.height, "닫는 동안 헤더 높이가 바뀌면 스크롤이 보정될 수 있다");
    assert.equal(to.height, `${scene.header.offsetHeight}px`);

    const movement = scene.animations.at(-1).keyframes.transform.at(-1);
    const offset = Number(movement.match(/translateY\(([-\d.]+)px\)/)[1]);
    const card = scene.card.getBoundingClientRect();
    assert.equal(offset - scrollTop + scene.header.offsetHeight, card.bottom);
    assert.equal(scene.animations[0].keyframes.clipPath.at(-1), "inset(200px 20px 490px 20px round 24px)");
  }
});

test("열기 완료 처리가 진행 중인 닫기 애니메이션을 취소하지 않는다", async () => {
  const scene = createScene();
  scene.exports.openRecordSheetFromCard(scene.card, () => {});
  await flush();
  const opening = [...scene.animations];
  let closed = false;
  scene.exports.closeRecordSheetIntoCard("record", () => (closed = true));
  const closing = scene.animations.slice(opening.length);

  opening.at(-1).finish();
  await flush();
  assert.equal(closed, false);
  assert.equal(scene.dataset.recordMorph, "closing");
  assert.ok(closing.every((animation) => !animation.cancelled));

  closing.at(-1).finish();
  await flush();
  assert.equal(closed, true);
});

test("열기 시작을 기다리는 중 닫으면 뒤늦게 열기 애니메이션을 시작하지 않는다", async () => {
  const scene = createScene();
  scene.exports.openRecordSheetFromCard(scene.card, () => {});
  scene.exports.closeRecordSheetIntoCard("record", () => {});
  const count = scene.animations.length;
  await flush();
  assert.equal(scene.animations.length, count);
  assert.equal(scene.dataset.recordMorph, "closing");
});

test("새 실행이 없으면 열기 완료 후 자신의 애니메이션과 상태를 정리한다", async () => {
  const scene = createScene();
  scene.exports.openRecordSheetFromCard(scene.card, () => {});
  await flush();
  scene.animations.at(-1).finish();
  await flush();
  assert.ok(scene.animations.every((animation) => animation.cancelled));
  assert.equal(scene.dataset.recordMorph, undefined);
});

test("돌아갈 카드가 없으면 대기 중인 열기를 무효화하고 바로 닫는다", async () => {
  const scene = createScene();
  scene.exports.openRecordSheetFromCard(scene.card, () => {});
  scene.hideCard();
  let closed = false;
  scene.exports.closeRecordSheetIntoCard("record", () => (closed = true));
  await flush();
  assert.equal(closed, true);
  assert.equal(scene.animations.length, 0);
  assert.equal(scene.dataset.recordMorph, undefined);
});
