import { waitForPressRelease } from "@/shared/lib/navigation/wait-for-press-release";

import assert from "node:assert/strict";
import test from "node:test";

test("누름 복귀와 음영의 완료 후 페인트 프레임을 넘긴다", async (t) => {
  const frames = [];
  class Transition {
    constructor(property, finished) {
      this.transitionProperty = property;
      this.finished = finished;
    }
  }
  const originalFrame = globalThis.requestAnimationFrame;
  const originalTransition = globalThis.CSSTransition;
  globalThis.requestAnimationFrame = (callback) => frames.push(callback);
  globalThis.CSSTransition = Transition;
  t.after(() => {
    if (originalFrame) globalThis.requestAnimationFrame = originalFrame;
    else delete globalThis.requestAnimationFrame;
    if (originalTransition) globalThis.CSSTransition = originalTransition;
    else delete globalThis.CSSTransition;
  });
  const frame = async () => {
    assert.ok(frames.length > 0);
    frames.shift()();
    await new Promise((resolve) => setImmediate(resolve));
  };

  for (const mode of ["finish", "cancel", "no-motion"]) {
    const scale = Promise.withResolvers();
    const overlay = Promise.withResolvers();
    let queried = false;
    let navigable = false;
    const element = {
      getAnimations(options) {
        queried = true;
        assert.deepEqual(options, { subtree: true });
        return mode === "no-motion"
          ? []
          : [
              new Transition("scale", scale.promise),
              new Transition("opacity", overlay.promise),
              // 무관한 자식의 무한 애니메이션은 이동을 막지 않는다.
              { finished: new Promise(() => {}) },
              new Transition("color", new Promise(() => {})),
            ];
      },
    };
    const waiting = waitForPressRelease(element).then(() => {
      navigable = true;
    });
    assert.equal(queried, false);
    await frame();
    assert.equal(queried, true);
    if (mode !== "no-motion") {
      scale.resolve();
      await new Promise((resolve) => setImmediate(resolve));
      assert.equal(frames.length, 0, "음영 복귀도 기다린다");
      if (mode === "cancel") overlay.reject(new Error("transition cancelled"));
      else overlay.resolve();
      await new Promise((resolve) => setImmediate(resolve));
    }
    if (mode === "no-motion") {
      await waiting;
      assert.equal(navigable, true);
      continue;
    }
    assert.equal(navigable, false);
    await frame();
    assert.equal(navigable, false);
    await frame();
    await waiting;
    assert.equal(navigable, true);
  }
});
