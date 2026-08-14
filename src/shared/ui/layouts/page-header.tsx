import type { ReactNode } from "react";

import { BackButton } from "./back-button";

type PageHeaderProps = {
  action?: ReactNode;
  back?: string;
  backGuardFormId?: string;
  title: string;
};

export function PageHeader({ action, back, backGuardFormId, title }: PageHeaderProps) {
  return (
    <header className="grid min-h-11 grid-cols-[44px_1fr_44px] items-center">
      {back ? <BackButton fallbackHref={back} guardFormId={backGuardFormId} /> : <span aria-hidden="true" />}
      <h1 className="text-center font-bold text-xl tracking-[-0.03em]">{title}</h1>
      {action ?? <span aria-hidden="true" />}
    </header>
  );
}
