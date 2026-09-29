"use client";

import "@/app/styles/globals.css";

import { AppError } from "@/app/ui/app-error";

/**
 * 루트·앱 레이아웃에서 난 오류는 가장 가까운 error.tsx 위라 Next 기본 화면으로 간다.
 * 루트 레이아웃을 대신 그리므로 html·body와 전역 스타일을 직접 둔다.
 */
export default function GlobalError(props: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="ko">
      <body>
        <AppError {...props} />
      </body>
    </html>
  );
}
