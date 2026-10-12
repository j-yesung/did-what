export function AppLoading() {
  return (
    <main
      aria-busy="true"
      className="mx-auto flex min-h-(--screen-height) w-full max-w-(--app-width) items-center justify-center bg-background"
    >
      <div role="status">
        <svg aria-hidden="true" className="size-16 text-primary" fill="none" viewBox="0 0 64 64">
          <path
            className="app-loading-question-stroke"
            d="M16 23C18 12 25 9 33 9C43 9 49 16 49 23C49 33 33 35 33 45"
            pathLength="100"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="9"
          />
          <circle className="app-loading-question-dot" cx="33" cy="57" fill="currentColor" r="4.5" />
        </svg>
        <span className="sr-only">뭐했지 앱을 불러오는 중</span>
      </div>
    </main>
  );
}
