import { formatRecordDate, formatRecordPeriod } from "./format-date.ts";
import assert from "node:assert/strict";

// date 컬럼은 KST 자정으로 읽어야 날짜가 밀리지 않는다.
assert.equal(formatRecordDate("2026-08-13"), "2026년 8월 13일");
assert.equal(formatRecordDate("2026-01-01"), "2026년 1월 1일");
assert.equal(formatRecordPeriod("2026-08-01", "2026-08-03"), "2026년 8월 1일 ~ 2026년 8월 3일");
assert.equal(formatRecordPeriod("2026-08-01", "2026-08-01"), "2026년 8월 1일");
