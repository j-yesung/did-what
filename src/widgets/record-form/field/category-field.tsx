"use client";

import { useState } from "react";

import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup } from "@base-ui/react/toggle-group";

import {
  DEFAULT_RECORD_CATEGORY,
  normalizeRecordCategories,
  RECORD_CATEGORY_DOT,
  RECORD_CATEGORY_OPTIONS,
  RECORD_CATEGORY_SELECTED,
  type RecordCategory,
} from "@/entities/record";
import { FOCUS_RING, PRESS_FEEDBACK } from "@/shared/lib/interaction";
import { cn } from "@/shared/lib/utils";
import { Field, FieldDescription, FieldError, FieldTitle } from "@/shared/ui/field";

type RecordCategoryFieldProps = {
  categoryError?: string;
  initialCategory?: RecordCategory[];
  onChange?: (category: RecordCategory[]) => void;
};

export function RecordCategoryField({ categoryError, initialCategory = [], onChange }: RecordCategoryFieldProps) {
  const [category, setCategory] = useState(() => normalizeRecordCategories(initialCategory));
  const invalid = Boolean(categoryError);

  const handleCategoryChange = (values: string[]) => {
    const nextCategory = normalizeRecordCategories(values);
    setCategory(nextCategory);
    onChange?.(nextCategory);
  };

  return (
    <Field data-invalid={invalid}>
      <div className="flex items-center justify-between gap-2">
        <FieldTitle className="font-semibold text-base" id="record-category-label">
          카테고리
        </FieldTitle>
        <span aria-live="polite" className="text-accent-text text-xs">
          {category.length ? `${category.length}개 선택` : "여러 개 선택 가능"}
        </span>
      </div>
      <FieldDescription id="record-category-description">이날에 어울리는 카테고리를 모두 골라주세요.</FieldDescription>
      <input name="category" type="hidden" value={JSON.stringify(category)} />
      <ToggleGroup
        aria-describedby={cn("record-category-description record-category-hint", categoryError && "category-error")}
        aria-invalid={invalid}
        aria-labelledby="record-category-label"
        className="mt-1 flex flex-wrap gap-2"
        multiple
        onValueChange={handleCategoryChange}
        tabIndex={-1}
        value={category}
      >
        {RECORD_CATEGORY_OPTIONS.filter((option) => option.value !== DEFAULT_RECORD_CATEGORY).map((option) => (
          <Toggle
            className={cn(
              "inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 font-medium text-foreground text-sm after:inset-0 data-pressed:font-semibold",
              FOCUS_RING,
              PRESS_FEEDBACK,
              RECORD_CATEGORY_SELECTED[option.value],
              invalid && "border-destructive",
            )}
            key={option.value}
            type="button"
            value={option.value}
          >
            <span
              aria-hidden="true"
              className={cn("size-2 shrink-0 rounded-full", RECORD_CATEGORY_DOT[option.value])}
            />
            {option.label}
          </Toggle>
        ))}
      </ToggleGroup>
      <FieldDescription className="mt-1 text-xs" id="record-category-hint">
        선택하지 않으면 미분류로 남아요.
      </FieldDescription>
      <FieldError id="category-error">{categoryError}</FieldError>
    </Field>
  );
}
