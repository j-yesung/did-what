import { RecordViewToggle } from "@/features/record/switch-record-view";
import type { RecordView } from "@/features/record/switch-record-view/model/record-view-preference";
import { cn } from "@/shared/lib/utils";
import { FixedToolbar, PageShell } from "@/shared/ui/layouts";

import { RecordCalendar } from "./calendar/record-calendar";
import { RecordListContent } from "./list/record-list-content";

export function RecordsContent({ view }: { view: RecordView }) {
  return (
    <>
      <FixedToolbar className="items-start">
        <RecordViewToggle view={view} />
      </FixedToolbar>
      <PageShell className={cn("gap-4", view === "calendar" && "h-(--screen-height)")} withBottomNavigation>
        <header className="min-h-13">
          <h1 className="sr-only">우리의 기록</h1>
        </header>
        {view === "calendar" ? <RecordCalendar /> : <RecordListContent />}
      </PageShell>
    </>
  );
}
