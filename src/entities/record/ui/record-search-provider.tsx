"use client";

import type { KeyboardEvent } from "react";
import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from "react";

import { usePathname, useSearchParams } from "next/navigation";

import { parseRecordFilters, readRecordQuery } from "../model/record-filters";
import { applyRecordSearch, beginRecordSearch, clearRecordSearch } from "../model/record-search";

const useSearchState = () => {
  const pathname = usePathname();
  const params = useSearchParams();
  const search = params?.toString() ?? "";
  const searchable = pathname === "/records";
  const query = searchable ? readRecordQuery(params) : "";
  const open = searchable && Boolean(params?.has("search") || query);
  const [draft, setDraft] = useState(query);
  const [synced, setSynced] = useState({ pathname, query });
  if (synced.pathname !== pathname || synced.query !== query) {
    setSynced({ pathname, query });
    setDraft(query);
  }
  const [width, setWidth] = useState<number | string>("100cqw");
  const rowRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const nextQuery = parseRecordFilters({ q: draft }).query;
  useEffect(() => {
    if (!open && document.activeElement === inputRef.current) triggerRef.current?.focus({ preventScroll: true });
  }, [open]);

  const openSearch = () => {
    if (!open) setDraft(query);
    const row = rowRef.current;
    if (row) {
      const style = getComputedStyle(row);
      setWidth(row.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight));
    }
    if (!open) beginRecordSearch(window.history, search);
    inputRef.current?.focus({ preventScroll: true });
  };
  const closeSearch = () => {
    clearRecordSearch(window.history, search);
    triggerRef.current?.focus({ preventScroll: true });
  };
  const clearDraft = () => {
    setDraft("");
    applyRecordSearch(window.history, search, "");
    inputRef.current?.focus({ preventScroll: true });
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "Escape") return closeSearch();
    if (event.key !== "Enter") return;
    event.preventDefault();
    applyRecordSearch(window.history, search, nextQuery);
  };
  return {
    query,
    draft,
    setDraft,
    open,
    searchable,
    rowRef,
    inputRef,
    triggerRef,
    openSearch,
    closeSearch,
    clearDraft,
    handleKeyDown,
    handleWidthSettled: () => {
      if (open) setWidth("100cqw");
    },
    width: open ? width : "auto",
  };
};
const SearchContext = createContext<ReturnType<typeof useSearchState> | null>(null);
export function RecordSearchProvider({ children }: { children: ReactNode }) {
  const value = useSearchState();
  return <SearchContext value={value}>{children}</SearchContext>;
}
export const useRecordSearch = () => {
  const value = useContext(SearchContext);
  if (!value) throw new Error("RecordSearchProvider is required");
  return value;
};
