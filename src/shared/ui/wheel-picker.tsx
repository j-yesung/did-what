"use client";

import { type KeyboardEvent, useId, useLayoutEffect, useRef } from "react";

import { cn } from "@/shared/lib/utils";

const ITEM_HEIGHT = 40;
const SETTLE_DELAY = 120;
const TILT_PER_ITEM = 18;

type WheelOption = { label: string; value: number };

type WheelPickerProps = {
  "aria-label": string;
  className?: string;
  onValueChange: (value: number) => void;
  options: WheelOption[];
  value: number;
};

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function WheelPicker({ "aria-label": ariaLabel, className, onValueChange, options, value }: WheelPickerProps) {
  const id = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const frame = useRef(0);
  const mounted = useRef(false);
  const scrolling = useRef(false);
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );

  const paint = () => {
    const list = listRef.current;
    if (!list) return;
    const center = list.scrollTop / ITEM_HEIGHT;
    for (const [index, item] of [...list.children].entries()) {
      const offset = index - center;
      const distance = Math.min(Math.abs(offset), 2.5);
      const style = (item as HTMLElement).style;
      style.opacity = String(1 - distance * 0.32);
      style.transform = `rotateX(${-offset * TILT_PER_ITEM}deg) scale(${1 - distance * 0.05})`;
    }
  };

  const scrollToIndex = (index: number, smooth: boolean) => {
    listRef.current?.scrollTo({
      behavior: smooth && !prefersReducedMotion() ? "smooth" : "instant",
      top: index * ITEM_HEIGHT,
    });
    paint();
  };

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list || scrolling.current) return;
    if (Math.round(list.scrollTop / ITEM_HEIGHT) !== selectedIndex) scrollToIndex(selectedIndex, mounted.current);
    else paint();
    mounted.current = true;
  });

  const settle = () => {
    scrolling.current = false;
    const list = listRef.current;
    if (!list) return;
    const index = Math.min(options.length - 1, Math.max(0, Math.round(list.scrollTop / ITEM_HEIGHT)));
    if (options[index] && options[index].value !== value) onValueChange(options[index].value);
  };

  const handleScroll = () => {
    scrolling.current = true;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(paint);
    clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(settle, SETTLE_DELAY);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const next = {
      ArrowDown: selectedIndex + 1,
      ArrowUp: selectedIndex - 1,
      End: options.length - 1,
      Home: 0,
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    const option = options[Math.min(options.length - 1, Math.max(0, next))];
    if (option) onValueChange(option.value);
  };

  return (
    <div className={cn("relative h-50", className)}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-20 h-10 rounded-xl bg-muted"
        data-slot="wheel-picker-band"
      />
      <div
        aria-activedescendant={`${id}-${value}`}
        aria-label={ariaLabel}
        className="relative h-full snap-y snap-mandatory overflow-y-auto overscroll-contain py-20 outline-none [mask-image:linear-gradient(transparent,black_30%,black_70%,transparent)] [perspective:400px] [scrollbar-width:none] focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-scrollbar]:hidden"
        onKeyDown={handleKeyDown}
        onScroll={handleScroll}
        ref={listRef}
        role="listbox"
        tabIndex={0}
      >
        {options.map((option, index) => (
          <div
            aria-selected={option.value === value}
            className="flex h-10 cursor-pointer snap-center items-center justify-center font-semibold text-[19px] tabular-nums"
            id={`${id}-${option.value}`}
            key={option.value}
            onClick={() => scrollToIndex(index, true)}
            role="option"
          >
            {option.label}
          </div>
        ))}
      </div>
    </div>
  );
}
