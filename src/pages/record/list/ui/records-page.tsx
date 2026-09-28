import { parseRecordFilters, type RecordSearchParams } from "@/entities/record";
import { RecordViewPreference } from "@/features/record/switch-record-view";
import { PageShell } from "@/shared/ui/layouts";

import { RecordCalendar } from "./record-calendar";
import { RecordFilterForm } from "./record-filter-form";
import { RecordList } from "./record-list";

type RecordsPageProps = {
  searchParams: Promise<RecordSearchParams>;
};

export async function RecordsPage({ searchParams }: RecordsPageProps) {
  const params = await searchParams;
  const view = params.view === "calendar" ? "calendar" : "list";
  const hasExplicitView = params.view === "calendar" || params.view === "list";
  const filters = parseRecordFilters(params);

  return (
    <PageShell className={view === "calendar" ? "min-h-dvh gap-4" : "gap-4"} withBottomNavigation>
      <header className="min-h-13">
        <h1 className="sr-only">우리의 기록</h1>
        <RecordViewPreference hasExplicitView={hasExplicitView} view={view} />
      </header>

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
