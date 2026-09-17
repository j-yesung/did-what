import {
  formatCommentTime,
  normalizeCommentBody,
  reduceOptimisticComments,
} from "@/entities/record-comment/model/record-comment";

import assert from "node:assert/strict";
import test from "node:test";

const COMMENT = {
  author: { name: "예성" },
  author_member_id: "member-a",
  body: "기존 댓글",
  created_at: "2026-09-14T06:00:00+00:00",
  id: "comment-a",
  record_id: "record-a",
};

test("댓글 시간은 최근에는 상대 시간, 일주일 뒤에는 날짜로 표시한다", () => {
  const now = new Date("2026-09-14T12:00:00+09:00");

  assert.equal(formatCommentTime("2026-09-14T11:59:30+09:00", now), "방금 전");
  assert.equal(formatCommentTime("2026-09-14T11:30:00+09:00", now), "30분 전");
  assert.equal(formatCommentTime("2026-09-14T09:00:00+09:00", now), "3시간 전");
  assert.equal(formatCommentTime("2026-09-12T12:00:00+09:00", now), "2일 전");
  assert.equal(formatCommentTime("2026-09-07T11:00:00+09:00", now), "9월 7일 오전 11:00");
  assert.equal(formatCommentTime("2026-09-06T23:00:00+09:00", now), "9월 6일 오후 11:00");
});

test("댓글 본문은 공백을 정리하고 Unicode 글자 수를 검증한다", () => {
  assert.equal(normalizeCommentBody("  좋은 추억이야 😊  "), "좋은 추억이야 😊");
  assert.equal(normalizeCommentBody("   "), null);
  assert.equal(normalizeCommentBody("😊".repeat(1001)), null);
});

test("낙관적 댓글은 작성과 삭제를 즉시 반영한다", () => {
  const created = { ...COMMENT, id: "comment-b", pending: true };
  assert.deepEqual(reduceOptimisticComments([COMMENT], { comment: created, type: "create" }), [created, COMMENT]);
  assert.deepEqual(reduceOptimisticComments([COMMENT], { id: COMMENT.id, type: "delete" }), []);
});
