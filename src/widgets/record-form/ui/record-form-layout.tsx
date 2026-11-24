"use client";

import type { ReactNode } from "react";

import { useKeyboardInset } from "@/shared/lib/use-keyboard-inset";
import { cn } from "@/shared/lib/utils";
import { BackButton } from "@/shared/ui/back-button";

type RecordFormLayoutProps = {
  backDisabled?: boolean;
  children: ReactNode;
  footer: ReactNode;
  onBack: () => void;
  title: string;
};

export function RecordFormLayout({ backDisabled, children, footer, onBack, title }: RecordFormLayoutProps) {
  const keyboardInset = useKeyboardInset();

  return (
    <div
      className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] bg-background"
      style={keyboardInset > 0 ? { paddingBottom: keyboardInset } : undefined}
    >
      <header className="border-b bg-background px-5 pt-[calc(10px+env(safe-area-inset-top))] pb-3">
        <div className="grid min-h-(--toolbar-height) grid-cols-[var(--toolbar-height)_1fr_var(--toolbar-height)] items-center">
          <BackButton aria-label="이전으로" disabled={backDisabled} onClick={onBack} />
          <h1 className="text-center font-bold text-lg tracking-[-0.03em]">{title}</h1>
          <span aria-hidden="true" />
        </div>
      </header>

      <div className="min-h-0 overflow-y-auto overscroll-contain px-5 py-7">{children}</div>

      <footer
        className={cn(
          "bg-background px-5 pt-3",
          keyboardInset > 0 ? "pb-3" : "pb-[max(--spacing(4),env(safe-area-inset-bottom))]",
        )}
      >
        {footer}
      </footer>
    </div>
  );
}
