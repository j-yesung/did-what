import { waitForPressRelease } from "@/shared/lib/navigation/wait-for-press-release";

import assert from "node:assert/strict";
import test from "node:test";

test("누름 복귀와 음영 트랜지션을 바로 끝내고 페인트 프레임을 넘긴다", async (t) => {
  const frames = [];
  class Transition {
    constructor(property) {
      this.transitionProperty = property;
      this.finished = new Promise(() => {});
      this.finishedCalls = 0;
    }
    finish() {
      this.finishedCalls += 1;
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

  for (const mode of ["motion", "no-motion"]) {
    const scale = new Transition("scale");
    const overlay = new Transition("opacity");
    const unrelated = new Transition("color");
    let queried = false;
    let navigable = false;
    const element = {
      getAnimations(options) {
        queried = true;
        assert.deepEqual(options, { subtree: true });
        return mode === "no-motion" ? [] : [scale, overlay, { finished: new Promise(() => {}) }, unrelated];
      },
    };
    const waiting = waitForPressRelease(element).then(() => {
      navigable = true;
    });
    assert.equal(queried, false);
    await frame();
    assert.equal(queried, true);
    if (mode === "no-motion") {
      await waiting;
      assert.equal(navigable, true);
      continue;
    }
    assert.equal(scale.finishedCalls, 1, "누름 복귀를 기다리지 않고 바로 끝낸다");
    assert.equal(overlay.finishedCalls, 1, "음영 복귀도 바로 끝낸다");
    assert.equal(unrelated.finishedCalls, 0, "무관한 트랜지션은 건드리지 않는다");
    assert.equal(navigable, false);
    await frame();
    assert.equal(navigable, false);
    await frame();
    await waiting;
    assert.equal(navigable, true);
  }
});

test("커진 조상의 누름 스프링을 원래 크기로 고정하고 바로 이동한 뒤 스프링이 돌아오면 푼다", async (t) => {
  const frames = [];
  const originalFrame = globalThis.requestAnimationFrame;
  globalThis.requestAnimationFrame = (callback) => frames.push(callback);
  t.after(() => {
    if (originalFrame) globalThis.requestAnimationFrame = originalFrame;
    else delete globalThis.requestAnimationFrame;
  });
  const flush = async () => {
    assert.ok(frames.length > 0);
    for (const callback of frames.splice(0)) callback();
    await new Promise((resolve) => setImmediate(resolve));
  };

  const attributes = new Set();
  const group = {
    isConnected: true,
    parentElement: null,
    removeAttribute: (name) => attributes.delete(name),
    setAttribute: (name) => attributes.add(name),
    style: { scale: "1.17 1.17" },
  };
  const link = { getAnimations: () => [], parentElement: group, style: { scale: "" } };
  let navigable = false;
  const waiting = waitForPressRelease(link).then(() => {
    navigable = true;
  });

  await flush();
  assert.ok(attributes.has("data-press-settled"));
  assert.equal(navigable, false);
  await flush();
  await flush();
  await waiting;
  assert.equal(navigable, true, "스프링이 돌아오길 기다리지 않고 두 프레임 뒤 이동한다");
  assert.ok(attributes.has("data-press-settled"));
  group.style.scale = "1 1";
  await flush();
  assert.equal(attributes.has("data-press-settled"), false);
});
