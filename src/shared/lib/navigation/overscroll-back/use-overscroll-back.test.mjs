import ts from "typescript";

import * as progress from "./overscroll-back.ts";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";

test("100%에서 손을 뗀 뒤 아이콘 애니메이션과 함께 이동하며 되돌리기와 취소를 지원한다", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  let cleanup;
  let reducedMotion = false;
  let animations = 0;
  const destinations = [];
  const exports = {};
  const modules = {
    react: {
      useRef: (current) => ({ current }),
      useEffect: (effect) => {
        cleanup = effect();
      },
    },
    "@/shared/lib/navigation/use-go-back": { useGoBack: () => (href) => destinations.push(href) },
    "@/shared/lib/navigation/use-scroll-restoration": { useScrollRestoration() {} },
    "./overscroll-back": progress,
  };
  const source = readFileSync(new URL("./use-overscroll-back.ts", import.meta.url), "utf8");
  runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, {
    exports,
    require: (name) => {
      assert.ok(modules[name], `Unexpected import: ${name}`);
      return modules[name];
    },
    setTimeout,
    clearTimeout,
    window: { matchMedia: () => ({ matches: reducedMotion }) },
  });
  const hook = exports.useOverscrollBack("/records");
  const element = () => ({ dataset: {}, style: {} });
  hook.containerRef.current = { ...element(), scrollTop: 500, scrollHeight: 1000, clientHeight: 500 };
  hook.indicatorRef.current = element();
  hook.iconRef.current = element();
  hook.progressRingRef.current = element();
  hook.completeIconRef.current = { startAnimation: () => animations++, stopAnimation() {} };
  const touch = (y) => ({ touches: [{ clientX: 100, clientY: y }] });
  const { onTouchStart, onTouchMove, onTouchCancel } = hook.touchHandlers;
  const onTouchEnd = () => hook.touchHandlers.onTouchEnd({ touches: [] });

  onTouchStart(touch(500));
  onTouchMove(touch(410));
  onTouchEnd();
  t.mock.timers.tick(1000);
  assert.equal(destinations.length, 0);
  assert.equal(animations, 0);

  onTouchStart(touch(500));
  onTouchMove(touch(320));
  assert.equal(hook.indicatorRef.current.dataset.ready, "true");
  assert.equal(animations, 0);
  t.mock.timers.tick(2000);
  assert.equal(destinations.length, 0);
  onTouchMove(touch(300));
  assert.equal(animations, 0);
  onTouchEnd();
  assert.equal(animations, 1);
  onTouchEnd();
  t.mock.timers.tick(549);
  assert.equal(destinations.length, 0);
  assert.equal(hook.indicatorRef.current.dataset.ready, "true");
  t.mock.timers.tick(1);
  assert.deepEqual(destinations, ["/records"]);
  assert.equal(hook.indicatorRef.current.dataset.ready, "false");

  onTouchStart(touch(500));
  onTouchMove(touch(250));
  t.mock.timers.tick(600);
  onTouchMove(touch(340));
  assert.equal(hook.indicatorRef.current.dataset.ready, "false");
  assert.equal(hook.progressRingRef.current.style.strokeDashoffset, "0.5");
  t.mock.timers.tick(1000);
  assert.equal(destinations.length, 1);

  // 다시 채워도 손을 뗄 때부터 새로운 0.55초를 기다린다.
  onTouchMove(touch(250));
  t.mock.timers.tick(549);
  assert.equal(destinations.length, 1);
  onTouchMove(touch(240));
  t.mock.timers.tick(1);
  assert.equal(destinations.length, 1);
  onTouchEnd();
  t.mock.timers.tick(549);
  assert.equal(destinations.length, 1);
  t.mock.timers.tick(1);
  assert.equal(destinations.length, 2);

  // 손을 뗐다가 다시 반대로 움직여도 완료 상태에서 이어서 줄어든다.
  onTouchStart(touch(500));
  onTouchMove(touch(320));
  onTouchEnd();
  onTouchStart(touch(400));
  t.mock.timers.tick(1000);
  assert.equal(destinations.length, 2);
  onTouchMove(touch(490));
  assert.equal(hook.progressRingRef.current.style.strokeDashoffset, "0.5");
  onTouchEnd();
  t.mock.timers.tick(1000);
  assert.equal(destinations.length, 2);

  onTouchStart(touch(500));
  onTouchMove(touch(320));
  onTouchCancel();
  onTouchEnd();
  t.mock.timers.tick(1000);
  assert.equal(destinations.length, 2);
  assert.equal(hook.indicatorRef.current.dataset.ready, "false");

  const animationsBeforeReducedMotion = animations;
  reducedMotion = true;
  onTouchStart(touch(500));
  onTouchMove(touch(320));
  onTouchEnd();
  t.mock.timers.tick(1000);
  assert.equal(destinations.length, 3);
  assert.equal(animations, animationsBeforeReducedMotion);

  onTouchStart(touch(500));
  onTouchMove(touch(320));
  onTouchEnd();
  cleanup();
  t.mock.timers.tick(1000);
  assert.equal(destinations.length, 3);
});
