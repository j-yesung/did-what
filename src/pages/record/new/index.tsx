import { createRecord } from "@/features/record/create-record/api/create-record";
import { resolveSavedRecordLocation } from "@/features/record/select-record-location/server";
import { isIsoDate } from "@/shared/lib/validation/is-iso-date";
import { isUuid } from "@/shared/lib/validation/is-uuid";
import { PageShell } from "@/shared/ui/layouts";
import { RecordCreateFunnel } from "@/widgets/record-form/funnel/create-record-funnel";

type RecordNewPageProps = {
  searchParams: Promise<{ date?: string | string[]; placeId?: string | string[] }>;
};

export async function RecordNewPage({ searchParams }: RecordNewPageProps) {
  const { date, placeId: rawPlaceId } = await searchParams;
  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(new Date());
  const defaultRecordedAt = typeof date === "string" && isIsoDate(date) ? date : today;
  const calendarHref = defaultRecordedAt === date ? `/records?view=calendar&month=${date.slice(0, 7)}` : "/records";
  const placeId = typeof rawPlaceId === "string" && isUuid(rawPlaceId) ? rawPlaceId : null;
  const defaultPlace = placeId ? await resolveSavedRecordLocation(placeId) : null;
  const returnHref = defaultPlace ? `/places/${placeId}` : calendarHref;

  return (
    <PageShell className="h-dvh min-h-0 gap-0 overflow-hidden px-0 pt-0 pb-0">
      <RecordCreateFunnel
        action={createRecord}
        defaultPlace={defaultPlace ?? undefined}
        defaultRecordedAt={defaultRecordedAt}
        returnTo={returnHref}
        savedTo={returnHref}
      />
    </PageShell>
  );
}
