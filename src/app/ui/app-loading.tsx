export function AppLoading() {
  return (
    <main
      aria-busy="true"
      className="app-loading flex min-h-svh w-full items-center justify-center bg-logo text-logo-foreground"
    >
      <div role="status">
        <svg aria-hidden="true" className="size-28" fill="none" stroke="currentColor" viewBox="0 0 100 100">
          <rect height={60} rx={14} strokeWidth={7} width={66} x={17} y={24} />
          <path d="M36 15v16M64 15v16" strokeLinecap="round" strokeWidth={7} />
          <path d="M17 42h66" strokeWidth={6} />
          <circle className="fill-logo-accent" cx={62} cy={64} r={9.5} stroke="none" />
        </svg>
        <span className="sr-only">뭐했지 앱을 불러오는 중</span>
      </div>
    </main>
  );
}
