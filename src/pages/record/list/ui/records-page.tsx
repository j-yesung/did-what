import { parseRecordFilters, type RecordSearchParams } from "@/entities/record";
import { PageHeader, PageShell } from "@/shared/ui/layouts";

import { RecordFilterForm } from "./record-filter-form";
import { RecordList } from "./record-list";

type RecordsPageProps = {
  searchParams: Promise<RecordSearchParams>;
};

export async function RecordsPage({ searchParams }: RecordsPageProps) {
  const filters = parseRecordFilters(await searchParams);

  return (
    <PageShell className="pb-[calc(var(--nav-clearance)+50px)]" withBottomNavigation>
      <PageHeader title="기록" />

      <RecordFilterForm filters={filters} />

      <RecordList filters={filters} />
    </PageShell>
  );
}
