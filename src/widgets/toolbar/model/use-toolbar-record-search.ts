import { type FocusEvent, type KeyboardEvent, useRef, useState } from "react";

import { usePathname, useSearchParams } from "next/navigation";

import { applyRecordSearch, clearRecordSearch, readRecordQuery } from "@/entities/record";

const RECORDS_PATH = "/records";
const ROW_WIDTH = "100cqw";

const measureContentWidth = (element: HTMLElement) => {
  const style = getComputedStyle(element);
  return element.clientWidth - Number.parseFloat(style.paddingLeft) - Number.parseFloat(style.paddingRight);
};

export const useToolbarRecordSearch = () => {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const search = searchParams?.toString() ?? "";
  const searchable = pathname === RECORDS_PATH;
  const query = searchable ? readRecordQuery(searchParams) : "";

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(query);
  const [synced, setSynced] = useState({ pathname, query });
  if (synced.pathname !== pathname || synced.query !== query) {
    if (synced.pathname !== pathname) setEditing(false);
    setSynced({ pathname, query });
    setDraft(query);
  }
  const open = searchable && (editing || Boolean(query));
  const [width, setWidth] = useState<number | string>(ROW_WIDTH);

  const rowRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const openSearch = () => {
    if (rowRef.current) setWidth(measureContentWidth(rowRef.current));
    setEditing(true);
    inputRef.current?.focus({ preventScroll: true });
  };

  const closeSearch = () => {
    setEditing(false);
    setDraft("");
    if (query) clearRecordSearch(window.history, search);
    triggerRef.current?.focus({ preventScroll: true });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") return closeSearch();
    if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
    event.preventDefault();
    const nextQuery = draft.trim();
    if (nextQuery && nextQuery !== query) applyRecordSearch(window.history, search, nextQuery);
    else if (!nextQuery && query) clearRecordSearch(window.history, search);
    setEditing(false);
    event.currentTarget.blur();
  };

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    if (draft.trim() || query || event.currentTarget.parentElement?.contains(event.relatedTarget)) return;
    setEditing(false);
  };

  const handleWidthSettled = () => {
    if (open) setWidth(ROW_WIDTH);
  };

  return {
    draft,
    handleBlur,
    handleKeyDown,
    handleWidthSettled,
    closeSearch,
    inputRef,
    open,
    openSearch,
    rowRef,
    searchable,
    setDraft,
    triggerRef,
    width: open ? width : "auto",
  };
};
