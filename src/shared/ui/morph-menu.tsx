"use client";

import { useEffect, useRef, useState } from "react";

import { DotsThreeIcon, type Icon } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";

import { ICON_WEIGHT_MEDIUM } from "@/shared/lib/interaction";
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
};

/** 더 보기 버튼이 옆으로 늘어나며 작업 아이콘을 펼친다. */
export function MorphMenu({ actions, label, moreIcon = DotsThreeIcon }: MorphMenuProps) {
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

  return (
    <>
      {open && (
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
      )}
      <div className="relative z-10">
        <motion.div
          ref={root}
          animate={{ width: open ? "auto" : "var(--toolbar-height)" }}
          onAnimationComplete={() => {
            if (!open) setSettled(true);
          }}
          className="app-toolbar liquid-glass-control pointer-events-auto relative flex h-(--toolbar-height) items-center justify-end overflow-hidden rounded-full p-0.5"
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
              const select = () => {
                returnFocus.current = !action.href;
                setOpen(false);
                action.onSelect?.();
              };
              return (
                <IconButton
                  key={action.label}
                  aria-label={action.label}
                  className={cn("rounded-full text-foreground", ICON_WEIGHT_MEDIUM, action.className)}
                  data-action=""
                  disabled={action.disabled}
                  icon={action.icon}
                  onClick={select}
                  size="lg"
                  {...(action.href ? { nativeButton: false, render: <PressLink href={action.href} /> } : {})}
                />
              );
            })}
          </motion.div>

          <motion.div
            animate={{ opacity: open ? 0 : 1 }}
            aria-hidden={open}
            className={cn("shrink-0", (open || !settled) && "absolute top-0.5 right-0.5")}
            inert={open}
            initial={false}
            transition={reduceMotion ? { duration: 0 } : open ? { duration: 0.12 } : { duration: 0.15, delay: 0.1 }}
          >
            <IconButton
              aria-expanded={open}
              ref={more}
              aria-label="더 보기"
              className="rounded-full text-foreground"
              icon={moreIcon}
              iconWeight="bold"
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
