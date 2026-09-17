import { parseRecordFilters, type RecordSearchParams } from "@/entities/record";
import { PageShell } from "@/shared/ui/layouts";
import { ListHeader } from "@/shared/ui/list-header";

import { RecordCalendar } from "./record-calendar";
import { RecordFilterForm } from "./record-filter-form";
import { RecordList } from "./record-list";
import { RecordViewSegment } from "./record-view-segment";

type RecordsPageProps = {
  searchParams: Promise<RecordSearchParams>;
};

export async function RecordsPage({ searchParams }: RecordsPageProps) {
  const params = await searchParams;
  const view = params.view === "calendar" ? "calendar" : "list";
  const filters = parseRecordFilters(params);

  return (
    <PageShell className="gap-4" withBottomNavigation>
      <ListHeader title="우리의 기록" />

      <RecordViewSegment view={view} />

      {view === "calendar" ? (
        <RecordCalendar />
      ) : (
        <>
          <RecordFilterForm filters={filters} />
          <RecordList filters={filters} />
        </>
      )}
    </PageShell>
  );
}
