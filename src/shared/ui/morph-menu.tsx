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
  icon: Icon;
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
};

const EASE = [0.32, 0.72, 0, 1] as const;
const CLOSE_EASE = [0.4, 0, 0.2, 1] as const;

/** 더 보기 버튼이 옆으로 늘어나며 작업 아이콘을 펼친다. column은 아래로 늘어나며 아이콘과 문구를 세로로 펼친다. */
export function MorphMenu({ actions, label, moreIcon = DotsThreeIcon, layout = "row" }: MorphMenuProps) {
  const [open, setOpen] = useState(false);
  const [settled, setSettled] = useState(true);
  const root = useRef<HTMLDivElement>(null);
  const more = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (open) root.current?.querySelector<HTMLElement>("[data-action]")?.focus();
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
      setOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const choose = (action: MorphMenuAction) => () => {
    returnFocus.current = !action.href;
    setOpen(false);
    action.onSelect?.();
  };

  const backdrop = open && (
    <button
      type="button"
      tabIndex={-1}
      className="pointer-events-auto fixed inset-0 z-0 touch-none bg-transparent"
      aria-label={`${label} 닫기`}
      onPointerDown={(event) => event.preventDefault()}
      onClick={() => {
        returnFocus.current = true;
        setOpen(false);
      }}
    />
  );

  if (layout === "column")
    return (
      <>
        {backdrop}
        <div className="pointer-events-auto relative z-10 size-(--toolbar-height)">
          <motion.div
            ref={root}
            animate={
              open
                ? { width: "auto", height: "auto" }
                : { width: "var(--toolbar-height)", height: "var(--toolbar-height)" }
            }
            className="app-toolbar liquid-glass-control absolute top-0 right-0 overflow-hidden rounded-[calc(var(--toolbar-height)/2)]"
            initial={false}
            transition={
              reduceMotion
                ? { duration: 0 }
                : open
                  ? { duration: 0.34, ease: EASE }
                  : { duration: 0.3, ease: CLOSE_EASE, delay: 0.04 }
            }
          >
            <motion.ul
              animate={open ? "open" : "closed"}
              aria-hidden={!open}
              aria-label={label}
              className="flex flex-col p-1.5"
              inert={!open}
              initial={false}
              variants={{
                open: { transition: { staggerChildren: 0.035, delayChildren: 0.06 } },
                closed: { transition: { staggerChildren: 0.03, staggerDirection: -1 } },
              }}
            >
              {actions.map((action) => {
                const Glyph = action.icon;
                const content = (
                  <>
                    <Glyph aria-hidden="true" size={20} />
                    {action.label}
                  </>
                );
                const className = cn(
                  "flex h-12 w-full items-center gap-3 whitespace-nowrap rounded-2xl px-3 text-left font-medium text-[15px] text-foreground transition-colors active:bg-foreground/10 disabled:pointer-events-none disabled:opacity-45",
                  FOCUS_RING,
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
                      open: { opacity: 1, scale: 1, y: 0, filter: "blur(0px)" },
                      closed: { opacity: 0, scale: 0.96, y: -4, filter: "blur(6px)" },
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
              className="absolute top-0 right-0"
              inert={open}
              initial={false}
              transition={reduceMotion ? { duration: 0 } : open ? { duration: 0.12 } : { duration: 0.15, delay: 0.2 }}
            >
              <IconButton
                aria-expanded={open}
                ref={more}
                aria-label="더 보기"
                className={cn("size-(--toolbar-height) rounded-full text-foreground", ICON_WEIGHT_MEDIUM)}
                icon={moreIcon}
                iconSize={27}
                iconWeight="regular"
                onClick={() => setOpen(true)}
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
      <div className="relative z-10">
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
                  icon={action.icon}
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
              aria-label="더 보기"
              className={cn("size-(--toolbar-height) rounded-full text-foreground", ICON_WEIGHT_MEDIUM)}
              icon={moreIcon}
              iconSize={27}
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
