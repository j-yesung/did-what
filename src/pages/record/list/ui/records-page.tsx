import { parseRecordFilters, type RecordSearchParams } from "@/entities/record";
import { PageShell } from "@/shared/ui/layouts";
import { ListHeader } from "@/shared/ui/list-header";

import { RecordFilterForm } from "./record-filter-form";
import { RecordList } from "./record-list";

type RecordsPageProps = {
  searchParams: Promise<RecordSearchParams>;
};

export async function RecordsPage({ searchParams }: RecordsPageProps) {
  const filters = parseRecordFilters(await searchParams);

  return (
    <PageShell withBottomNavigation>
      <ListHeader title="우리의 기록" />

      <RecordFilterForm filters={filters} />

      <RecordList filters={filters} />
    </PageShell>
  );
}
