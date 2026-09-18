"use client";

import { useState } from "react";

import { CaretDownIcon } from "@phosphor-icons/react";

import {
  DEFAULT_RECORD_CATEGORY,
  getRecordCategoryLabel,
  isRecordCategory,
  RECORD_CATEGORY_DOT,
  RECORD_CATEGORY_OPTIONS,
  type RecordCategory,
} from "@/entities/record";
import { cn } from "@/shared/lib/utils";
import { Field, FieldError, FieldLabel } from "@/shared/ui/field";

type RecordCategoryFieldProps = {
  categoryError?: string;
  initialCategory?: RecordCategory;
  onChange?: (category: RecordCategory) => void;
};

/** option에는 색을 넣을 수 없어 네이티브 select를 투명하게 덮고 보이는 부분만 그린다. DateInput과 같은 구성. */
export function RecordCategoryField({
  categoryError,
  initialCategory = DEFAULT_RECORD_CATEGORY,
  onChange,
}: RecordCategoryFieldProps) {
  const [category, setCategory] = useState<RecordCategory>(initialCategory);
  const invalid = Boolean(categoryError);

  const handleCategoryChange = (nextCategory: string) => {
    if (!isRecordCategory(nextCategory)) return;
    setCategory(nextCategory);
    onChange?.(nextCategory);
  };

  return (
    <Field data-invalid={invalid}>
      <FieldLabel className="font-semibold text-base" htmlFor="category">
        카테고리
      </FieldLabel>
      <div
        className={cn(
          // select는 클릭에도 focus-visible이 붙어 링이 남는다. 설치형 전용이라 생략.
          "relative h-12 w-full rounded-lg border border-input transition-colors",
          invalid &&
            "border-destructive ring-3 ring-destructive/20 dark:border-destructive/50 dark:ring-destructive/40",
        )}
        data-slot="category-select-field"
      >
        <span aria-hidden="true" className="pointer-events-none flex h-full min-w-0 items-center gap-2 pr-10 pl-3">
          <span className={cn("size-2.5 shrink-0 rounded-full", RECORD_CATEGORY_DOT[category])} />
          <span className="truncate text-base md:text-sm">{getRecordCategoryLabel(category)}</span>
        </span>
        <CaretDownIcon
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <select
          aria-describedby={categoryError ? "category-error" : undefined}
          aria-invalid={invalid}
          className="absolute inset-0 size-full cursor-pointer appearance-none opacity-0"
          id="category"
          name="category"
          onChange={(event) => handleCategoryChange(event.currentTarget.value)}
          value={category}
        >
          {RECORD_CATEGORY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <FieldError id="category-error">{categoryError}</FieldError>
    </Field>
  );
}
