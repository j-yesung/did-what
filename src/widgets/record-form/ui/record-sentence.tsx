"use client";

import { type ComponentProps, type ReactNode, type Ref, useEffect, useRef, useState } from "react";

import { Popover } from "@base-ui/react/popover";
import { MapPinIcon } from "@phosphor-icons/react";

import {
  DEFAULT_RECORD_CATEGORY,
  getRecordRegionKey,
  MAX_ACTIVITY_LENGTH,
  RECORD_CATEGORY_DOT,
  RECORD_CATEGORY_FILL,
  RECORD_CATEGORY_OPTIONS,
  RECORD_WEATHER_OPTIONS,
  type RecordCategory,
  type RecordWeather,
  WeatherIcon,
} from "@/entities/record";
import { getRecordCategoryLabel, RECORD_CATEGORY_BADGE } from "@/entities/record/model/category";
import { RECORD_CATEGORY_ICON } from "@/entities/record/ui/category-icon";
import { toVisitedRegions } from "@/features/record/select-record-location/model/location-picker";
import { FOCUS_RING, PRESS_FEEDBACK } from "@/shared/lib/interaction";
import { cn } from "@/shared/lib/utils";

import type { RecordFormDraft, RecordFormSlot } from "../model/record-form-draft";
import {
  formatRecordDateSlot,
  getDirectionParticle,
  getRecordLocationSummary,
  RECORD_WEATHER_PHRASE,
} from "../model/record-sentence";

const SHAKE_KEYFRAMES = [0, -6, 6, -4, 4, 0].map((x) => ({ transform: `translateX(${x}px)` }));

type SheetSlot = "date" | "where";

type RecordSentenceProps = {
  activityRef: Ref<HTMLTextAreaElement>;
  categoryFinalFocus: FinalFocus;
  categoryOpen: boolean;
  draft: RecordFormDraft;
  errorSlots: RecordFormSlot[];
  hint?: string;
  onActivityChange: (activity: string) => void;
  onCategoryChange: (category: RecordCategory[]) => void;
  onCategoryOpenChange: (open: boolean) => void;
  onOpen: (slot: SheetSlot) => void;
  onWeatherChange: (weather: RecordWeather) => void;
  shakeKey: number;
  today: string;
};

export function RecordSentence({
  activityRef,
  categoryFinalFocus,
  categoryOpen,
  draft,
  errorSlots,
  hint,
  onActivityChange,
  onCategoryChange,
  onCategoryOpenChange,
  onOpen,
  onWeatherChange,
  shakeKey,
  today,
}: RecordSentenceProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!shakeKey || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    for (const element of rootRef.current?.querySelectorAll<HTMLElement>("[data-invalid]") ?? []) {
      element.animate(SHAKE_KEYFRAMES, { duration: 360, easing: "ease-out" });
    }
  }, [shakeKey]);

  const date = formatRecordDateSlot(draft.recordedAt, draft.recordedUntil, today);
  const location = getRecordLocationSummary(draft.regions, draft.places);
  const categoryValue = draft.category[0];
  const category = categoryValue ? getRecordCategoryLabel(categoryValue) : null;
  const visitedRegions = draft.places.length ? toVisitedRegions(draft.regions, draft.places) : [];
  const invalid = (slot: RecordFormSlot) => errorSlots.includes(slot);

  return (
    <div ref={rootRef}>
      <div className="break-keep font-[760] text-[clamp(24px,7.2vw,30px)] leading-[1.75] tracking-[-0.045em]">
        <p>
          <SentenceSlot
            empty={!date}
            invalid={invalid("date")}
            label={date ? `날짜: ${date}` : "날짜 고르기"}
            onClick={() => onOpen("date")}
          >
            {date ?? "언제"}
          </SentenceSlot>{" "}
          <WeatherSlot invalid={invalid("weather")} onChange={onWeatherChange} weather={draft.weather} />,
        </p>
        <p>
          <SentenceSlot
            empty={!location}
            invalid={invalid("where")}
            label={
              location
                ? `다녀온 곳: ${location.name}${location.more ? ` 외 ${location.more}곳` : ""}`
                : "다녀온 곳 고르기"
            }
            onClick={() => onOpen("where")}
          >
            {location ? (
              <>
                <span className="min-w-0 truncate">{location.name}</span>
                {location.more ? <span className="ml-[0.25em] shrink-0 opacity-65">외 {location.more}곳</span> : null}
              </>
            ) : (
              "어디"
            )}
          </SentenceSlot>
          에서
        </p>
        <p>
          <SlotPopover
            className={getSlotClassName(
              invalid("category"),
              !category,
              categoryValue && RECORD_CATEGORY_BADGE[categoryValue],
            )}
            finalFocus={categoryFinalFocus}
            invalid={invalid("category")}
            label={category ? `카테고리: ${category}` : "카테고리 고르기"}
            onOpenChange={onCategoryOpenChange}
            open={categoryOpen}
            popupLabel="카테고리"
            trigger={category ?? "무슨 일"}
          >
            <div className="flex gap-0.5 px-1.5 pt-3 pb-2.5">
              {RECORD_CATEGORY_OPTIONS.filter((option) => option.value !== DEFAULT_RECORD_CATEGORY).map((option) => {
                const selected = option.value === categoryValue;
                const { color, Icon } = RECORD_CATEGORY_ICON[option.value];
                return (
                  <button
                    aria-pressed={selected}
                    className={cn(
                      "flex w-14 flex-col items-center gap-1.5 rounded-xl py-1 font-semibold text-[11px] text-muted-foreground after:inset-0",
                      FOCUS_RING,
                      PRESS_FEEDBACK,
                      selected && "text-foreground",
                    )}
                    key={option.value}
                    onClick={() => {
                      onCategoryChange(selected ? [] : [option.value]);
                      onCategoryOpenChange(false);
                    }}
                    type="button"
                  >
                    <span
                      className={cn(
                        "grid size-11 place-items-center rounded-full transition-colors",
                        selected
                          ? [RECORD_CATEGORY_DOT[option.value], "text-background"]
                          : [RECORD_CATEGORY_FILL[option.value], color],
                      )}
                    >
                      <Icon aria-hidden="true" className="size-5.5" weight="fill" />
                    </span>
                    {option.label}
                  </button>
                );
              })}
            </div>
          </SlotPopover>
          {getDirectionParticle(category ?? "무슨 일")}
        </p>
        <textarea
          aria-describedby={hint ? "record-form-hint" : undefined}
          aria-invalid={invalid("activity")}
          aria-label="뭐 했는지"
          className={cn(
            "field-sizing-content mt-1 block w-full resize-none rounded-none border-primary border-b-2 bg-transparent p-0 outline-none placeholder:text-muted-foreground/60",
            invalid("activity") && "border-destructive placeholder:text-destructive/60",
          )}
          data-invalid={invalid("activity") || undefined}
          enterKeyHint="done"
          maxLength={MAX_ACTIVITY_LENGTH}
          onChange={(event) => onActivityChange(event.currentTarget.value.replace(/\n/g, " "))}
          onKeyDown={(event) => {
            if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
            event.preventDefault();
            event.currentTarget.blur();
          }}
          placeholder="뭐했어?"
          ref={activityRef}
          rows={1}
          value={draft.activity}
        />
      </div>

      {visitedRegions.length ? (
        <button
          aria-label={`방문 지역: ${visitedRegions.map((region) => region.label).join(", ")}`}
          className={cn(
            "mt-5 flex flex-wrap items-center gap-1.5 rounded-lg text-left after:-inset-1",
            FOCUS_RING,
            PRESS_FEEDBACK,
          )}
          onClick={() => onOpen("where")}
          type="button"
        >
          <MapPinIcon aria-hidden="true" className="size-4 text-muted-foreground" weight="fill" />
          {visitedRegions.map((region) => (
            <span
              className="rounded-full border border-border px-2.5 py-0.5 font-semibold text-[13px]"
              key={getRecordRegionKey(region)}
            >
              {region.label}
            </span>
          ))}
        </button>
      ) : null}

      {hint ? (
        <p aria-live="polite" className="mt-4 text-destructive text-sm" id="record-form-hint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type SentenceSlotProps = {
  children: ReactNode;
  empty?: boolean;
  invalid: boolean;
  label: string;
  onClick: () => void;
};

const getSlotClassName = (invalid: boolean, empty?: boolean, tone?: string) =>
  cn(
    "inline-flex max-w-[calc(100%-2.2em)] items-center rounded-[0.35em] bg-secondary px-[0.28em] py-[0.06em] align-baseline text-accent-text leading-[1.3] after:inset-0",
    FOCUS_RING,
    PRESS_FEEDBACK,
    tone,
    empty && "bg-muted text-muted-foreground/60",
    invalid && "bg-destructive/10 text-destructive ring-2 ring-destructive",
  );

function SentenceSlot({ children, empty, invalid, label, onClick }: SentenceSlotProps) {
  return (
    <button
      aria-haspopup="dialog"
      aria-label={label}
      className={getSlotClassName(invalid, empty)}
      data-invalid={invalid || undefined}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

type WeatherSlotProps = {
  invalid: boolean;
  onChange: (weather: RecordWeather) => void;
  weather: RecordWeather;
};

function WeatherSlot({ invalid, onChange, weather }: WeatherSlotProps) {
  const [open, setOpen] = useState(false);

  return (
    <SlotPopover
      className={getSlotClassName(invalid)}
      invalid={invalid}
      label={`날씨: ${RECORD_WEATHER_PHRASE[weather]}`}
      onOpenChange={setOpen}
      open={open}
      popupLabel="날씨"
      trigger={RECORD_WEATHER_PHRASE[weather]}
    >
      <div className="flex gap-0.5 p-1.5">
        {RECORD_WEATHER_OPTIONS.map((option) => {
          const selected = option.value === weather;
          return (
            <button
              aria-pressed={selected}
              className={cn(
                "flex h-14 w-12 flex-col items-center justify-center gap-0.5 rounded-xl font-semibold text-[11px] text-muted-foreground after:inset-0",
                FOCUS_RING,
                PRESS_FEEDBACK,
                selected && "bg-secondary text-accent-text",
              )}
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              type="button"
            >
              <WeatherIcon
                aria-hidden="true"
                className={cn("size-6", selected ? "text-accent-text" : "text-foreground")}
                weather={option.value}
              />
              {option.label}
            </button>
          );
        })}
      </div>
    </SlotPopover>
  );
}

type FinalFocus = ComponentProps<typeof Popover.Popup>["finalFocus"];

type SlotPopoverProps = {
  children: ReactNode;
  className: string;
  finalFocus?: FinalFocus;
  invalid: boolean;
  label: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  popupLabel: string;
  trigger: ReactNode;
};

function SlotPopover({
  children,
  className,
  finalFocus,
  invalid,
  label,
  onOpenChange,
  open,
  popupLabel,
  trigger,
}: SlotPopoverProps) {
  return (
    <Popover.Root onOpenChange={onOpenChange} open={open}>
      <Popover.Trigger aria-label={label} className={className} data-invalid={invalid || undefined}>
        {trigger}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner className="z-50" collisionPadding={16} disableAnchorTracking sideOffset={8}>
          <Popover.Popup
            aria-label={popupLabel}
            className="origin-(--transform-origin) rounded-2xl border border-border bg-popover text-popover-foreground shadow-(--shadow-toast) outline-none transition-[transform,opacity] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] data-ending-style:scale-95 data-starting-style:scale-90 data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none"
            finalFocus={finalFocus}
          >
            {children}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
