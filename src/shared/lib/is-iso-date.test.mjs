import { isIsoDate } from "./is-iso-date.ts";
import assert from "node:assert/strict";

assert.equal(isIsoDate("2026-08-13"), true);
assert.equal(isIsoDate("2026-02-29"), false);
assert.equal(isIsoDate("2026-13-01"), false);
assert.equal(isIsoDate("2026-8-13"), false);
assert.equal(isIsoDate(""), false);
