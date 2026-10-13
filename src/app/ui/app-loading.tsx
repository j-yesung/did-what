export function AppLoading() {
  return (
    <main
      aria-busy="true"
      className="mx-auto flex min-h-(--screen-height) w-full max-w-(--app-width) items-center justify-center bg-background"
    >
      <div role="status">
        <p className="text-center font-medium text-lg text-muted-foreground tracking-[-0.02em] motion-safe:animate-[tab-content-enter_180ms_cubic-bezier(0.23,1,0.32,1)_both]">
          그날의 우리를 기억해요
        </p>
        <span className="sr-only">뭐했지 앱을 불러오는 중</span>
      </div>
    </main>
  );
}
