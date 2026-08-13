import { NotebookPenIcon } from "lucide-react";

import { getRecords, hasRecordFilters, parseRecordFilters, type RecordSearchParams } from "@/entities/record";
import { requireUser } from "@/shared/api/supabase/require-user";
import { PageHeader, PageShell } from "@/shared/ui/layouts";
import { LoadErrorAlert } from "@/shared/ui/load-error-alert";

import { RecordFilterForm } from "./record-filter-form";
import { RecordList } from "./record-list";

type RecordsPageProps = {
  searchParams: Promise<RecordSearchParams>;
};

export async function RecordsPage({ searchParams }: RecordsPageProps) {
  const { user } = await requireUser();

  const filters = parseRecordFilters(await searchParams);
  const { data: records, error } = await getRecords(user.id, filters);

  return (
    <PageShell>
      <PageHeader title="기록" />

      <RecordFilterForm filters={filters} />

      {error ? (
        <LoadErrorAlert icon={<NotebookPenIcon aria-hidden="true" />} title="기록을 불러오지 못했어요" />
      ) : (
        <RecordList isFiltered={hasRecordFilters(filters)} records={records ?? []} />
      )}
    </PageShell>
  );
}
