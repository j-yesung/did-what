import { PlusIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import { parseRecordFilters, type RecordSearchParams } from "@/entities/record";
import { IconButton } from "@/shared/ui/icon-button";
import { PageHeader, PageShell } from "@/shared/ui/layouts";

import { RecordFilterForm } from "./record-filter-form";
import { RecordList } from "./record-list";

type RecordsPageProps = {
  searchParams: Promise<RecordSearchParams>;
};

export async function RecordsPage({ searchParams }: RecordsPageProps) {
  const filters = parseRecordFilters(await searchParams);

  return (
    <PageShell withBottomNavigation>
      <PageHeader
        action={
          <IconButton
            aria-label="기록 남기기"
            icon={PlusIcon}
            iconStrokeWidth={2}
            nativeButton={false}
            render={<Link href="/records/new" />}
          />
        }
        title="기록"
      />

      <RecordFilterForm filters={filters} />

      <RecordList filters={filters} />
    </PageShell>
  );
}
