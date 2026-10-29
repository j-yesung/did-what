import type { Ref } from "react";

import { Button } from "@/shared/ui/button";

import styles from "../journey-map.module.css";

type RecordHeaderProps = {
  titleRef: Ref<HTMLHeadingElement>;
  regionName: string;
  record?: { activity: string; recorded_at: string };
  onRead: () => void;
};

export function RecordHeader({ titleRef, regionName, record, onRead }: RecordHeaderProps) {
  return (
    <div className={styles.recordHeader}>
      <h1 ref={titleRef} tabIndex={-1}>
        {regionName}
      </h1>
      <Button className={styles.hit} color="dark" onClick={onRead} size="medium" variant="weak">
        기록 읽기
      </Button>
      {record && (
        <p className={styles.recordMeta}>
          {record.activity} · {record.recorded_at.replaceAll("-", ".")}
        </p>
      )}
    </div>
  );
}
