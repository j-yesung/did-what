import { fetchRecordPage } from "./client-queries.ts";
import assert from "node:assert/strict";
import { mock, test } from "node:test";

test("카테고리 필터는 배열 포함 조건으로, 미분류는 빈 배열 조건으로 조회한다", async () => {
  const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const previousKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://category-test.invalid";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "category-test-key";
  const requests = [];
  const fetch = mock.method(globalThis, "fetch", async (input) => {
    requests.push(new URL(typeof input === "string" ? input : input.url));
    return new Response("[]", { status: 200, headers: { "Content-Type": "application/json" } });
  });
  const filters = { from: "", to: "", query: "", sort: "recent" };
  try {
    await fetchRecordPage({ ...filters, category: "date" }, null);
    await fetchRecordPage({ ...filters, category: "uncategorized" }, null);
    await fetchRecordPage({ ...filters, category: "" }, null);
    assert.equal(requests[0].searchParams.get("category"), "cs.{date}");
    assert.equal(requests[1].searchParams.get("category"), "eq.{}");
    assert.equal(requests[2].searchParams.has("category"), false);
  } finally {
    fetch.mock.restore();
    if (previousUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl;
    if (previousKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    else process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = previousKey;
  }
});
