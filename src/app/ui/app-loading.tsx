import { Spinner } from "@/shared/ui/spinner";

export function AppLoading() {
  return (
    <main
      aria-busy="true"
      className="mx-auto flex min-h-svh w-full max-w-(--app-width) items-center justify-center bg-background px-5 pt-[calc(24px+env(safe-area-inset-top))] pb-(--nav-clearance)"
    >
      <Spinner aria-label="앱을 불러오는 중" className="text-muted-foreground" />
    </main>
  );
}
