import { getRecordViewHref, parseRecordView } from "./record-view-preference.ts";
import assert from "node:assert/strict";

assert.equal(parseRecordView("calendar"), "calendar");
assert.equal(parseRecordView("list"), "list");
assert.equal(parseRecordView("map"), null);
assert.equal(parseRecordView(null), null);

const search = "view=calendar&month=2026-08&date=2026-08-15&category=travel&q=커피&sort=oldest&from=2026-01-01";
const listHref = getRecordViewHref("list", search);
const listParams = new URLSearchParams(listHref.split("?")[1]);
assert.equal(listParams.get("view"), "list");
assert.equal(listParams.get("month"), "2026-08");
assert.equal(listParams.get("date"), "2026-08-15");
assert.equal(listParams.get("q"), "커피");
assert.equal(listParams.get("category"), "travel");
assert.equal(listParams.get("sort"), "oldest");
assert.equal(listParams.get("from"), "2026-01-01");
assert.equal(
  new URLSearchParams(getRecordViewHref("calendar", listParams.toString()).split("?")[1]).get("date"),
  "2026-08-15",
);
