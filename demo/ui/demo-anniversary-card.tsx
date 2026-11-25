import { AnniversaryCard } from "@/entities/anniversary/ui/anniversary-card";
import { formatRecordDate } from "@/shared/lib/date/format-date";
import { Badge } from "@/shared/ui/badge";
import { ListRowTexts } from "@/shared/ui/list-row";

import type { DemoAnniversaryCardStyle, DemoFeaturedAnniversary } from "../model/types";

type DemoAnniversaryCardProps = {
  anniversary: DemoFeaturedAnniversary | null;
  style: DemoAnniversaryCardStyle;
};

export function DemoAnniversaryCard({ anniversary, style }: DemoAnniversaryCardProps) {
  if (!anniversary) {
    return (
      <span className="block rounded-[22px] bg-muted px-5 py-4">
        <ListRowTexts title="기념일 등록하기" />
      </span>
    );
  }

  if (style === "night") return <AnniversaryCard {...anniversary} />;

  const { date, dday, name } = anniversary;
  const countdown = dday === 0 ? "D-DAY" : `D-${dday}`;

  if (style === "date") {
    const [year, month, day] = date.split("-").map(Number);
    return (
      <span className="flex items-center gap-3 rounded-[22px] bg-primary/10 px-5 py-4 text-accent-text">
        <time className="flex shrink-0 flex-col items-center border-accent-text/20 border-r pr-3.5" dateTime={date}>
          <span className="sr-only">{year}년 </span>
          <span className="font-semibold text-xs">{month}월</span>
          <span className="font-extrabold text-3xl tabular-nums leading-none tracking-[-0.04em]">{day}</span>
          <span className="sr-only">일</span>
        </time>
        <span className="grid min-w-0 flex-1 justify-items-start gap-1">
          <span className="max-w-full truncate font-bold text-[15px] text-foreground">{name}</span>
          <span className="font-extrabold text-sm tabular-nums">{countdown}</span>
        </span>
      </span>
    );
  }

  return (
    <span className="flex items-center gap-3 rounded-[22px] border border-border bg-surface px-5 py-3.5 text-muted-foreground">
      <ListRowTexts
        className="flex-1"
        description={<time dateTime={date}>{formatRecordDate(date)}</time>}
        title={name}
      />
      <Badge className="font-bold tabular-nums">{countdown}</Badge>
    </span>
  );
}
