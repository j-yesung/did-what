"use client";

import { PressLink } from "@/shared/ui/press-link";
import { SegmentedControl, SegmentedControlItem } from "@/shared/ui/segmented-control";

const VIEWS = [
  { href: "/records", label: "목록", value: "list" },
  { href: "/records?view=calendar", label: "달력", value: "calendar" },
] as const;

type RecordViewSegmentProps = {
  view: (typeof VIEWS)[number]["value"];
};

/**
 * 서버 컴포넌트에서 PressLink 요소를 render로 두 번 넘기면 서버 렌더링이 'Element type is invalid'로 실패한다.
 * 링크 요소를 클라이언트에서 만들도록 세그먼트를 따로 둔다.
 */
export function RecordViewSegment({ view }: RecordViewSegmentProps) {
  return (
    <SegmentedControl aria-label="기록 보기" role="navigation" value={view}>
      {VIEWS.map(({ href, label, value }) => (
        <SegmentedControlItem key={value} render={<PressLink href={href} prefetch />} value={value}>
          {label}
        </SegmentedControlItem>
      ))}
    </SegmentedControl>
  );
}
