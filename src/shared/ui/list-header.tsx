import type { ReactNode } from "react";

type Props = {
  action?: ReactNode;
  description?: string;
  title: string;
};

export function ListHeader({ action, description, title }: Props) {
  return (
    <header className="flex items-start justify-between gap-4 px-1">
      <div className="min-w-0 flex-1">
        <h1 className="font-bold text-2xl tracking-[-0.04em]">{title}</h1>
        {description ? <p className="mt-2 text-muted-foreground text-sm leading-relaxed">{description}</p> : null}
      </div>
      {action ? <div className="-mt-2 -mr-2 shrink-0">{action}</div> : null}
    </header>
  );
}
