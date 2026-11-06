import { cn } from "@/shared/lib/utils";

export function CountBadge({ className, count, unit }: { className?: string; count: number; unit: string }) {
  return (
    <span
      className={cn(
        "absolute -top-2.5 left-full ml-0.5 h-4.5 min-w-4.5 rounded-full bg-foreground px-1 text-center font-extrabold text-[11px] text-background tabular-nums leading-4.5 tracking-normal",
        className,
      )}
    >
      <span className="sr-only"> </span>
      {count}
      <span className="sr-only">{unit}</span>
    </span>
  );
}
