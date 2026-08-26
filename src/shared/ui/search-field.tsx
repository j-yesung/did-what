"use client";

import { type ComponentProps, useRef } from "react";

import { MagnifyingGlassIcon, XCircleIcon } from "@phosphor-icons/react";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Spinner } from "@/shared/ui/spinner";

type SearchFieldProps = Omit<ComponentProps<typeof Input>, "onChange" | "type" | "value"> & {
  loading?: boolean;
  onClear?: () => void;
  onValueChange: (value: string) => void;
  value: string;
};

function SearchField({
  className,
  disabled,
  loading,
  onClear,
  onValueChange,
  readOnly,
  value,
  ...props
}: SearchFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const clearable = Boolean(value) && !disabled && !readOnly;

  return (
    <div
      className={cn(
        "relative rounded-xl bg-muted transition-shadow focus-within:ring-3 focus-within:ring-ring/50 has-[input[aria-invalid=true]]:ring-3 has-[input[aria-invalid=true]]:ring-destructive/20",
        className,
      )}
      data-slot="search-field"
    >
      <MagnifyingGlassIcon
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2 text-muted-foreground"
        strokeWidth={2}
      />
      <Input
        {...props}
        aria-busy={loading || undefined}
        className="h-11 border-0 bg-transparent pr-11 pl-11 shadow-none focus-visible:ring-0 dark:bg-transparent [&::-webkit-search-cancel-button]:appearance-none"
        disabled={disabled}
        enterKeyHint="search"
        onChange={(event) => onValueChange(event.target.value)}
        readOnly={readOnly}
        ref={inputRef}
        type="search"
        value={value}
      />
      {loading ? (
        <Spinner
          aria-hidden="true"
          className="absolute top-1/2 right-3 size-4.5 -translate-y-1/2 text-muted-foreground"
        />
      ) : clearable ? (
        <Button
          aria-label="검색어 지우기"
          className="absolute top-1/2 right-2 size-7 -translate-y-1/2 rounded-full text-muted-foreground"
          onClick={() => {
            onValueChange("");
            onClear?.();
            inputRef.current?.focus();
          }}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <XCircleIcon aria-hidden="true" className="size-4.5" strokeWidth={2} weight="fill" />
        </Button>
      ) : null}
    </div>
  );
}

export { SearchField };
