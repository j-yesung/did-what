"use client";

import type { ComponentProps } from "react";

import { usePathname, useSearchParams } from "next/navigation";

import { isPlainLeftClick } from "@/shared/lib/navigation/use-press-navigate";
import { PressLink } from "@/shared/ui/press-link";

import { openRecordSheet, toRecordSheetHref } from "../model/record-sheet";
import { openRecordSheetFromCard } from "../model/record-sheet-morph";

type RecordDetailLinkProps = Omit<ComponentProps<typeof PressLink>, "href"> & { href: string; morph?: boolean };

export function RecordDetailLink({ href, morph, onClick, ...props }: RecordDetailLinkProps) {
  const pathname = usePathname();
  const params = useSearchParams();
  const search = params?.toString() ?? "";
  const sheetHref = toRecordSheetHref(href, `${pathname}${search ? `?${search}` : ""}`) ?? href;

  return (
    <PressLink
      {...props}
      href={sheetHref}
      onClick={(event) => {
        onClick?.(event);
        if (!isPlainLeftClick(event) || (event.currentTarget.target && event.currentTarget.target !== "_self")) return;
        event.preventDefault();
        // 주소만 바꿔 목록 필터와 스크롤을 보존한다. 새 탭은 href로 같은 시트를 연다.
        if (morph) openRecordSheetFromCard(event.currentTarget, () => openRecordSheet(window.history, sheetHref));
        else openRecordSheet(window.history, sheetHref);
      }}
      prefetch={false}
    />
  );
}
