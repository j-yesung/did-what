import { NotePencilIcon, PlusIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import { getRecords, hasRecordFilters, parseRecordFilters, type RecordSearchParams } from "@/entities/record";
import { requireUser } from "@/shared/api/supabase/require-user";
import { cn } from "@/shared/lib/utils";
import { buttonVariants } from "@/shared/ui/button";
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
    <PageShell withBottomNavigation>
      <PageHeader
        action={
          <Link
            aria-label="새 기록 남기기"
            className={cn(buttonVariants({ size: "icon-lg", variant: "ghost" }), "size-11")}
            href="/records/new"
          >
            <PlusIcon strokeWidth={2} aria-hidden="true" />
          </Link>
        }
        title="기록"
      />

      <RecordFilterForm filters={filters} />

      {error ? (
        <LoadErrorAlert icon={<NotePencilIcon strokeWidth={2} aria-hidden="true" />} title="기록을 불러오지 못했어요" />
      ) : (
        <RecordList isFiltered={hasRecordFilters(filters)} records={records ?? []} />
      )}
    </PageShell>
  );
}
