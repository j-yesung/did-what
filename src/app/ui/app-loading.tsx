export function AppLoading() {
  return (
    <main
      aria-busy="true"
      className="app-loading flex min-h-svh w-full items-center justify-center bg-logo text-logo-foreground"
    >
      <div role="status">
        <svg aria-hidden="true" className="size-30 overflow-visible" viewBox="0 0 100 100">
          <path
            d="M26 74 C26 52 46 58 50 46 C54 34 44 26 56 22 C64 19 70 24 74 26"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth={6.5}
          />
          <circle className="fill-logo" cx={26} cy={74} r={6} stroke="currentColor" strokeWidth={3} />
          <circle className="map-location-pulse fill-logo-accent" cx={74} cy={26} r={7.5} />
          <circle className="fill-logo-accent" cx={74} cy={26} r={7.5} stroke="currentColor" strokeWidth={2.4} />
        </svg>
        <span className="sr-only">뭐했지 앱을 불러오는 중</span>
      </div>
    </main>
  );
}
