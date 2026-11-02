import { useMemo } from "react";

import { toRegionLocations } from "@/entities/record";
import { createRegionActivityMaps, RegionMiniMap } from "@/entities/region";
import { LoadErrorAlert } from "@/shared/ui/load-error-alert";
import type { MapRecord } from "@/widgets/region-activity-map/model/record-map-points";
import {
  formatShortPeriod,
  getRegionRecords,
  getSubregionCounts,
} from "@/widgets/region-activity-map/model/region-record-list";

import type { JourneyRegion } from "../../model/types";
import styles from "../journey-map.module.css";
import { HomeLoadError } from "./journey-notices";

type RegionExplorerProps = {
  region: JourneyRegion;
  records: MapRecord[];
  active: boolean;
  pending: boolean;
  error: boolean;
  homeUnavailable: boolean;
  retrying: boolean;
  subregion: string | null;
  onRetry: () => void;
  onSubregionChange: (value: string | null) => void;
  onReset: () => void;
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
  onReset,
  onRecordOpen,
  onRecordPress,
}: RegionExplorerProps) {
  const maps = useMemo(() => createRegionActivityMaps(toRegionLocations(records)), [records]);
  const map = maps.find(({ code }) => code === region.code);
  const entries = getRegionRecords(records, map?.code);
  const subdivisions = getSubregionCounts(entries);
  const selected = subdivisions.some(([name]) => name === subregion) ? subregion : null;
  const visible = selected ? entries.filter(({ subregions }) => subregions.includes(selected)) : entries;

  return (
    <section
      className={styles.regionExplorer}
      data-active={active}
      inert={!active}
      aria-label={`${region.name}의 기록`}
    >
      <aside className={styles.regionAside}>
        {map && (
          <div className={styles.regionMini}>
            <RegionMiniMap map={map} label={`${region.name} 미니 지도`} />
          </div>
        )}
        <h1>{region.name}</h1>
        <p role="status">기록 {pending ? region.count : entries.length}개</p>
        <button type="button" className={styles.nationalBack} onClick={onReset}>
          ← 전국 지도
        </button>
      </aside>
      <div className={styles.regionListFrame}>
        <div
          key={`${region.code}:${selected ?? "all"}`}
          className={styles.regionList}
          tabIndex={0}
          aria-label={`${region.name} 기록 목록`}
        >
          <h2 className={styles.regionListLabel}>기록</h2>
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
          {pending ? (
            <div className={styles.skeleton} aria-label="기록을 불러오는 중">
              <i />
              <i />
              <i />
            </div>
          ) : null}
          {error && <LoadErrorAlert title="기록을 불러오지 못했어요." onRetry={onRetry} retrying={retrying} />}
          {!pending && !error && visible.length === 0 && (
            <p className={styles.regionListEmpty}>이 지역의 기록이 없어요.</p>
          )}
          {homeUnavailable && <HomeLoadError />}
          <ul>
            {visible.map(({ record, subregions }) => (
              <li key={record.id}>
                <button
                  className={styles.regionRecord}
                  type="button"
                  onClick={() => onRecordOpen(record.id)}
                  onPointerDown={(event) => {
                    if (event.button === 0) onRecordPress(record.id);
                  }}
                  onFocus={() => onRecordPress(record.id)}
                >
                  <time dateTime={record.recorded_at}>
                    {formatShortPeriod(record.recorded_at, record.recorded_until)}
                  </time>
                  <strong>{record.activity}</strong>
                  <small>
                    {subregions.join(" · ")}
                    {record.record_places.some(({ place }) => place)
                      ? ` · 장소 ${record.record_places.filter(({ place }) => place).length}곳`
                      : ""}
                  </small>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
