import type { ReactNode } from "react";

import { PageBackButton } from "./page-back-button";

type PageHeaderProps = {
  action?: ReactNode;
  back?: string;
  title?: string;
};

export function PageHeader({ action, back, title }: PageHeaderProps) {
  return (
    <header className="grid min-h-11 grid-cols-[minmax(44px,1fr)_auto_minmax(44px,1fr)] items-center">
      {/* 버튼은 화면에 고정해 따로 띄우고, 헤더에는 같은 크기의 자리만 남겨 제목 위치를 지킨다. */}
      {back ? (
        <>
          <span aria-hidden="true" className="size-(--toolbar-height)" />
          <PageBackButton fallbackHref={back} />
        </>
      ) : (
        <span aria-hidden="true" />
      )}
      {title ? (
        <h1 className="text-center font-bold text-xl tracking-[-0.03em]">{title}</h1>
      ) : (
        <span aria-hidden="true" />
      )}
      {action ? <div className="justify-self-end">{action}</div> : <span aria-hidden="true" />}
    </header>
  );
}
