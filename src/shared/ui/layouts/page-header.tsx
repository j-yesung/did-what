import { cn } from "@/shared/lib/utils";

import { BackButton } from "./back-button";

type PageHeaderProps = {
  // 값이 있으면 뒤로가기 버튼을 그리고, 히스토리가 없을 때 이 경로로 보낸다.
  back?: string;
  eyebrow?: string;
  title: string;
};

export function PageHeader({ back, eyebrow, title }: PageHeaderProps) {
  return (
    <header className="grid min-h-11 grid-cols-[40px_1fr_40px] items-center">
      {back ? <BackButton fallbackHref={back} /> : null}
      <div className={cn("text-center", !back && "col-start-2")}>
        {eyebrow ? <p className="font-bold text-[9px] text-foreground tracking-[0.16em]">{eyebrow}</p> : null}
        <h1 className="font-bold font-heading text-xl tracking-[-0.03em]">{title}</h1>
      </div>
    </header>
  );
}
