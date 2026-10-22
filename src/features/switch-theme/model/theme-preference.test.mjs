import { getThemeColors, parseTheme } from "./theme.ts";
import { applyTheme, getAppliedTheme, saveTheme } from "./theme-preference.ts";
import assert from "node:assert/strict";
import test from "node:test";

const setupDocument = (t) => {
  const classes = new Set(["light", "unrelated"]);
  const previous = Object.getOwnPropertyDescriptor(globalThis, "document");
  const document = {
    cookie: "",
    documentElement: {
      classList: {
        add: (value) => classes.add(value),
        contains: (value) => classes.has(value),
        remove: (...values) => values.forEach((value) => classes.delete(value)),
      },
    },
  };
  Object.defineProperty(globalThis, "document", { configurable: true, value: document });
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, "document", previous);
    else delete globalThis.document;
  });
  return { classes, document };
};

test("화면 모드를 즉시 전환하고 시스템 모드에서 명시 클래스를 제거한다", (t) => {
  const { classes } = setupDocument(t);
  for (const theme of ["dark", "light", "system"]) {
    applyTheme(theme);
    assert.equal(getAppliedTheme(), theme);
    assert.ok(classes.has("unrelated"));
    assert.equal(classes.has("light"), theme === "light");
    assert.equal(classes.has("dark"), theme === "dark");
  }
});

test("명시 모드는 시스템 설정과 무관하게 같은 색을, 시스템 모드는 각각 다른 색을 쓴다", () => {
  assert.deepEqual(
    getThemeColors("dark").map(({ color }) => color),
    ["#191f28", "#191f28"],
  );
  assert.deepEqual(
    getThemeColors("light").map(({ color }) => color),
    ["#f9fafb", "#f9fafb"],
  );
  assert.deepEqual(
    getThemeColors("system").map(({ color }) => color),
    ["#f9fafb", "#191f28"],
  );
  assert.equal(parseTheme("unknown"), "system");
});

test("테마 쿠키를 전체 경로에 1년간 저장한다", (t) => {
  const { document } = setupDocument(t);
  saveTheme("dark");
  assert.equal(document.cookie, "theme=dark; path=/; max-age=31536000; samesite=lax");
});
