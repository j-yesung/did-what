"use client";

import { useRecordSearch } from "@/entities/record/ui/record-search-provider";
import { RecordViewToggle } from "@/features/record/switch-record-view";
import type { RecordView } from "@/features/record/switch-record-view/model/record-view-preference";
import { cn } from "@/shared/lib/utils";
import { FixedToolbar, PageShell } from "@/shared/ui/layouts";

import { RecordCalendar } from "./calendar/record-calendar";
import { RecordListContent } from "./list/record-list-content";
import { RecordSearchResults } from "./search/record-search-results";

export function RecordsContent({ view }: { view: RecordView }) {
  const search = useRecordSearch();
  return (
    <>
      <FixedToolbar className="hide-during-record-search items-start">
        <RecordViewToggle view={view} />
      </FixedToolbar>
      <PageShell className={cn("gap-4", view === "calendar" && "h-(--screen-height)")} withBottomNavigation>
        <header className="min-h-13">
          <h1 className="sr-only">우리의 기록</h1>
        </header>
        <div
          inert={view === "calendar" && search.open}
          className={cn("flex min-h-0 flex-1 flex-col gap-4", view === "calendar" && search.open && "invisible")}
        >
          {view === "calendar" ? <RecordCalendar /> : <RecordListContent />}
        </div>
      </PageShell>
      <RecordSearchResults />
    </>
  );
}
