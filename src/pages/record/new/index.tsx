import { createRecord } from "@/features/record/create-record/api/create-record";
import { PageShell } from "@/shared/ui/layouts";
import { RecordCreateFunnel } from "@/widgets/record-form/funnel/create-record-funnel";

export function RecordNewPage() {
  const defaultRecordedAt = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(new Date());

  return (
    <PageShell className="h-dvh min-h-0 gap-0 overflow-hidden px-0 pt-0 pb-0">
      <RecordCreateFunnel
        action={createRecord}
        defaultRecordedAt={defaultRecordedAt}
        returnTo="/records"
        savedTo="/records"
      />
    </PageShell>
  );
}
