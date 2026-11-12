export function AppLoading() {
  return (
    <main
      aria-busy="true"
      className="app-loading fixed inset-0 flex items-center justify-center bg-background text-foreground"
    >
      <div role="status">
        <p
          aria-hidden="true"
          className="font-extrabold text-[32px] leading-none tracking-[-0.04em] [font-family:'Apple_SD_Gothic_Neo',system-ui,sans-serif]"
        >
          뭐했지
        </p>
        <span className="sr-only">뭐했지 앱을 불러오는 중</span>
      </div>
    </main>
  );
}
