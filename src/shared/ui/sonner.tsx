"use client";

import type { CSSProperties } from "react";

import { CheckCircleIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { Toaster as SonnerToaster, type ToasterProps } from "sonner";

const TOAST_OFFSET = "calc(76px + env(safe-area-inset-top))";
const TOAST_ICONS = {
  error: <WarningCircleIcon aria-hidden="true" className="text-destructive" strokeWidth={2} />,
  success: <CheckCircleIcon aria-hidden="true" className="text-success" strokeWidth={2} />,
};

const TOAST_CLASS_NAMES = {
  icon: "mt-0.5",
  toast: "items-start!",
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
