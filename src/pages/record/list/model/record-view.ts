import type { RecordSearchParams } from "@/entities/record";
import type { RecordView } from "@/features/record/switch-record-view/model/record-view-preference";

/** 검색 조건이 없는 진입만 저장한 보기를 사용한다. 시트 주소는 보기 선택에 영향을 주지 않는다. */
export const getRecordViewFromParams = (params: RecordSearchParams): RecordView | null => {
  if (params.view === "calendar") return "calendar";
  const hasViewParams = Object.keys(params).some((key) => key !== "recordDetail" && key !== "recordFrom");
  return hasViewParams ? "list" : null;
};
