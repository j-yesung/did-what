import type { ReactNode } from "react";

/** template은 세그먼트를 옮길 때마다 다시 마운트되므로, 하단 탭 전환과 같은 내용 등장 모션을 여기서 재생한다. */
export default function MapTemplate({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 motion-safe:animate-[tab-content-enter_160ms_cubic-bezier(0.2,0,0,1)_both]">
      {children}
    </div>
  );
}
