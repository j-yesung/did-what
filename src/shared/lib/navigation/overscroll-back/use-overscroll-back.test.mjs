import ts from "typescript";

import * as progress from "./overscroll-back.ts";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";

test("단계별 인디케이터와 추가 당김을 지원하고 손을 뗀 뒤 완료 애니메이션과 함께 이동한다", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  let cleanup;
  let reducedMotion = false;
  let animations = 0;
  let nextAnimationFrame = 0;
  const animationFrames = new Map();
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
    requestAnimationFrame: (callback) => {
      const id = ++nextAnimationFrame;
      animationFrames.set(id, callback);
      return id;
    },
    cancelAnimationFrame: (id) => animationFrames.delete(id),
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
  const { onTouchStart, onTouchMove: moveTouch, onTouchCancel } = hook.touchHandlers;
  const flushAnimationFrame = () => {
    const callbacks = [...animationFrames.values()];
    animationFrames.clear();
    for (const callback of callbacks) callback();
  };
  const onTouchMove = (event) => {
    moveTouch(event);
    flushAnimationFrame();
  };
  const onTouchEnd = () => hook.touchHandlers.onTouchEnd({ touches: [] });

  onTouchStart(touch(500));
  onTouchMove(touch(464));
  assert.equal(hook.indicatorRef.current.style.opacity, "1");
  assert.equal(hook.progressRingRef.current.style.opacity, "0");
  assert.equal(hook.iconRef.current.style.transform, "rotate(0deg)");
  moveTouch(touch(430));
  moveTouch(touch(410));
  assert.equal(animationFrames.size, 1);
  flushAnimationFrame();
  assert.equal(hook.progressRingRef.current.style.opacity, "1");
  assert.equal(hook.indicatorRef.current.dataset.ready, "false");
  assert.notEqual(hook.iconRef.current.style.transform, "rotate(0deg)");
  onTouchEnd();
  t.mock.timers.tick(1000);
  assert.equal(destinations.length, 0);
  assert.equal(animations, 0);

  onTouchStart(touch(500));
  onTouchMove(touch(320));
  assert.equal(hook.indicatorRef.current.dataset.ready, "true");
  // 100%에 닿는 순간이 아니라 손을 뗄 때 재생해야 대기 시간과 애니메이션이 맞아떨어진다.
  assert.equal(animations, 0);
  t.mock.timers.tick(2000);
  assert.equal(destinations.length, 0);
  const completedPosition = hook.indicatorRef.current.style.transform;
  const completedContentPosition = hook.containerRef.current.style.transform;
  onTouchMove(touch(300));
  assert.notEqual(hook.indicatorRef.current.style.transform, completedPosition);
  assert.notEqual(hook.containerRef.current.style.transform, completedContentPosition);
  assert.equal(hook.indicatorRef.current.dataset.dragging, "true");
  assert.equal(hook.progressRingRef.current.style.strokeDashoffset, "0");
  assert.equal(hook.iconRef.current.style.transform, "rotate(90deg)");
  onTouchEnd();
  assert.equal(animations, 1);
  onTouchEnd();
  t.mock.timers.tick(progress.OVERSCROLL_BACK_NAVIGATION_DELAY - 1);
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
  assert.ok(Math.abs(Number(hook.progressRingRef.current.style.strokeDashoffset) - 10 / 13) < 1e-9);
  t.mock.timers.tick(1000);
  assert.equal(destinations.length, 1);

  // 다시 채워도 손을 뗄 때부터 완료 대기 시간을 다시 센다.
  onTouchMove(touch(250));
  t.mock.timers.tick(progress.OVERSCROLL_BACK_NAVIGATION_DELAY - 1);
  assert.equal(destinations.length, 1);
  onTouchMove(touch(240));
  t.mock.timers.tick(1);
  assert.equal(destinations.length, 1);
  onTouchEnd();
  t.mock.timers.tick(progress.OVERSCROLL_BACK_NAVIGATION_DELAY - 1);
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
  assert.ok(Math.abs(Number(hook.progressRingRef.current.style.strokeDashoffset) - 10 / 13) < 1e-9);
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

  reducedMotion = true;
  onTouchStart(touch(500));
  onTouchMove(touch(410));
  assert.equal(hook.containerRef.current.style.transform, "translate3d(0, 0px, 0)");
  assert.equal(hook.indicatorRef.current.style.transform, "translate3d(0, 0, 0)");
  assert.equal(hook.iconRef.current.style.transform, "rotate(0deg)");
  onTouchMove(touch(320));
  onTouchEnd();
  assert.equal(animations, 3);
  t.mock.timers.tick(1000);
  assert.equal(destinations.length, 3);

  onTouchStart(touch(500));
  onTouchMove(touch(320));
  onTouchEnd();
  cleanup();
  t.mock.timers.tick(1000);
  assert.equal(destinations.length, 3);
});
