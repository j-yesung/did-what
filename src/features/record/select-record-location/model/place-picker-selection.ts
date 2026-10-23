/**
 * 검색 결과에서 고른 카카오 장소는 서버 확인을 거쳐야 담긴다. 확인 중인 장소, 오류, "추가"를 눌러 확인을 기다리는 상태를 함께 둔다.
 * 고른 장소 자체(draft)는 시트를 닫았다 열어도 남도록 바깥이 들고 있다.
 */
export type PlacePickerSelectionState = {
  addQueued: boolean;
  error?: string;
  pending: ReadonlySet<string>;
};

export type PlacePickerSelectionAction =
  | { type: "request"; key: string }
  | { type: "cancel"; key: string }
  | { type: "settle"; error?: string; key: string }
  | { type: "queueAdd" }
  | { type: "addDone"; error?: string }
  | { type: "setError"; error?: string };

export const INITIAL_PLACE_PICKER_SELECTION: PlacePickerSelectionState = { addQueued: false, pending: new Set() };

const withoutKey = (pending: ReadonlySet<string>, key: string) => {
  const next = new Set(pending);
  next.delete(key);
  return next;
};

export const reducePlacePickerSelection = (
  state: PlacePickerSelectionState,
  action: PlacePickerSelectionAction,
): PlacePickerSelectionState => {
  switch (action.type) {
    case "request":
      return { ...state, error: undefined, pending: new Set(state.pending).add(action.key) };
    case "cancel":
      return state.pending.has(action.key) ? { ...state, pending: withoutKey(state.pending, action.key) } : state;
    case "settle":
      return { ...state, error: action.error ?? state.error, pending: withoutKey(state.pending, action.key) };
    case "queueAdd":
      return { ...state, addQueued: true };
    case "addDone":
      return { ...state, addQueued: false, error: action.error };
    case "setError":
      return { ...state, error: action.error };
  }
};

/** "추가"를 기다리던 중 확인이 모두 끝났다. 그사이 실패가 있었으면 추가하지 않고 오류를 보여준다. */
export const isQueuedAddReady = (state: PlacePickerSelectionState) => state.addQueued && state.pending.size === 0;
