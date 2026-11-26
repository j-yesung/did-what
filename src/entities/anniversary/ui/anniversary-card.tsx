import { formatMonthDay } from "@/shared/lib/date/format-date";

type AnniversaryCardProps = {
  date: string;
  dday: number;
  name: string;
};

export function AnniversaryCard({ date, dday, name }: AnniversaryCardProps) {
  const className = "surface-anniversary flex items-start gap-3 rounded-[22px] bg-surface px-5 py-5 text-foreground";
  const content = (
    <>
      <span className="grid min-w-0 flex-1 gap-0.75">
        <span className="truncate font-bold text-[15px]">{name}</span>
        <time className="text-[12px] text-muted-foreground" dateTime={date}>
          {formatMonthDay(date)}
        </time>
      </span>
      <span className="shrink-0 whitespace-nowrap font-extrabold text-[22px] text-accent-text tabular-nums leading-[1.15] tracking-[-0.04em]">
        {dday === 0 ? "D-DAY" : `D-${dday}`}
      </span>
    </>
  );

  return <span className={className}>{content}</span>;
}
