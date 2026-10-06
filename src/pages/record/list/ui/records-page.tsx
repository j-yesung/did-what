import { parseRecordFilters, type RecordSearchParams } from "@/entities/record";
import { RecordViewToggle } from "@/features/record/switch-record-view";
import { getRecordView } from "@/features/record/switch-record-view/server";
import { PageShell } from "@/shared/ui/layouts";

import { RecordCalendar } from "./record-calendar";
import { RecordFilterForm } from "./record-filter-form";
import { RecordList } from "./record-list";

type RecordsPageProps = {
  searchParams: Promise<RecordSearchParams>;
};

export async function RecordsPage({ searchParams }: RecordsPageProps) {
  const params = await searchParams;

  const view =
    params.view === "calendar" || (Object.keys(params).length === 0 && (await getRecordView()) === "calendar")
      ? "calendar"
      : "list";
  const filters = parseRecordFilters(params);

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-30">
        <div className="mx-auto flex w-full max-w-(--app-width) items-start px-5 pt-(--page-top)">
          <RecordViewToggle view={view} />
        </div>
      </div>
      <PageShell className="gap-4" withBottomNavigation>
        <header className="min-h-13">
          <h1 className="sr-only">우리의 기록</h1>
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
    </>
  );
}
