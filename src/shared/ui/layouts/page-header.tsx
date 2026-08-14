import type { ReactNode } from "react";

import { BackButton } from "./back-button";

type PageHeaderProps = {
  action?: ReactNode;
  // 값이 있으면 뒤로가기 버튼을 그리고, 히스토리가 없을 때 이 경로로 보낸다.
  back?: string;
  backGuardFormId?: string;
  eyebrow?: string;
  title: string;
};

export function PageHeader({ action, back, backGuardFormId, eyebrow, title }: PageHeaderProps) {
  return (
    <header className="grid min-h-11 grid-cols-[44px_1fr_44px] items-center">
      {back ? <BackButton fallbackHref={back} guardFormId={backGuardFormId} /> : <span aria-hidden="true" />}
      <div className="text-center">
        {eyebrow ? <p className="font-bold text-[9px] text-foreground tracking-[0.16em]">{eyebrow}</p> : null}
        <h1 className="font-bold text-xl tracking-[-0.03em]">{title}</h1>
      </div>
      {action ?? <span aria-hidden="true" />}
    </header>
  );
}
