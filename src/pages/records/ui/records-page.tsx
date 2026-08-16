import { PlusIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import { parseRecordFilters, type RecordSearchParams } from "@/entities/record";
import { cn } from "@/shared/lib/utils";
import { buttonVariants } from "@/shared/ui/button";
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

      <RecordList filters={filters} />
    </PageShell>
  );
}
