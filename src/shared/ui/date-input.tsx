import { formatRecordDate } from "@/shared/lib/date/format-date";
import { cn } from "@/shared/lib/utils";
import { Input, type InputProps } from "@/shared/ui/input";

type DateInputProps = Omit<InputProps, "actionButton" | "containerClassName" | "type"> & {
  /** 값이 없을 때 자리에 둘 글. 비어 있다는 게 무슨 뜻인지는 쓰는 쪽이 안다. */
  placeholder?: string;
};

function DateInput({ className, disabled, onClick, placeholder = "날짜 선택", value, ...props }: DateInputProps) {
  const dateValue = typeof value === "string" ? value : "";
  const isInvalid = props["aria-invalid"] === true || props["aria-invalid"] === "true";

  return (
    <div
      className={cn(
        "relative h-10 w-full rounded-lg border border-input",
        disabled && "cursor-not-allowed opacity-50",
        isInvalid &&
          "border-destructive ring-3 ring-destructive/20 dark:border-destructive/50 dark:ring-destructive/40",
        className,
      )}
      data-slot="date-input-field"
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none flex h-full items-center px-2.5 py-1 text-base md:text-sm",
          !dateValue && "text-muted-foreground",
        )}
      >
        {dateValue ? formatRecordDate(dateValue) : placeholder}
      </span>
      <Input
        {...props}
        className="h-full cursor-pointer opacity-0"
        containerClassName="absolute inset-0 z-10"
        disabled={disabled}
        onClick={(event) => {
          onClick?.(event);
          event.currentTarget.showPicker();
        }}
        type="date"
        value={value}
      />
    </div>
  );
}

export { DateInput, type DateInputProps };
