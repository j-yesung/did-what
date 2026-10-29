"use client";

import { useEffect, useRef, useState } from "react";

import { DotsThreeIcon, type Icon } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";

import { ICON_WEIGHT_MEDIUM } from "@/shared/lib/interaction";
import { cn } from "@/shared/lib/utils";
import { IconButton } from "@/shared/ui/icon-button";

import styles from "../journey-map.module.css";

type Action = { label: string; icon: Icon; onSelect: () => void; disabled?: boolean };

export function JourneyActions({ actions, hidden = false }: { actions: Action[]; hidden?: boolean }) {
  const [open, setOpen] = useState(false);
  const [settled, setSettled] = useState(true);
  const root = useRef<HTMLDivElement>(null);
  const more = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (hidden) setOpen(false);
  }, [hidden]);

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
          className={styles.menuBackdrop}
          aria-label="지도 메뉴 닫기"
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
          className={cn(styles.actions, styles.menu, "app-toolbar liquid-glass-control")}
          data-hidden={hidden ? "" : undefined}
          inert={hidden}
          initial={false}
          transition={
            reduceMotion ? { duration: 0 } : { type: "tween", duration: open ? 0.25 : 0.2, ease: [0.77, 0, 0.175, 1] }
          }
        >
          <motion.div
            animate={{ opacity: open ? 1 : 0 }}
            aria-hidden={!open}
            aria-label="기록 지도 메뉴"
            className={styles.menuItems}
            role="group"
            inert={!open}
            initial={false}
            transition={{ duration: reduceMotion ? 0.1 : open ? 0.15 : 0.08, delay: open && !reduceMotion ? 0.05 : 0 }}
          >
            {actions.map((action) => (
              <IconButton
                key={action.label}
                aria-label={action.label}
                className={cn("rounded-full text-foreground", ICON_WEIGHT_MEDIUM)}
                data-action=""
                disabled={action.disabled}
                icon={action.icon}
                onClick={() => {
                  returnFocus.current = true;
                  setOpen(false);
                  action.onSelect();
                }}
                size="lg"
              />
            ))}
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
              icon={DotsThreeIcon}
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
