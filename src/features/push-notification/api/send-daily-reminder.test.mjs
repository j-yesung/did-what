import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

import assert from "node:assert/strict";
import { test } from "node:test";

const keys = webpush.generateVAPIDKeys();
process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = keys.publicKey;
process.env.VAPID_PRIVATE_KEY = keys.privateKey;
const { sendDailyReminder } = await import("./send-daily-reminder.ts");
const { sendRecordPush } = await import("./send-member-push.ts");

const createDatabase = (count = 1, failRequest = () => false) => {
  const subscriptions = Array.from({ length: count }, (_, index) => ({
    id: String(index + 1).padStart(4, "0"),
    endpoint: `https://push.example/${index + 1}`,
    auth_key: "auth",
    p256dh: "key",
    owner_id: "owner",
    member_id: index === 0 ? "sender" : "recipient",
    account_members: { is_active: index !== 1, name: index === 0 ? "예성" : "민지" },
  }));
  const deliveries = new Set();
  const queries = [];
  let unavailable = false;
  const supabase = createClient("https://supabase.example", "test-key", {
    auth: { persistSession: false },
    global: {
      fetch: async (input, options) => {
        const url = new URL(String(input));
        queries.push(url);
        if (unavailable || failRequest(url, options)) {
          return Response.json({ message: "database unavailable" }, { status: 500 });
        }
        const params = url.searchParams;
        const table = url.pathname.split("/").at(-1);
        let result = [];
        if (table === "push_subscriptions") {
          if (options.method === "DELETE") {
            const index = subscriptions.findIndex((item) => `eq.${item.id}` === params.get("id"));
            if (index >= 0) subscriptions.splice(index, 1);
          } else {
            result = subscriptions.filter((item) => item.account_members.is_active);
            if (params.has("id")) result = result.filter((item) => item.id > params.get("id").slice(3));
            if (params.has("member_id"))
              result = result.filter((item) => `neq.${item.member_id}` !== params.get("member_id"));
            result = result.slice(0, Number(params.get("limit") ?? 1000));
          }
        } else if (options.method === "POST") {
          const row = JSON.parse(options.body);
          const key = `${row.reminder_date}:${row.subscription_id}`;
          if (!deliveries.has(key)) {
            deliveries.add(key);
            result = [{ subscription_id: row.subscription_id }];
          }
        } else if (params.has("subscription_id")) {
          deliveries.delete(`${params.get("reminder_date").slice(3)}:${params.get("subscription_id").slice(3)}`);
        }
        return Response.json(result);
      },
    },
  });
  return {
    supabase,
    subscriptions,
    deliveries,
    queries,
    fail: () => {
      unavailable = true;
    },
  };
};

test("활성 구독을 모두 순회하고 중복·동시 실행은 기기당 하루 한 번만 발송한다", async (t) => {
  const db = createDatabase(103);
  const send = t.mock.method(webpush, "sendNotification", async () => ({}));
  const results = await Promise.all([
    sendDailyReminder(db.supabase, "2026-11-12"),
    sendDailyReminder(db.supabase, "2026-11-12"),
  ]);
  assert.equal(
    results.reduce((sum, item) => sum + item.sent, 0),
    102,
  );
  assert.equal(send.mock.callCount(), 102);
  const [target, payload, options] = send.mock.calls[0].arguments;
  assert.equal(target.endpoint, "https://push.example/1");
  assert.deepEqual(JSON.parse(payload), {
    title: "뭐했지",
    body: "예성아, 좋은 아침이야~ 오늘도 즐거운 하루 보내!",
    url: "/records/new",
    tag: "daily-reminder-2026-11-12",
  });
  assert.equal(options.TTL, 3600);
  for (const url of db.queries.filter((query) => query.pathname.endsWith("/push_subscriptions"))) {
    assert.equal(url.searchParams.get("account_members.is_active"), "eq.true");
    assert.equal(url.searchParams.get("select"), "id,endpoint,p256dh,auth_key,account_members!inner(is_active,name)");
  }
  const recipientCall = send.mock.calls.find((call) => call.arguments[0].endpoint === "https://push.example/3");
  assert.equal(JSON.parse(recipientCall.arguments[1]).body, "민지야, 좋은 아침이야~ 오늘도 즐거운 하루 보내!");
  assert.ok(db.queries.some((url) => url.searchParams.has("id")));
  assert.deepEqual(await sendDailyReminder(db.supabase, "2026-11-12"), { sent: 0, failed: 0, skipped: 102 });
  assert.equal((await sendDailyReminder(db.supabase, "2026-11-13")).sent, 102);
});

test("만료 구독을 정리하고 일시 실패한 기기는 같은 날 재시도할 수 있다", async (t) => {
  const db = createDatabase(4);
  t.mock.method(console, "warn", () => {});
  const send = t.mock.method(webpush, "sendNotification", async (target) => {
    throw Object.assign(new Error("push failed"), { statusCode: target.endpoint.endsWith("/1") ? 410 : 503 });
  });
  assert.deepEqual(await sendDailyReminder(db.supabase, "2026-11-12"), { sent: 0, failed: 3, skipped: 0 });
  assert.ok(!db.subscriptions.some((target) => target.id === "0001"));
  assert.ok(!db.deliveries.has("2026-11-12:0003"));
  send.mock.mockImplementation(async () => ({}));
  assert.deepEqual(await sendDailyReminder(db.supabase, "2026-11-12"), { sent: 2, failed: 0, skipped: 0 });
});

test("DB 조회 실패는 성공으로 처리하지 않고 푸시도 보내지 않는다", async (t) => {
  const db = createDatabase();
  const send = t.mock.method(webpush, "sendNotification", async () => ({}));
  db.fail();
  await assert.rejects(sendDailyReminder(db.supabase, "2026-11-12"));
  assert.equal(send.mock.callCount(), 0);
});

for (const stage of ["claim", "expired-cleanup", "retry-cleanup"]) {
  test(`${stage} DB 오류가 나도 진행 중인 발송을 기다리고 다음 묶음까지 처리한다`, async (t) => {
    const db = createDatabase(23, (url, options) => {
      if (stage === "claim") {
        return options.method === "POST" && JSON.parse(options.body).subscription_id === "0001";
      }
      return (
        options.method === "DELETE" &&
        url.searchParams.get(stage === "expired-cleanup" ? "id" : "subscription_id") === "eq.0001"
      );
    });
    t.mock.method(console, "warn", () => {});
    let release;
    let started;
    const pending = new Promise((resolve) => {
      release = resolve;
    });
    const sending = new Promise((resolve) => {
      started = resolve;
    });
    const send = t.mock.method(webpush, "sendNotification", async (target) => {
      if (target.endpoint.endsWith("/1")) {
        throw Object.assign(new Error("push failed"), { statusCode: stage === "expired-cleanup" ? 410 : 503 });
      }
      if (target.endpoint.endsWith("/3")) {
        started();
        await pending;
      }
      return {};
    });
    let completed = false;
    const result = sendDailyReminder(db.supabase, "2026-11-12").finally(() => {
      completed = true;
    });
    try {
      await sending;
      await new Promise((resolve) => setImmediate(resolve));
      assert.equal(completed, false);
    } finally {
      release();
    }
    assert.deepEqual(await result, { sent: 21, failed: 1, skipped: 0 });
    assert.ok(send.mock.calls.some((call) => call.arguments[0].endpoint.endsWith("/23")));
  });
}

test("기존 새 기록 알림은 작성자와 비활성 구성원을 제외한다", async (t) => {
  const db = createDatabase(3);
  const send = t.mock.method(webpush, "sendNotification", async () => ({}));
  await sendRecordPush({
    supabase: db.supabase,
    ownerId: "owner",
    senderMemberId: "sender",
    senderName: "나",
    recordId: "record",
  });
  assert.equal(send.mock.callCount(), 1);
  const [target, payload] = send.mock.calls[0].arguments;
  assert.equal(target.endpoint, "https://push.example/3");
  assert.equal(JSON.parse(payload).title, "나님이 새 기록을 남겼어요");
});
