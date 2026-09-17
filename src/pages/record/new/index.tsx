import { createRecord } from "@/features/record/create-record/api/create-record";
import { isIsoDate } from "@/shared/lib/validation/is-iso-date";
import { PageShell } from "@/shared/ui/layouts";
import { RecordCreateFunnel } from "@/widgets/record-form/funnel/create-record-funnel";

type RecordNewPageProps = {
  searchParams: Promise<{ date?: string | string[] }>;
};

export async function RecordNewPage({ searchParams }: RecordNewPageProps) {
  const { date } = await searchParams;
  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(new Date());
  const defaultRecordedAt = typeof date === "string" && isIsoDate(date) ? date : today;
  const calendarHref = defaultRecordedAt === date ? `/records?view=calendar&month=${date.slice(0, 7)}` : "/records";

  return (
    <PageShell className="h-dvh min-h-0 gap-0 overflow-hidden px-0 pt-0 pb-0">
      <RecordCreateFunnel
        action={createRecord}
        defaultRecordedAt={defaultRecordedAt}
        returnTo={calendarHref}
        savedTo={calendarHref}
      />
    </PageShell>
  );
}
