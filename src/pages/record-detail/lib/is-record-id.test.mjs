import { isRecordId } from "./is-record-id.ts";
import assert from "node:assert/strict";

assert.equal(isRecordId("0198a393-4df4-4aed-894f-12b13a075e71"), true);
assert.equal(isRecordId("not-a-record-id"), false);
assert.equal(isRecordId("0198a393-4df4-4aed-094f-12b13a075e71"), false);
