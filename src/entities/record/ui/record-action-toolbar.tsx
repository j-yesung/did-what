"use client";

import { type ReactNode, useRef, useState } from "react";

import { Menu } from "@base-ui/react/menu";
import { DotsThreeVerticalIcon, PencilSimpleIcon, TrashIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { cn } from "@/shared/lib/utils";
import { LiquidGlassButton } from "@/shared/ui/liquid-glass-button";
import { PressLink } from "@/shared/ui/press-link";
import { PressScale } from "@/shared/ui/press-scale";

const ITEM_CLASS =
  "flex min-h-12 cursor-pointer select-none items-center justify-between gap-6 rounded-2xl px-3 text-base outline-none data-highlighted:bg-foreground/5 [&_svg]:size-5 [&_svg]:shrink-0";

type RecordActionToolbarProps = {
  children?: ReactNode;
  disabled?: boolean;
  onDelete: () => void;
  recordId: string;
};

export function RecordActionToolbar({ children, disabled, onDelete, recordId }: RecordActionToolbarProps) {
  const [open, setOpen] = useState(false);
  const [toolbarHidden, setToolbarHidden] = useState(false);
  const [keyboardInteraction, setKeyboardInteraction] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const closed = { opacity: 0, scale: reducedMotion ? 1 : 0 };

  return (
    <Menu.Root
      onOpenChange={(nextOpen, details) => {
        const keyboard = details.event.type.startsWith("key");
        setKeyboardInteraction(keyboard);
        if (nextOpen || keyboard) setToolbarHidden(nextOpen);
        setOpen(nextOpen);
      }}
      open={open}
    >
      <div ref={toolbarRef}>
        <div aria-hidden={toolbarHidden} className={toolbarHidden ? "invisible" : undefined} inert={toolbarHidden}>
          <PressScale
            aria-label="상세 도구"
            className="app-toolbar liquid-glass-control pointer-events-auto flex items-center gap-1.5 rounded-full p-0.5"
            role="group"
          >
            {children}
            <Menu.Trigger
              aria-label="기록 더보기"
              disabled={disabled}
              render={<LiquidGlassButton className="size-12" shape="circle" surface="group" />}
              title="기록 더보기"
            >
              <DotsThreeVerticalIcon aria-hidden="true" weight="bold" />
            </Menu.Trigger>
          </PressScale>
        </div>
      </div>
      <AnimatePresence custom={keyboardInteraction} initial={false} onExitComplete={() => setToolbarHidden(false)}>
        {open ? (
          <Menu.Portal keepMounted>
            <Menu.Positioner
              align="end"
              anchor={toolbarRef}
              className="z-60"
              side="bottom"
              sideOffset={({ anchor }) => -anchor.height}
            >
              <Menu.Popup
                aria-label="기록 작업"
                className="liquid-glass-control motion-reduce:transform-none! w-52 max-w-(--available-width) origin-top-right rounded-3xl border border-border/50 bg-popover/90! p-1.5 text-foreground outline-none backdrop-blur-xl!"
                render={
                  <motion.div
                    animate={{ opacity: 1, scale: 1 }}
                    exit="closed"
                    initial={keyboardInteraction ? false : closed}
                    transition={keyboardInteraction ? { duration: 0 } : reducedMotion ? { duration: 0.1 } : undefined}
                    variants={{
                      closed: (keyboard: boolean) => ({
                        ...closed,
                        ...(keyboard ? { transition: { duration: 0 } } : {}),
                      }),
                    }}
                  />
                }
              >
                <Menu.Item className={ITEM_CLASS} render={<PressLink href={`/records/${recordId}/edit`} />}>
                  수정하기
                  <PencilSimpleIcon aria-hidden="true" />
                </Menu.Item>
                <Menu.Separator className="mx-3 h-px bg-border/60" />
                <Menu.Item className={cn(ITEM_CLASS, "text-destructive")} onClick={onDelete}>
                  삭제하기
                  <TrashIcon aria-hidden="true" />
                </Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        ) : null}
      </AnimatePresence>
    </Menu.Root>
  );
}
