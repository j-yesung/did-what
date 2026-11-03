"use client";

import { useEffect, useRef, useState } from "react";

import { DotsThreeIcon, type Icon } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";

import { FOCUS_RING, ICON_WEIGHT_MEDIUM } from "@/shared/lib/interaction";
import { cn } from "@/shared/lib/utils";
import { IconButton } from "@/shared/ui/icon-button";
import { PressLink } from "@/shared/ui/press-link";

export type MorphMenuAction = {
  label: string;
  icon?: Icon;
  description?: string;
  selected?: boolean;
  href?: string;
  onSelect?: () => void;
  disabled?: boolean;
  className?: string;
};

type MorphMenuProps = {
  actions: MorphMenuAction[];
  label: string;
  moreIcon?: Icon;
  layout?: "row" | "column";
  align?: "start" | "end";
  triggerLabel?: string;
  menuWidth?: number;
};

const EASE = [0.32, 0.72, 0, 1] as const;
const CLOSE_EASE = [0.4, 0, 0.2, 1] as const;
const CLOSE = { duration: 0.3, delay: 0.04 };
const SELECT_AFTER_CLOSE_MS = (CLOSE.delay + CLOSE.duration * 0.75) * 1000;
// 항목마다 흐림을 걸면 합성 비용이 항목 수만큼 늘어 긴 목록은 지도 위에서 끊긴다.
const MAX_BLURRED_ACTIONS = 6;

/** 더 보기 버튼이 옆으로 늘어나며 작업 아이콘을 펼친다. column은 아래로 늘어나며 아이콘과 문구를 세로로 펼친다. */
export function MorphMenu({
  actions,
  label,
  moreIcon = DotsThreeIcon,
  layout = "row",
  align = "end",
  triggerLabel = "더 보기",
  menuWidth,
}: MorphMenuProps) {
  const [open, setOpen] = useState(false);
  const [settled, setSettled] = useState(true);
  const root = useRef<HTMLDivElement>(null);
  const more = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef(false);
  const selectTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const reducedMotion = useReducedMotion();
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const reduceMotion = reducedMotion || (layout === "column" && keyboardOpen);
  const [closingActions, setClosingActions] = useState(actions);
  const visibleActions = open ? actions : closingActions;
  const blurred = visibleActions.length <= MAX_BLURRED_ACTIONS;

  useEffect(() => () => clearTimeout(selectTimer.current), []);

  useEffect(() => {
    if (open)
      (
        root.current?.querySelector<HTMLElement>('[aria-current="true"]') ??
        root.current?.querySelector<HTMLElement>("[data-action]")
      )?.focus();
    else if (returnFocus.current) {
      returnFocus.current = false;
      more.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      returnFocus.current = Boolean(root.current?.contains(document.activeElement));
      setClosingActions(actions);
      setOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open, actions]);

  const choose = (action: MorphMenuAction) => () => {
    returnFocus.current = !action.href;
    setClosingActions(actions);
    setOpen(false);
    if (layout === "column" && !reduceMotion && action.onSelect)
      selectTimer.current = setTimeout(action.onSelect, SELECT_AFTER_CLOSE_MS);
    else action.onSelect?.();
  };

  const backdrop = open && (
    <button
      type="button"
      tabIndex={-1}
      className="pointer-events-auto fixed inset-0 z-15 touch-none bg-transparent"
      aria-label={`${label} 닫기`}
      onPointerDown={(event) => event.preventDefault()}
      onClick={() => {
        returnFocus.current = true;
        setClosingActions(actions);
        setOpen(false);
      }}
    />
  );

  if (layout === "column")
    return (
      <>
        {backdrop}
        <div className={cn("pointer-events-auto relative size-(--toolbar-height)", open ? "z-20" : "z-10")}>
          <motion.div
            ref={root}
            animate={
              open
                ? { width: "auto", height: "auto" }
                : { width: "var(--toolbar-height)", height: "var(--toolbar-height)" }
            }
            className={cn(
              "app-toolbar liquid-glass-control absolute top-0 overflow-hidden rounded-[calc(var(--toolbar-height)/2)]",
              align === "start" ? "left-0 max-w-[calc(100vw-40px)]" : "right-0",
            )}
            initial={false}
            transition={
              reduceMotion ? { duration: 0 } : open ? { duration: 0.34, ease: EASE } : { ...CLOSE, ease: CLOSE_EASE }
            }
          >
            <motion.ul
              animate={open ? "open" : "closed"}
              aria-hidden={!open}
              aria-label={label}
              className={cn(
                "flex max-h-[min(360px,calc(100dvh-var(--page-top)-var(--nav-clearance)-16px))] flex-col overflow-y-auto overscroll-contain p-1.5 [scrollbar-width:none]!",
                // 바깥 상자의 기준이 트리거 크기라 너비를 주지 않으면 내용에 맞춰 늘어나지 못한다.
                !menuWidth && "w-max",
              )}
              style={menuWidth ? { width: `min(${menuWidth}px, calc(100vw - 160px))` } : undefined}
              inert={!open}
              initial={false}
              variants={{
                open: {
                  transition: {
                    staggerChildren: Math.min(0.035, 0.18 / Math.max(visibleActions.length - 1, 1)),
                    delayChildren: 0.06,
                  },
                },
                closed: {
                  transition: {
                    staggerChildren: Math.min(0.03, 0.12 / Math.max(visibleActions.length - 1, 1)),
                    staggerDirection: -1,
                  },
                },
              }}
            >
              {visibleActions.map((action) => {
                const Glyph = action.icon;
                const content = (
                  <>
                    {Glyph && <Glyph aria-hidden="true" size={20} />}
                    <span className={cn("min-w-0 flex-1", menuWidth && "truncate")}>{action.label}</span>
                    {action.description && (
                      <span className="shrink-0 whitespace-nowrap text-muted-foreground text-xs">
                        {action.description}
                      </span>
                    )}
                  </>
                );
                const className = cn(
                  "flex min-h-12 w-full items-center gap-3 whitespace-nowrap rounded-2xl px-3 py-3 text-left font-medium text-[15px] text-foreground transition-colors active:bg-foreground/10 disabled:pointer-events-none disabled:opacity-45",
                  FOCUS_RING,
                  action.selected && "bg-foreground/10",
                  action.className,
                );
                return (
                  <motion.li
                    key={action.label}
                    transition={
                      reduceMotion
                        ? { duration: 0 }
                        : open
                          ? { duration: 0.22, ease: EASE }
                          : { duration: 0.16, ease: CLOSE_EASE }
                    }
                    variants={{
                      open: { opacity: 1, scale: 1, y: 0, ...(blurred && { filter: "blur(0px)" }) },
                      closed: { opacity: 0, scale: 0.96, y: -4, ...(blurred && { filter: "blur(6px)" }) },
                    }}
                  >
                    {action.href ? (
                      <PressLink className={className} data-action="" href={action.href} onClick={choose(action)}>
                        {content}
                      </PressLink>
                    ) : (
                      <button
                        type="button"
                        className={className}
                        data-action=""
                        aria-current={action.selected ? "true" : undefined}
                        disabled={action.disabled}
                        onClick={choose(action)}
                      >
                        {content}
                      </button>
                    )}
                  </motion.li>
                );
              })}
            </motion.ul>
            <motion.div
              animate={{ opacity: open ? 0 : 1 }}
              aria-hidden={open}
              className={cn("absolute top-0", align === "start" ? "left-0" : "right-0")}
              inert={open}
              initial={false}
              transition={reduceMotion ? { duration: 0 } : open ? { duration: 0.12 } : { duration: 0.15, delay: 0.2 }}
            >
              <IconButton
                aria-expanded={open}
                ref={more}
                aria-label={triggerLabel}
                className={cn("size-(--toolbar-height) rounded-full text-foreground", ICON_WEIGHT_MEDIUM)}
                icon={moreIcon}
                iconSize={24}
                iconWeight="regular"
                onClick={(event) => {
                  clearTimeout(selectTimer.current);
                  setKeyboardOpen(event.detail === 0);
                  setOpen(true);
                }}
                size="lg"
              />
            </motion.div>
          </motion.div>
        </div>
      </>
    );

  return (
    <>
      {backdrop}
      <div className={cn("relative", open ? "z-20" : "z-10")}>
        <motion.div
          ref={root}
          animate={{ width: open ? "auto" : "var(--toolbar-height)" }}
          onAnimationComplete={() => {
            if (!open) setSettled(true);
          }}
          className="app-toolbar liquid-glass-control pointer-events-auto relative flex h-(--toolbar-height) items-center justify-end overflow-hidden rounded-full"
          initial={false}
          transition={
            reduceMotion
              ? { duration: 0 }
              : open
                ? { type: "spring", bounce: 0.35, visualDuration: 0.35 }
                : { type: "spring", bounce: 0, visualDuration: 0.2, delay: 0.06 }
          }
        >
          <motion.div
            animate={{ opacity: open ? 1 : 0 }}
            aria-hidden={!open}
            aria-label={label}
            className="flex shrink-0"
            role="group"
            inert={!open}
            initial={false}
            transition={{ duration: reduceMotion ? 0.1 : open ? 0.15 : 0.08, delay: open && !reduceMotion ? 0.05 : 0 }}
          >
            {actions.map((action) => {
              return (
                <IconButton
                  key={action.label}
                  aria-label={action.label}
                  className={cn("rounded-full text-foreground", ICON_WEIGHT_MEDIUM, action.className)}
                  data-action=""
                  disabled={action.disabled}
                  icon={action.icon ?? moreIcon}
                  onClick={choose(action)}
                  size="lg"
                  {...(action.href ? { nativeButton: false, render: <PressLink href={action.href} /> } : {})}
                />
              );
            })}
          </motion.div>

          <motion.div
            animate={{ opacity: open ? 0 : 1 }}
            aria-hidden={open}
            className={cn("shrink-0", (open || !settled) && "absolute top-0 right-0")}
            inert={open}
            initial={false}
            transition={reduceMotion ? { duration: 0 } : open ? { duration: 0.12 } : { duration: 0.15, delay: 0.1 }}
          >
            <IconButton
              aria-expanded={open}
              ref={more}
              aria-label={triggerLabel}
              className={cn("size-(--toolbar-height) rounded-full text-foreground", ICON_WEIGHT_MEDIUM)}
              icon={moreIcon}
              iconSize={24}
              iconWeight="regular"
              onClick={() => {
                setSettled(false);
                setOpen(true);
              }}
              size="lg"
            />
          </motion.div>
        </motion.div>
      </div>
    </>
  );
}
