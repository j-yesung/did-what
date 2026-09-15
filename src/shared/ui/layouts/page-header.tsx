import type { ReactNode } from "react";

import { BackButton } from "../back-button";

type PageHeaderProps = {
  action?: ReactNode;
  back?: string;
  title?: string;
};

export function PageHeader({ action, back, title }: PageHeaderProps) {
  return (
    <header className="grid min-h-11 grid-cols-[minmax(44px,1fr)_auto_minmax(44px,1fr)] items-center">
      {back ? <BackButton fallbackHref={back} /> : <span aria-hidden="true" />}
      {title ? (
        <h1 className="text-center font-bold text-xl tracking-[-0.03em]">{title}</h1>
      ) : (
        <span aria-hidden="true" />
      )}
      {action ? <div className="justify-self-end">{action}</div> : <span aria-hidden="true" />}
    </header>
  );
}
