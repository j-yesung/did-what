import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/shared/api/supabase/database.types";
import { callName } from "@/shared/lib/text/call-name";

import { isExpiredPushError, isPushConfigured, sendPush } from "./send-push";

const PAGE_SIZE = 100;
const BATCH_SIZE = 20;

export const sendDailyReminder = async (supabase: SupabaseClient<Database>, reminderDate: string) => {
  if (!isPushConfigured) throw new Error("푸시 알림 환경 변수를 확인해 주세요.");

  const counts = { sent: 0, failed: 0, skipped: 0 };
  let cursor: string | undefined;

  const cutoff = new Date(`${reminderDate}T00:00:00Z`);
  cutoff.setUTCDate(cutoff.getUTCDate() - 30);
  await supabase
    .from("daily_push_deliveries")
    .delete()
    .lt("reminder_date", cutoff.toISOString().slice(0, 10))
    .throwOnError();

  while (true) {
    let query = supabase
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth_key, account_members!inner(is_active, name)")
      .eq("account_members.is_active", true)
      .order("id")
      .limit(PAGE_SIZE);
    if (cursor) query = query.gt("id", cursor);

    const { data: targets } = await query.throwOnError();
    if (!targets?.length) break;

    for (let offset = 0; offset < targets.length; offset += BATCH_SIZE) {
      const results = await Promise.allSettled(
        targets.slice(offset, offset + BATCH_SIZE).map(async (target) => {
          const delivery = { reminder_date: reminderDate, subscription_id: target.id };
          // 고유 제약으로 중복·동시 호출 중 발송 권한을 얻은 요청만 보낸다.
          const { data: claimed } = await supabase
            .from("daily_push_deliveries")
            .upsert(delivery, { onConflict: "reminder_date,subscription_id", ignoreDuplicates: true })
            .select("subscription_id")
            .throwOnError();
          if (!claimed?.length) {
            counts.skipped += 1;
            return;
          }

          try {
            await sendPush(
              target,
              {
                title: "뭐했지",
                body: `${callName(target.account_members.name)}, 좋은 아침이야~ 오늘도 즐거운 하루 보내!`,
                url: "/records/new",
                tag: `daily-reminder-${reminderDate}`,
              },
              { TTL: 3600, timeout: 10_000 },
            );
            counts.sent += 1;
          } catch (error) {
            if (isExpiredPushError(error)) {
              await supabase.from("push_subscriptions").delete().eq("id", target.id).throwOnError();
            } else {
              // 실패한 발송은 이력을 지워 같은 날 다시 실행하면 재시도할 수 있게 한다.
              await supabase
                .from("daily_push_deliveries")
                .delete()
                .eq("reminder_date", reminderDate)
                .eq("subscription_id", target.id)
                .throwOnError();
            }
            counts.failed += 1;
            // biome-ignore lint/suspicious/noConsole: 푸시 서비스 장애를 구독 정보 노출 없이 기록한다.
            console.warn("[daily-push] 발송 실패", { statusCode: (error as { statusCode?: number }).statusCode });
          }
        }),
      );
      for (const result of results) {
        if (result.status !== "rejected") continue;
        counts.failed += 1;
        // biome-ignore lint/suspicious/noConsole: 구독 정보 없이 기기별 DB 처리 실패를 기록한다.
        console.warn("[daily-push] 기기 처리 실패");
      }
    }

    cursor = targets.at(-1)?.id;
    if (targets.length < PAGE_SIZE) break;
  }

  return counts;
};
