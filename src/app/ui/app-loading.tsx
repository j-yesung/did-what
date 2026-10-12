import { Spinner } from "@/shared/ui/spinner";

export function AppLoading() {
  return (
    <main
      aria-busy="true"
      className="mx-auto flex min-h-(--screen-height) w-full max-w-(--app-width) flex-col items-center justify-center gap-3 bg-background px-5 pt-(--page-top) pb-(--nav-clearance)"
    >
      <Spinner aria-label="앱을 불러오는 중" className="text-muted-foreground" />
      <p className="text-muted-foreground text-sm">기록을 불러오는 중이에요</p>
      <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 bottom-(--nav-bottom-offset) px-4">
        <div className="mx-auto grid h-(--nav-height) max-w-74 grid-cols-4 items-center justify-items-center rounded-full border border-border bg-surface">
          {[0, 1, 2, 3].map((slot) => (
            <span className="h-5 w-8 rounded-lg bg-muted" key={slot} />
          ))}
        </div>
      </div>
    </main>
  );
}
