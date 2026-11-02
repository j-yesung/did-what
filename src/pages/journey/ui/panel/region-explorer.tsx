import { useEffect, useMemo } from "react";

import { RECORD_CARD_BUTTON_CLASS, RecordCardContent, RecordCardFrame, toRegionLocations } from "@/entities/record";
import { createRegionActivityMaps, RegionMiniMap } from "@/entities/region";
import { Button } from "@/shared/ui/button";
import { LoadErrorAlert } from "@/shared/ui/load-error-alert";
import { PressLink } from "@/shared/ui/press-link";
import type { MapRecord } from "@/widgets/region-activity-map/model/record-map-points";
import { getRegionRecords, getSubregionCounts } from "@/widgets/region-activity-map/model/region-record-list";

import type { JourneyRegion } from "../../model/types";
import styles from "../journey-map.module.css";
import { HomeLoadError } from "./journey-notices";

type ExplorerRecord = Omit<MapRecord, "record_regions"> & {
  record_regions: (MapRecord["record_regions"][number] & { region_label: string })[];
};

type RegionExplorerProps = {
  region: JourneyRegion;
  records: ExplorerRecord[];
  active: boolean;
  pending: boolean;
  error: boolean;
  homeUnavailable: boolean;
  retrying: boolean;
  subregion: string | null;
  onRetry: () => void;
  onSubregionChange: (value: string | null) => void;
  onRecordOpen: (id: string) => void;
  onRecordPress: (id: string) => void;
};

export function RegionExplorer({
  region,
  records,
  active,
  pending,
  error,
  homeUnavailable,
  retrying,
  subregion,
  onRetry,
  onSubregionChange,
  onRecordOpen,
  onRecordPress,
}: RegionExplorerProps) {
  const maps = useMemo(() => createRegionActivityMaps(toRegionLocations(records)), [records]);
  const map = maps.find(({ code }) => code === region.code);
  const entries = getRegionRecords(records, map?.code);
  const subdivisions = getSubregionCounts(entries);
  const selected = subdivisions.some(([name]) => name === subregion) ? subregion : null;
  const visible = selected ? entries.filter(({ subregions }) => subregions.includes(selected)) : entries;

  useEffect(() => {
    if (subregion && !selected && !pending && !error) onSubregionChange(null);
  }, [subregion, selected, pending, error, onSubregionChange]);

  return (
    <section
      className={styles.regionExplorer}
      data-active={active}
      inert={!active}
      aria-label={`${region.name}의 기록`}
    >
      <aside className={styles.regionAside}>
        <h1>{region.name}</h1>
        {map && (
          <div className={styles.regionMini}>
            <RegionMiniMap map={map} label={`${region.name} 미니 지도`} />
          </div>
        )}
      </aside>
      <div className={styles.regionListFrame}>
        <div className={styles.regionListHead}>
          <h2 className={styles.regionListLabel}>
            기록 <span>{pending || error ? region.count : entries.length}</span>
          </h2>
          {subdivisions.length > 1 && (
            <div className={styles.subregionChoices} aria-label="시·군·구">
              {[null, ...subdivisions.map(([name]) => name)].map((name) => (
                <button
                  key={name ?? "all"}
                  type="button"
                  aria-pressed={selected === name}
                  onClick={() => onSubregionChange(name)}
                >
                  {name ?? "전체"}
                </button>
              ))}
            </div>
          )}
        </div>
        <div
          key={`${region.code}:${selected ?? "all"}`}
          className={styles.regionList}
          tabIndex={0}
          aria-label={`${region.name} 기록 목록`}
        >
          {pending ? (
            <div className={styles.skeleton} aria-label="기록을 불러오는 중">
              <i />
              <i />
              <i />
            </div>
          ) : null}
          {error && <LoadErrorAlert title="기록을 불러오지 못했어요." onRetry={onRetry} retrying={retrying} />}
          {!pending && !error && visible.length === 0 && (
            <div className={styles.regionListEmpty}>
              <p>이 지역의 기록이 없어요.</p>
              <Button
                color="dark"
                nativeButton={false}
                render={<PressLink href={`/records/new?region=${region.code}`} />}
                size="medium"
                variant="weak"
              >
                기록 남기기
              </Button>
            </div>
          )}
          {homeUnavailable && <HomeLoadError />}
          <ul>
            {visible.map(({ record }) => (
              <li key={record.id}>
                <RecordCardFrame category={record.category} ringClassName="ring-(--journey-background)">
                  <Button
                    className={RECORD_CARD_BUTTON_CLASS}
                    fullWidth
                    onClick={() => onRecordOpen(record.id)}
                    onFocus={() => onRecordPress(record.id)}
                    onPointerDown={(event) => {
                      if (event.button === 0) onRecordPress(record.id);
                    }}
                    variant="ghost"
                  >
                    <RecordCardContent record={record} showMemo={false} />
                  </Button>
                </RecordCardFrame>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
