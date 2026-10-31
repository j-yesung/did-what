import type { Ref } from "react";

import { BookOpenIcon } from "@phosphor-icons/react";

import { LiquidGlassButton } from "@/shared/ui/liquid-glass-button";
import { formatShortPeriod } from "@/widgets/region-activity-map/model/region-record-list";

import styles from "../journey-map.module.css";

type RecordHeaderProps = {
  ref: Ref<HTMLDivElement>;
  titleRef: Ref<HTMLHeadingElement>;
  regionName: string;
  record?: { activity: string; recorded_at: string; recorded_until: string | null };
  onRead: () => void;
};

export function RecordHeader({ ref, titleRef, regionName, record, onRead }: RecordHeaderProps) {
  return (
    <div ref={ref} className={styles.recordHeader}>
      <h1 ref={titleRef} tabIndex={-1}>
        {regionName}
      </h1>
      <LiquidGlassButton aria-label="기록 읽기" title="기록 읽기" onClick={onRead} shape="circle">
        <BookOpenIcon aria-hidden="true" />
      </LiquidGlassButton>
      {record && (
        <p className={styles.recordMeta}>
          <span className="line-clamp-2">{record.activity}</span>
          <time dateTime={record.recorded_at}>{formatShortPeriod(record.recorded_at, record.recorded_until)}</time>
        </p>
      )}
    </div>
  );
}
