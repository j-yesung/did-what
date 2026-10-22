import { requireMember } from "@/entities/member/server";
import type { RecordSearchParams } from "@/entities/record";
import { RecordViewToggle } from "@/features/record/switch-record-view";
import { getRecordView } from "@/features/record/switch-record-view/server";
import { cn } from "@/shared/lib/utils";
import { FixedToolbar, PageShell } from "@/shared/ui/layouts";

import { RecordCalendar } from "./calendar/record-calendar";
import { RecordListContent } from "./list/record-list-content";

type RecordsPageProps = {
  searchParams: Promise<RecordSearchParams>;
};

export async function RecordsPage({ searchParams }: RecordsPageProps) {
  const params = await searchParams;

  const view =
    params.view === "calendar" || (Object.keys(params).length === 0 && (await getRecordView()) === "calendar")
      ? "calendar"
      : "list";
  const member = view === "calendar" ? (await requireMember()).member : null;

  return (
    <>
      <FixedToolbar className="items-start">
        <RecordViewToggle view={view} />
      </FixedToolbar>
      <PageShell className={cn("gap-4", view === "calendar" && "h-(--screen-height)")} withBottomNavigation>
        <header className="min-h-13">
          <h1 className="sr-only">우리의 기록</h1>
        </header>

        {view === "calendar" && member ? (
          <RecordCalendar member={{ id: member.id, name: member.name }} />
        ) : (
          <RecordListContent />
        )}
      </PageShell>
    </>
  );
}
