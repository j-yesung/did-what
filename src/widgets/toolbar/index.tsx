"use client";

import { MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";
import { Glass } from "glisse";
import { motion, type Transition, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";

import { RecordCreateButton } from "@/entities/record";
import { ICON_WEIGHT_MEDIUM } from "@/shared/lib/interaction";
import { cn } from "@/shared/lib/utils";
import { IconButton } from "@/shared/ui/icon-button";
import { FixedToolbar } from "@/shared/ui/layouts";
import { PressScale, PressScaleExempt } from "@/shared/ui/press-scale";
import { useToolbarRecordSearch } from "@/widgets/toolbar/model/use-toolbar-record-search";
import { NotificationBell } from "@/widgets/toolbar/notification-bell";

const TOOLBAR_ENTRY_PATHS = new Set(["/", "/records", "/places", "/settings"]);
const OPEN_SPRING: Transition = { type: "spring", bounce: 0, visualDuration: 0.3 };
const CLOSE_SPRING: Transition = { type: "spring", bounce: 0, visualDuration: 0.2, delay: 0.06 };
const INSTANT: Transition = { duration: 0 };
const MotionGlass = motion.create(Glass);

export function Toolbar({ memberId }: { memberId: string }) {
  const pathname = usePathname() ?? "";
  const reduceMotion = useReducedMotion();
  const search = useToolbarRecordSearch();
  const { open, searchable } = search;

  if (!TOOLBAR_ENTRY_PATHS.has(pathname)) return null;

  const transition = (openTransition: Transition, closeTransition: Transition) =>
    reduceMotion ? INSTANT : open ? openTransition : closeTransition;

  return (
    <FixedToolbar className="@container items-start" ref={search.rowRef}>
      <PressScale aria-label="빠른 작업" className="pointer-events-auto ml-auto" disabled={open} role="group">
        <MotionGlass
          animate={{ width: search.width }}
          className="toolbar relative ml-auto flex h-(--toolbar-height) items-center justify-between gap-1 overflow-hidden rounded-full"
          data-record-search={open ? "open" : undefined}
          initial={false}
          onAnimationComplete={search.handleWidthSettled}
          transition={transition(OPEN_SPRING, CLOSE_SPRING)}
        >
          {searchable ? (
            <>
              <PressScaleExempt className="shrink-0">
                <IconButton
                  aria-expanded={open}
                  aria-label="기록 검색"
                  className={cn(
                    "size-11 shrink-0 rounded-full text-foreground aria-expanded:bg-transparent",
                    ICON_WEIGHT_MEDIUM,
                  )}
                  icon={MagnifyingGlassIcon}
                  iconSize={24}
                  iconWeight="regular"
                  onClick={search.openSearch}
                  ref={search.triggerRef}
                  size="lg"
                />
              </PressScaleExempt>
              <motion.input
                animate={{ opacity: open ? 1 : 0 }}
                aria-hidden={!open}
                aria-label="기록 검색어"
                className={cn(
                  "absolute inset-y-0 right-11 left-11 min-w-0 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:appearance-none",
                  !open && "pointer-events-none",
                )}
                enterKeyHint="search"
                initial={false}
                maxLength={100}
                onBlur={search.handleBlur}
                onChange={(event) => search.setDraft(event.target.value)}
                onKeyDown={search.handleKeyDown}
                placeholder="활동, 메모, 장소, 지역으로 검색"
                ref={search.inputRef}
                tabIndex={open ? 0 : -1}
                transition={transition({ duration: 0.18, delay: 0.05 }, { duration: 0.08 })}
                type="search"
                value={search.draft}
              />
            </>
          ) : null}

          <motion.div
            animate={{ opacity: open ? 0 : 1 }}
            className="flex shrink-0 items-center gap-1"
            inert={open}
            initial={false}
            transition={transition({ duration: 0.08 }, { duration: 0.15, delay: 0.1 })}
          >
            <RecordCreateButton className="size-11 [&_svg]:size-6" surface="group" />
            <NotificationBell memberId={memberId} />
          </motion.div>

          {searchable ? (
            <motion.div
              animate={{ opacity: open ? 1 : 0, scale: open ? 1 : 0.6 }}
              className="absolute top-0 right-0"
              inert={!open}
              initial={false}
              transition={transition(
                { type: "spring", bounce: 0, visualDuration: 0.2, delay: 0.08 },
                { duration: 0.08 },
              )}
            >
              <IconButton
                aria-label="검색 닫기"
                className="size-11 rounded-full text-muted-foreground"
                icon={XIcon}
                iconSize={20}
                onClick={search.closeSearch}
                size="lg"
              />
            </motion.div>
          ) : null}
        </MotionGlass>
      </PressScale>
    </FixedToolbar>
  );
}
