import type { ReactNode } from "react";

export default function MapTemplate({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 motion-safe:animate-[tab-content-enter_160ms_cubic-bezier(0.2,0,0,1)_both]">
      {children}
    </div>
  );
}
