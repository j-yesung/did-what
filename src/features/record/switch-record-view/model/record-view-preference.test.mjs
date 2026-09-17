import { parseRecordView } from "./record-view-preference.ts";
import assert from "node:assert/strict";

assert.equal(parseRecordView("calendar"), "calendar");
assert.equal(parseRecordView("list"), "list");
assert.equal(parseRecordView("map"), null);
assert.equal(parseRecordView(null), null);
