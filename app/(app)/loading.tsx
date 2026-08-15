import { PageShell } from "@/shared/ui/layouts";
import { Spinner } from "@/shared/ui/spinner";

export default function Loading() {
  return (
    <PageShell className="items-center justify-center" withBottomNavigation>
      <div className="motion-safe:fade-in motion-safe:animate-in motion-safe:fill-mode-both motion-safe:delay-300">
        <Spinner aria-label="화면을 불러오는 중" className="size-6 text-muted-foreground" />
      </div>
    </PageShell>
  );
}
