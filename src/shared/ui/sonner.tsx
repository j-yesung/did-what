"use client";

import type { CSSProperties } from "react";

import { CheckCircleIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { Toaster as SonnerToaster, type ToasterProps } from "sonner";

const TOAST_OFFSET = "calc(76px + env(safe-area-inset-top))";
const TOAST_ICON_CLASS_NAME =
  "motion-safe:fade-in-0 motion-safe:zoom-in-50 motion-safe:slide-in-from-bottom-1 inline-flex motion-safe:animate-in motion-safe:fill-mode-both motion-safe:duration-300 motion-safe:delay-300 motion-safe:ease-out";
const TOAST_ICON_SIZE = 24;
const TOAST_TEXT_CLASS_NAME = "text-base leading-6!";

const TOAST_ICONS = {
  error: (
    <span className={TOAST_ICON_CLASS_NAME}>
      <WarningCircleIcon aria-hidden="true" className="text-destructive" size={TOAST_ICON_SIZE} weight="bold" />
    </span>
  ),
  success: (
    <span className={TOAST_ICON_CLASS_NAME}>
      <CheckCircleIcon aria-hidden="true" className="text-success" size={TOAST_ICON_SIZE} weight="bold" />
    </span>
  ),
};

const TOAST_CLASS_NAMES = {
  description: TOAST_TEXT_CLASS_NAME,
  icon: "mt-0.5 size-6!",
  title: TOAST_TEXT_CLASS_NAME,
  toast: "items-center!",
};
const TOAST_STYLE = {
  "--border-radius": "var(--radius-xl)",
  "--normal-bg": "var(--background)",
  "--normal-border": "var(--border)",
  "--normal-text": "var(--foreground)",
} as CSSProperties;

export function Toaster(props: ToasterProps) {
  return (
    <SonnerToaster
      icons={TOAST_ICONS}
      mobileOffset={{ top: TOAST_OFFSET }}
      offset={{ top: TOAST_OFFSET }}
      position="top-center"
      style={TOAST_STYLE}
      toastOptions={{ classNames: TOAST_CLASS_NAMES }}
      {...props}
    />
  );
}
