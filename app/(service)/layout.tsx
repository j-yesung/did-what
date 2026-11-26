import type { ReactNode } from "react";

import { QueryProvider } from "@/app/providers/query-provider";
import { ToastProvider } from "@/app/providers/toast-provider";

import "@/app/styles/liquid-glass.css";
import "../fonts/pretendard.css";

// 실제 화면끼리는 조회 캐시와 토스트를 공유하고, 초기 로딩 화면에는 내려보내지 않는다.
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <QueryProvider>{children}</QueryProvider>
      <ToastProvider />
    </>
  );
}
