import { isUuid } from "./is-uuid.ts";
import assert from "node:assert/strict";

assert.equal(isUuid("0198a393-4df4-4aed-894f-12b13a075e71"), true);
assert.equal(isUuid("not-a-record-id"), false);
assert.equal(isUuid("0198a393-4df4-4aed-094f-12b13a075e71"), false);
