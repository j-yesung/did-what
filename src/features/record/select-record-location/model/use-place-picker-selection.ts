"use client";

import { type Dispatch, type SetStateAction, useEffect, useMemo, useRef, useState } from "react";

import { useMutation } from "@tanstack/react-query";

import type { PlaceOption, PlaceSearchResult } from "@/entities/place";
import { getRecordRegionKey, MAX_VISITED_PLACES } from "@/entities/record";
import type { KakaoPlace } from "@/shared/api/kakao-local";
import { useActionOverride } from "@/shared/lib/action-override";
import { showToast } from "@/shared/lib/toast";

import { resolveRecordPlace } from "../api/resolve-record-location";
import {
  getRecordLocationSelectionError,
  type PlacePickerDraft,
  type PlacePickerMode,
  type RecordLocationPlace,
  type RecordLocationRegion,
  toExistingRecordLocationPlace,
} from "./location-picker";

type PlacePickerSelectionProps = {
  mode: PlacePickerMode;
  maxSelectionCount: number;
  onAdd: (places: RecordLocationPlace[], regions: RecordLocationRegion[]) => string | undefined;
  draft: PlacePickerDraft;
  onDraftChange: Dispatch<SetStateAction<PlacePickerDraft>>;
  regions: RecordLocationRegion[];
  selectedKeys: Set<string>;
  savedByProviderId: ReadonlyMap<string | null | undefined, PlaceOption>;
};

const showPlaceLimitToast = () =>
  showToast({ title: `장소는 ${MAX_VISITED_PLACES}곳까지 추가할 수 있어요.`, variant: "warning" });

export const usePlacePickerSelection = ({
  mode,
  maxSelectionCount,
  onAdd,
  draft,
  onDraftChange,
  regions,
  selectedKeys,
  savedByProviderId,
}: PlacePickerSelectionProps) => {
  const { selectedPlaces, selectedRegions } = draft;
  const updateDraft = (patch: Partial<PlacePickerDraft>) => onDraftChange((current) => ({ ...current, ...patch }));
  const setSelectedPlaces = (update: (current: Map<string, RecordLocationPlace>) => Map<string, RecordLocationPlace>) =>
    onDraftChange((current) => ({ ...current, selectedPlaces: update(current.selectedPlaces) }));
  const [selectionError, setSelectionError] = useState<string>();
  const [pendingPlaceKeys, setPendingPlaceKeys] = useState<Set<string>>(() => new Set());
  const pendingRequests = useRef(new Map<string, symbol>());
  const optimisticSelectedKeys = useMemo(
    () => new Set([...selectedPlaces.keys(), ...pendingPlaceKeys]),
    [pendingPlaceKeys, selectedPlaces],
  );
  const selectedRegionKeys = useMemo(() => new Set(selectedRegions.keys()), [selectedRegions]);
  const selectedCount = mode === "regions" ? selectedRegions.size : optimisticSelectedKeys.size;
  const resolvePlace = useActionOverride(resolveRecordPlace);
  const resolve = useMutation({ mutationFn: resolvePlace });
  const resolving = pendingPlaceKeys.size > 0;
  const [addQueued, setAddQueued] = useState(false);

  useEffect(() => {
    if (!addQueued || resolving) return;
    setAddQueued(false);
    if (selectionError) return;
    if (selectedCount > 0) setSelectionError(onAdd([...selectedPlaces.values()], []));
  }, [addQueued, onAdd, resolving, selectedCount, selectedPlaces, selectionError]);

  const isSavedPlaceAdded = (place: PlaceOption) =>
    selectedKeys.has(`existing:${place.id}`) ||
    (place.provider === "kakao" && selectedKeys.has(`kakao:${place.provider_place_id}`));
  const toggleSavedPlace = (place: PlaceOption) => {
    const key = `existing:${place.id}`;
    if (!place.region_name || isSavedPlaceAdded(place) || addQueued) return;
    if (!selectedPlaces.has(key) && optimisticSelectedKeys.size >= maxSelectionCount) {
      showPlaceLimitToast();
      return;
    }
    setSelectionError(undefined);
    setSelectedPlaces((current) => {
      const next = new Map(current);
      if (next.has(key)) next.delete(key);
      else if (next.size < maxSelectionCount) next.set(key, toExistingRecordLocationPlace(place));
      return next;
    });
  };

  const toggleRegion = (region: RecordLocationRegion) => {
    const key = getRecordRegionKey(region);
    if (regions.some((item) => getRecordRegionKey(item) === key)) return;
    setSelectionError(undefined);
    const next = new Map(selectedRegions);
    if (next.has(key)) next.delete(key);
    else next.set(key, region);
    const error = getRecordLocationSelectionError([...regions, ...next.values()], []);
    if (error) {
      showToast({ title: error, variant: "warning" });
      return;
    }
    updateDraft({ selectedRegions: next });
  };

  const selectPlace = (place: KakaoPlace, searched: PlaceSearchResult) => {
    setSelectionError(undefined);
    const saved = savedByProviderId.get(place.id);
    if (saved) {
      toggleSavedPlace(saved);
      return;
    }
    const key = `kakao:${place.id}`;
    if (selectedKeys.has(key) || addQueued) return;

    if (pendingRequests.current.has(key)) {
      pendingRequests.current.delete(key);
      setPendingPlaceKeys((current) => {
        const next = new Set(current);
        next.delete(key);
        return next;
      });
      return;
    }

    if (optimisticSelectedKeys.has(key)) {
      setSelectedPlaces((current) => {
        const next = new Map(current);
        next.delete(key);
        return next;
      });
      return;
    }

    if (optimisticSelectedKeys.size >= maxSelectionCount) {
      showPlaceLimitToast();
      return;
    }

    setSelectionError(undefined);
    const request = Symbol(key);
    pendingRequests.current.set(key, request);
    setPendingPlaceKeys((current) => new Set(current).add(key));
    void (async () => {
      try {
        const result = await resolve.mutateAsync({
          page: searched.page,
          providerPlaceId: place.id,
          query: searched.query,
          scope: searched.scope,
        });
        if (pendingRequests.current.get(key) !== request) return;
        if ("error" in result) {
          setSelectionError(result.error);
          return;
        }

        setSelectedPlaces((current) => {
          if (current.size >= maxSelectionCount || selectedKeys.has(result.place.key)) return current;
          const next = new Map(current);
          next.set(result.place.key, {
            ...result.place,
            category_group_code: place.categoryGroupCode,
            category_name: place.categoryName,
          });
          return next;
        });
      } catch {
        if (pendingRequests.current.get(key) === request) {
          setSelectionError("장소를 확인하지 못했어요.\n잠시 후 다시 시도해 주세요.");
        }
      } finally {
        if (pendingRequests.current.get(key) === request) {
          pendingRequests.current.delete(key);
          setPendingPlaceKeys((current) => {
            const next = new Set(current);
            next.delete(key);
            return next;
          });
        }
      }
    })();
  };

  useEffect(() => {
    const requests = pendingRequests.current;
    return () => requests.clear();
  }, []);

  const addSelection = () => {
    if (resolving) {
      setAddQueued(true);
      return;
    }
    setSelectionError(
      mode === "regions" ? onAdd([], [...selectedRegions.values()]) : onAdd([...selectedPlaces.values()], []),
    );
  };

  return {
    addQueued,
    addSelection,
    isSavedPlaceAdded,
    optimisticSelectedKeys,
    pendingPlaceKeys,
    selectedCount,
    selectedRegionKeys,
    selectPlace,
    selectionError,
    setSelectionError,
    toggleRegion,
    toggleSavedPlace,
  };
};
