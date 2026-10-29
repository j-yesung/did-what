import type { Ref } from "react";

import { Button } from "@/shared/ui/button";
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
      <Button className={styles.hit} color="dark" onClick={onRead} size="medium" variant="weak">
        기록 읽기
      </Button>
      {record && (
        <p className={styles.recordMeta}>
          {record.activity} · {formatShortPeriod(record.recorded_at, record.recorded_until)}
        </p>
      )}
    </div>
  );
}
