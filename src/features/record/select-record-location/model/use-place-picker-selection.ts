"use client";

import { type Dispatch, type SetStateAction, useEffect, useReducer, useRef } from "react";

import type { PlaceOption, PlaceSearchResult } from "@/entities/place";
import { getRecordRegionKey, MAX_VISITED_PLACES } from "@/entities/record";
import type { KakaoPlace } from "@/shared/api/kakao-local";
import { useDemoOverride } from "@/shared/lib/demo-override";
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
import { INITIAL_PLACE_PICKER_SELECTION, isQueuedAddReady, reducePlacePickerSelection } from "./place-picker-selection";

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
  const [state, dispatch] = useReducer(reducePlacePickerSelection, INITIAL_PLACE_PICKER_SELECTION);
  // 확인 요청을 취소할 손잡이. 다시 누르거나 시트를 닫으면 끊어서 늦게 온 응답이 선택을 덮지 않게 한다.
  const requests = useRef(new Map<string, AbortController>());
  const resolvePlace = useDemoOverride(resolveRecordPlace);
  const optimisticSelectedKeys = new Set([...selectedPlaces.keys(), ...state.pending]);
  const selectedRegionKeys = new Set(selectedRegions.keys());
  const selectedCount = mode === "regions" ? selectedRegions.size : optimisticSelectedKeys.size;

  const setSelectionError = (error?: string) => dispatch({ error, type: "setError" });
  const setSelectedPlaces = (update: (current: Map<string, RecordLocationPlace>) => Map<string, RecordLocationPlace>) =>
    onDraftChange((current) => ({ ...current, selectedPlaces: update(current.selectedPlaces) }));

  // 확인을 기다리던 "추가"는 마지막 확인이 끝난 뒤에 실행한다.
  useEffect(() => {
    if (!isQueuedAddReady(state)) return;
    dispatch({
      error: state.error ?? (selectedCount > 0 ? onAdd([...selectedPlaces.values()], []) : undefined),
      type: "addDone",
    });
  }, [onAdd, selectedCount, selectedPlaces, state]);

  useEffect(() => {
    const pending = requests.current;
    return () => {
      for (const controller of pending.values()) controller.abort();
      pending.clear();
    };
  }, []);

  const isSavedPlaceAdded = (place: PlaceOption) =>
    selectedKeys.has(`existing:${place.id}`) ||
    (place.provider === "kakao" && selectedKeys.has(`kakao:${place.provider_place_id}`));

  const toggleSavedPlace = (place: PlaceOption) => {
    const key = `existing:${place.id}`;
    if (!place.region_name || isSavedPlaceAdded(place) || state.addQueued) return;
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
    onDraftChange((current) => ({ ...current, selectedRegions: next }));
  };

  const resolve = async (place: KakaoPlace, searched: PlaceSearchResult, key: string, signal: AbortSignal) => {
    let error: string | undefined;
    try {
      const result = await resolvePlace({
        page: searched.page,
        providerPlaceId: place.id,
        query: searched.query,
        scope: searched.scope,
      });
      if (signal.aborted) return;
      if ("error" in result) {
        error = result.error;
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
      error = "장소를 확인하지 못했어요.\n잠시 후 다시 시도해 주세요.";
    } finally {
      if (!signal.aborted) {
        requests.current.delete(key);
        dispatch({ error, key, type: "settle" });
      }
    }
  };

  const selectPlace = (place: KakaoPlace, searched: PlaceSearchResult) => {
    setSelectionError(undefined);
    const saved = savedByProviderId.get(place.id);
    if (saved) {
      toggleSavedPlace(saved);
      return;
    }
    const key = `kakao:${place.id}`;
    if (selectedKeys.has(key) || state.addQueued) return;

    // 확인 중인 장소를 다시 누르면 선택을 취소한다.
    const pendingRequest = requests.current.get(key);
    if (pendingRequest) {
      pendingRequest.abort();
      requests.current.delete(key);
      dispatch({ key, type: "cancel" });
      return;
    }

    if (selectedPlaces.has(key)) {
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

    const controller = new AbortController();
    requests.current.set(key, controller);
    dispatch({ key, type: "request" });
    void resolve(place, searched, key, controller.signal);
  };

  const addSelection = () => {
    if (state.pending.size > 0) {
      dispatch({ type: "queueAdd" });
      return;
    }
    setSelectionError(
      mode === "regions" ? onAdd([], [...selectedRegions.values()]) : onAdd([...selectedPlaces.values()], []),
    );
  };

  return {
    addQueued: state.addQueued,
    addSelection,
    isSavedPlaceAdded,
    optimisticSelectedKeys,
    pendingPlaceKeys: state.pending,
    selectedCount,
    selectedRegionKeys,
    selectPlace,
    selectionError: state.error,
    setSelectionError,
    toggleRegion,
    toggleSavedPlace,
  };
};
