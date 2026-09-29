import { redirect } from "next/navigation";

import { parseRecordFilters, type RecordSearchParams } from "@/entities/record";
import { getRecordView } from "@/features/record/switch-record-view/server";
import { PageShell } from "@/shared/ui/layouts";

import { RecordCalendar } from "./record-calendar";
import { RecordFilterForm } from "./record-filter-form";
import { RecordList } from "./record-list";

type RecordsPageProps = {
  searchParams: Promise<RecordSearchParams>;
};

export async function RecordsPage({ searchParams }: RecordsPageProps) {
  const params = await searchParams;

  // 주소에 아무것도 없이 들어오면(하단 메뉴, 작성 후 이동 등) 마지막에 고른 보기로 보낸다.
  // 서버에서 정해야 목록이 먼저 보였다가 달력으로 바뀌지 않는다.
  if (Object.keys(params).length === 0 && (await getRecordView()) === "calendar") {
    redirect("/records?view=calendar");
  }

  const view = params.view === "calendar" ? "calendar" : "list";
  const filters = parseRecordFilters(params);

  return (
    <PageShell className="gap-4" withBottomNavigation>
      <header className="min-h-13">
        <h1 className="sr-only">우리의 기록</h1>
      </header>

      {view === "calendar" ? (
        <RecordCalendar />
      ) : (
        <>
          <RecordFilterForm filters={filters} />
          <RecordList filters={filters} />
        </>
      )}
    </PageShell>
  );
}
