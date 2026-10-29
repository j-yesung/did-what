"use client";

import { useEffect, useRef, useState } from "react";

import { DotsThreeIcon, type Icon } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/shared/lib/utils";
import { IconButton } from "@/shared/ui/icon-button";

import styles from "./journey-map.module.css";

type Action = { label: string; icon: Icon; onSelect: () => void };

const COLLAPSED_WIDTH = 52;

export function JourneyActions({ actions, hidden }: { actions: Action[]; hidden: boolean }) {
  const [open, setOpen] = useState(false);
  const [settled, setSettled] = useState(true);
  const root = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (hidden) setOpen(false);
  }, [hidden]);

  useEffect(() => {
    if (open) root.current?.querySelector<HTMLElement>("[data-action]")?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <motion.div
      ref={root}
      animate={{ width: open ? "auto" : COLLAPSED_WIDTH }}
      onAnimationComplete={() => {
        if (!open) setSettled(true);
      }}
      className={cn(styles.actions, styles.menu, "app-toolbar liquid-glass-control")}
      data-hidden={hidden ? "" : undefined}
      inert={hidden}
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
        className={styles.menuItems}
        inert={!open}
        initial={false}
        transition={{ duration: reduceMotion ? 0.1 : open ? 0.15 : 0.08, delay: open && !reduceMotion ? 0.05 : 0 }}
      >
        {actions.map((action) => (
          <IconButton
            key={action.label}
            aria-label={action.label}
            className="rounded-full text-foreground"
            data-action=""
            icon={action.icon}
            onClick={() => {
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
  );
}
