import {
  getRecordCommentCursorFilter,
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
  updated_at: "2026-09-14T06:00:00+00:00",
};

test("댓글 본문은 공백을 정리하고 Unicode 글자 수를 검증한다", () => {
  assert.equal(normalizeCommentBody("  좋은 추억이야 😊  "), "좋은 추억이야 😊");
  assert.equal(normalizeCommentBody("   "), null);
  assert.equal(normalizeCommentBody("😊".repeat(1001)), null);
});

test("낙관적 댓글은 작성, 수정, 삭제를 즉시 반영한다", () => {
  const created = { ...COMMENT, id: "comment-b", pending: true };
  assert.deepEqual(reduceOptimisticComments([COMMENT], { comment: created, type: "create" }), [created, COMMENT]);
  assert.equal(
    reduceOptimisticComments([COMMENT], { body: "수정 댓글", id: COMMENT.id, type: "update" })[0].body,
    "수정 댓글",
  );
  assert.deepEqual(reduceOptimisticComments([COMMENT], { id: COMMENT.id, type: "delete" }), []);
});

test("같은 생성 시각의 댓글도 id를 기준으로 이어서 조회한다", () => {
  assert.equal(
    getRecordCommentCursorFilter({ createdAt: "2026-09-14T06:00:00+00:00", id: "comment-a" }),
    "created_at.lt.2026-09-14T06:00:00+00:00,and(created_at.eq.2026-09-14T06:00:00+00:00,id.lt.comment-a)",
  );
});
