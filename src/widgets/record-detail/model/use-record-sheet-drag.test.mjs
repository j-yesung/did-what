import ts from "typescript";

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";

const setup = (enabled = true) => {
  const effects = [];
  const frames = new Map();
  const listeners = new Map();
  let frame = 0;
  let now = 0;
  let dismissed = 0;
  let captured = null;
  const sheet = { style: {} };
  class Target {
    constructor(kind = "body") {
      this.kind = kind;
    }
    closest(selector) {
      if (selector === "[data-record-scroll]") return scroll;
      if (selector === "[data-record-sheet]") return sheet;
      if (selector.includes("button") && this.kind === "control") return this;
      if (selector.includes("[data-record-drag-header]") && this.kind === "header") return this;
      return null;
    }
  }
  const scroll = Object.assign(new Target(), {
    scrollTop: 0,
    addEventListener: (name, listener, options) => listeners.set(name, { listener, options }),
    removeEventListener: (name) => listeners.delete(name),
    setPointerCapture: (id) => {
      captured = id;
    },
    hasPointerCapture: (id) => captured === id,
    releasePointerCapture: () => {
      captured = null;
    },
  });
  const exports = {};
  const source = readFileSync(new URL("./use-record-sheet-drag.ts", import.meta.url), "utf8");
  runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, {
    exports,
    Element: Target,
    performance: { now: () => now },
    matchMedia: () => ({ matches: false }),
    requestAnimationFrame: (callback) => {
      frames.set(++frame, callback);
      return frame;
    },
    cancelAnimationFrame: (id) => frames.delete(id),
    require: () => ({
      useRef: (current) => ({ current }),
      useEffect: (effect) => effects.push(effect),
      useEffectEvent: (handler) => handler,
    }),
  });
  const hook = exports.useRecordSheetDrag(() => dismissed++, enabled);
  hook.scrollRef.current = scroll;
  const cleanups = effects.map((effect) => effect());
  const pointer = (name, x, y, target = new Target("header")) => {
    now += 100;
    let prevented = false;
    hook.handlers[name]({
      clientX: x,
      clientY: y,
      pointerId: 1,
      pointerType: "mouse",
      isPrimary: true,
      button: 0,
      target,
      currentTarget: scroll,
      preventDefault: () => {
        prevented = true;
      },
    });
    return prevented;
  };
  const touch = (type, x, y, options = {}) => {
    now += options.ms ?? 100;
    let prevented = false;
    const point = { identifier: 1, clientX: x, clientY: y };
    listeners.get(type)?.listener({
      type,
      target: new Target(),
      touches: [point],
      changedTouches: [point],
      cancelable: true,
      ...options,
      preventDefault: () => {
        prevented = true;
      },
    });
    return prevented;
  };
  const settle = () => {
    for (let i = 0; i < 250 && frames.size; i++) {
      now += 16;
      const callbacks = [...frames.values()];
      frames.clear();
      callbacks.forEach((callback) => callback(now));
    }
    assert.equal(frames.size, 0);
  };
  return {
    hook,
    scroll,
    sheet,
    Target,
    listeners,
    pointer,
    touch,
    settle,
    dismissed: () => dismissed,
    cleanup: () => cleanups.forEach((cleanup) => cleanup?.()),
  };
};

test("맨 위 본문을 아래로 당기면 네이티브 스크롤을 막고 카드로 닫는다", () => {
  const s = setup();
  assert.equal(s.listeners.get("touchmove").options.passive, false);
  s.touch("touchstart", 0, 0);
  assert.equal(s.touch("touchmove", 0, 110), true);
  assert.match(s.sheet.style.transform, /translateY\(110px\)/);
  s.touch("touchend", 0, 110);
  assert.equal(s.dismissed(), 1);
  s.cleanup();
  assert.equal(s.listeners.size, 0);
});

test("위로 읽는 스크롤과 중간 위치에서의 스크롤은 가로채지 않는다", () => {
  const s = setup();
  s.touch("touchstart", 0, 100);
  assert.equal(s.touch("touchmove", 0, 0), false);
  assert.equal(s.sheet.style.transform, undefined);
  s.scroll.scrollTop = 200;
  assert.equal(s.touch("touchmove", 0, 250), false);
  s.touch("touchend", 0, 250);
  assert.equal(s.dismissed(), 0);
});

test("같은 터치로 맨 위에 도착해도 본문 스크롤로 소비한 거리를 닫기 거리로 세지 않는다", () => {
  const s = setup();
  s.scroll.scrollTop = 120;
  s.touch("touchstart", 0, 0);
  s.touch("touchmove", 0, 120);
  s.scroll.scrollTop = 0;
  s.touch("touchmove", 0, 145);
  assert.match(s.sheet.style.transform, /translateY\(25px\)/);
  s.touch("touchend", 0, 145);
  assert.equal(s.dismissed(), 0);
  s.settle();
  assert.equal(s.sheet.style.transform, "");
});

test("짧고 빠른 아래 스와이프는 닫고, 취소나 가로 제스처는 닫지 않는다", () => {
  const fast = setup();
  fast.touch("touchstart", 0, 0);
  fast.touch("touchmove", 0, 30, { ms: 20 });
  fast.touch("touchend", 0, 30, { ms: 0 });
  assert.equal(fast.dismissed(), 1);
  const horizontal = setup();
  horizontal.touch("touchstart", 0, 0);
  assert.equal(horizontal.touch("touchmove", 200, 110), false);
  horizontal.touch("touchend", 200, 110);
  assert.equal(horizontal.dismissed(), 0);
  const cancelled = setup();
  cancelled.touch("touchstart", 0, 0);
  cancelled.touch("touchmove", 0, 110);
  cancelled.touch("touchcancel", 0, 110);
  cancelled.settle();
  assert.equal(cancelled.dismissed(), 0);
});

test("버튼·입력란·다중 터치와 브라우저가 이미 스크롤 중인 터치는 가로채지 않는다", () => {
  const s = setup();
  s.touch("touchstart", 0, 0, { target: new s.Target("control") });
  assert.equal(s.touch("touchmove", 0, 110), false);
  s.touch("touchstart", 0, 0);
  assert.equal(s.touch("touchmove", 0, 110, { cancelable: false }), false);
  s.touch("touchstart", 0, 0);
  s.touch("touchmove", 0, 110, { touches: [{}, {}] });
  s.touch("touchend", 0, 110);
  assert.equal(s.dismissed(), 0);
});

test("헤더 드래그는 스크롤 중에도 가능하고, 본문 마우스 드래그는 맨 위에서만 가능하다", () => {
  const s = setup();
  const body = new s.Target();
  s.scroll.scrollTop = 100;
  s.pointer("onPointerDown", 0, 0, body);
  assert.equal(s.pointer("onPointerMove", 0, 110, body), false);
  s.pointer("onPointerDown", 0, 0);
  s.pointer("onPointerMove", 0, 110);
  s.pointer("onPointerUp", 0, 110);
  assert.equal(s.dismissed(), 1);
  const top = setup();
  const topBody = new top.Target();
  top.pointer("onPointerDown", 0, 0, topBody);
  top.pointer("onPointerMove", 0, 110, topBody);
  top.pointer("onPointerUp", 0, 110, topBody);
  assert.equal(top.dismissed(), 1);
  assert.equal(setup(false).listeners.size, 0);
});
