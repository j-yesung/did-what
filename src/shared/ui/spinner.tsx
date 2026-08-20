import { cn } from "@/shared/lib/utils";

function Spinner({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="spinner"
      role="status"
      aria-label="Loading"
      className={cn("inline-flex items-center justify-center gap-0.5", className)}
      {...props}
    >
      <span
        aria-hidden="true"
        className="size-1.5 rounded-full bg-current motion-safe:animate-[loading-dot_900ms_ease-in-out_infinite] motion-safe:[animation-delay:-300ms]"
      />
      <span
        aria-hidden="true"
        className="size-1.5 rounded-full bg-current motion-safe:animate-[loading-dot_900ms_ease-in-out_infinite] motion-safe:[animation-delay:-150ms]"
      />
      <span
        aria-hidden="true"
        className="size-1.5 rounded-full bg-current motion-safe:animate-[loading-dot_900ms_ease-in-out_infinite]"
      />
    </div>
  );
}

export { Spinner };
