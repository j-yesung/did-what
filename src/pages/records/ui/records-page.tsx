import { NotebookPenIcon } from "lucide-react";
import { redirect } from "next/navigation";

import { getRecords, hasRecordFilters, parseRecordFilters, type RecordSearchParams } from "@/entities/record";
import { createClient } from "@/shared/api/supabase/server";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { PageHeader, PageShell } from "@/shared/ui/layouts";

import { RecordFilterForm } from "./record-filter-form";
import { RecordList } from "./record-list";

type RecordsPageProps = {
  searchParams: Promise<RecordSearchParams>;
};

export async function RecordsPage({ searchParams }: RecordsPageProps) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login");
  }

  const filters = parseRecordFilters(await searchParams);
  const { data: records, error } = await getRecords(userData.user.id, filters);

  return (
    <PageShell>
      <PageHeader title="기록" />

      <RecordFilterForm filters={filters} />

      {error ? (
        <Alert variant="destructive">
          <NotebookPenIcon aria-hidden="true" />
          <AlertTitle>기록을 불러오지 못했어요</AlertTitle>
          <AlertDescription>잠시 후 다시 시도해 주세요.</AlertDescription>
        </Alert>
      ) : (
        <RecordList isFiltered={hasRecordFilters(filters)} records={records ?? []} />
      )}
    </PageShell>
  );
}
