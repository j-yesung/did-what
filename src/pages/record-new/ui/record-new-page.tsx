import { createRecord, RecordForm } from "@/features/manage-record";
import { PageHeader, PageShell } from "@/shared/ui/layouts";

export function RecordNewPage() {
  return (
    <PageShell className="block">
      <PageHeader back="/records" title="기록" />

      <section
        className="px-1 pt-5.5 pb-5 motion-safe:animate-[enter_360ms_ease-out_both]"
        aria-labelledby="record-intro-title"
      >
        <h2
          className="font-[780] text-[clamp(24px,7vw,30px)] leading-tight tracking-[-0.045em]"
          id="record-intro-title"
        >
          오늘의 장면을 남겨보세요.
        </h2>
        <p className="mt-2 text-[14px] text-muted-foreground leading-[1.6]">
          날짜, 사람, 지역과 방문 장소를 한 화면에서 빠르게 기록할 수 있어요.
        </p>
      </section>

      <RecordForm action={createRecord} returnTo="/records" />
    </PageShell>
  );
}
