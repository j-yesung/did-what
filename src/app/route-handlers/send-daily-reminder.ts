import { getDailyReminderDate } from "@/features/push-notification/model/daily-reminder";
import { sendDailyReminder } from "@/features/push-notification/server";
import { createAdminClient } from "@/shared/api/supabase/admin";

export const sendDailyReminderHandler = async (request: Request) => {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reminderDate = getDailyReminderDate();
  if (!reminderDate) return Response.json({ skipped: true, reason: "outside-reminder-hour" });

  try {
    const result = await sendDailyReminder(createAdminClient(), reminderDate);
    return Response.json(result, { status: result.failed ? 503 : 200 });
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: 비밀키나 구독 정보를 응답에 노출하지 않고 서버에 실패를 기록한다.
    console.error("[daily-push] 예약 발송 실패", error);
    return Response.json({ error: "예약 알림을 보내지 못했습니다." }, { status: 500 });
  }
};
