import type { QueryClient } from "@tanstack/react-query";

import { readRecordInput, validateRecordInput } from "@/entities/record";
import { normalizeCommentBody } from "@/entities/record-comment";
import { logout } from "@/features/auth/api/auth-actions";
import { selectMember } from "@/features/member/select-member/api/select-member";
import { readAllNotifications } from "@/features/notification/read-all-notifications";
import { readRecordNotifications } from "@/features/notification/read-record-notifications";
import { deletePlace } from "@/features/place/delete-place/api/delete-place";
import { createPlaces, setPlaceSaved } from "@/features/place/save-place/api/save-place";
import type { CreatePlaceInput } from "@/features/place/save-place/model/place-form";
import { isPushSupported } from "@/features/push-notification/api/browser-subscription";
import { deleteRecord } from "@/features/record/delete-record/api/delete-record";
import { resolveRecordPlace } from "@/features/record/select-record-location/api/resolve-record-location";
import type { ResolveRecordPlaceResult } from "@/features/record/select-record-location/model/location-picker";
import { type RecordView, saveRecordView } from "@/features/record/switch-record-view/model/record-view-preference";
import { createComment, deleteComment } from "@/features/record-comment/api/comment-actions";
import type { Theme } from "@/features/switch-theme/model/theme";
import { saveTheme } from "@/features/switch-theme/model/theme-preference";
import type { DemoOverrides } from "@/shared/lib/demo-override";
import { toSafeReturnTo } from "@/shared/lib/navigation/return-to";
import { showToast } from "@/shared/lib/toast";

import * as actions from "../model/actions";
import { getDemoKakaoPlace, getDemoRegion } from "../model/samples";
import { demoStore } from "../model/store";
import type { DemoState } from "../model/types";

type Dependencies = {
  /** 앱 경로(/records)를 받아 데모 경로로 이동한다. */
  navigate: (path: string) => void;
  queryClient: QueryClient;
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const actionContext = () => ({ createId: () => crypto.randomUUID(), now: new Date().toISOString() });

export const getCurrentDemoMember = (state: DemoState) =>
  state.members.find((member) => member.id === state.currentMemberId && member.is_active) ?? null;

/**
 * 저장하는 데모 동작의 공통 흐름. 실제 요청처럼 잠깐 기다려 진행 표시를 보여 주고,
 * 성공하면 서버의 revalidatePath처럼 모든 조회를 새로 받는다.
 */
const createSave =
  (queryClient: QueryClient) =>
  async <T>(run: () => T): Promise<T> => {
    await delay(350);
    const result = run();
    void queryClient.invalidateQueries();
    return result;
  };

/** 상태를 바꾼 결과를 서버 액션의 응답 모양({ status, message })으로 돌려준다. */
const commit = (result: actions.DemoActionResult) => {
  if (!result.ok) return { message: result.message, status: "error" as const };
  demoStore.set(result.state);
  return { message: undefined, status: "success" as const };
};

export const createDemoRecordActions = ({ queryClient }: Dependencies) => {
  const save = createSave(queryClient);
  const submit = (
    formData: FormData,
    apply: (state: DemoState, input: Parameters<typeof actions.createRecord>[1]) => actions.DemoActionResult,
  ) =>
    save(() => {
      const result = validateRecordInput(readRecordInput(formData));
      if (!result.data) return { fieldErrors: result.fieldErrors, status: "error" as const };
      return commit(apply(demoStore.get(), result.data));
    });

  return {
    createRecord: (formData: FormData) =>
      submit(formData, (state, input) => {
        const member = getCurrentDemoMember(state);
        return member
          ? actions.createRecord(state, input, member.id, actionContext())
          : { message: "구성원을 확인할 수 없어요.", ok: false };
      }),
    updateRecord: (recordId: string, formData: FormData) =>
      submit(formData, (state, input) => actions.updateRecord(state, recordId, input, actionContext())),
  };
};

/** 서버 액션을 샘플 데이터를 바꾸는 함수로 바꿔 끼운다. 실제 서버·푸시 서비스는 부르지 않는다. */
export const createDemoOverrides = ({ navigate, queryClient }: Dependencies): DemoOverrides => {
  const save = createSave(queryClient);
  const memberId = () => getCurrentDemoMember(demoStore.get())?.id ?? "";
  const update = (change: Partial<DemoState>) => demoStore.update((state) => ({ ...state, ...change, changed: true }));

  const entries: [unknown, unknown][] = [
    [deleteRecord, (recordId: string) => save(() => commit(actions.deleteRecord(demoStore.get(), recordId)))],
    [deletePlace, (placeId: string) => save(() => commit(actions.deletePlace(demoStore.get(), placeId)))],
    [
      setPlaceSaved,
      (placeId: string, saved: boolean) =>
        save(() => commit(actions.setPlaceSaved(demoStore.get(), placeId, saved, new Date().toISOString()))),
    ],
    [
      createPlaces,
      (inputs: CreatePlaceInput[]) =>
        save(() =>
          commit(
            actions.createPlaces(
              demoStore.get(),
              inputs.map(({ placeId }) => placeId),
              actionContext(),
            ),
          ),
        ),
    ],
    [
      createComment,
      (input: { body: string; commentId: string; expectedMemberId: string; recordId: string }) =>
        save(() => {
          const body = normalizeCommentBody(input.body);
          if (!body) return { message: "댓글 내용을 다시 확인해 주세요.", status: "error" as const };
          if (memberId() !== input.expectedMemberId) {
            return {
              message: "작성 멤버가 변경됐어요. 화면을 확인한 뒤 다시 작성해 주세요.",
              status: "error" as const,
            };
          }
          const result = actions.createComment(
            demoStore.get(),
            { ...input, body },
            memberId(),
            new Date().toISOString(),
          );
          return { ...commit(result), comment: result.ok ? result.comment : undefined };
        }),
    ],
    [
      deleteComment,
      (input: { commentId: string; expectedMemberId: string; recordId: string }) =>
        save(() => {
          if (memberId() !== input.expectedMemberId) {
            return {
              message: "작성 멤버가 변경됐어요. 화면을 확인한 뒤 다시 삭제해 주세요.",
              status: "error" as const,
            };
          }
          const result = actions.deleteComment(demoStore.get(), input, memberId());
          return { ...commit(result), commentId: result.ok ? result.commentId : undefined };
        }),
    ],
    [
      readAllNotifications,
      async () => {
        demoStore.set(actions.readAllNotifications(demoStore.get(), memberId(), new Date().toISOString()));
        return { status: "success" };
      },
    ],
    [
      readRecordNotifications,
      async (recordId: string) => {
        demoStore.set(actions.readRecordNotifications(demoStore.get(), memberId(), recordId, new Date().toISOString()));
        return { status: "success" };
      },
    ],
    [
      // 체험에는 로그인 화면이 없어 로그아웃하지 않는다. 실제 앱처럼 설정을 떠나며 안내만 한다.
      logout,
      async () => {
        navigate("/");
        showToast({ title: "체험에서는 로그아웃하지 않아요", variant: "warning" });
        return undefined;
      },
    ],
    [
      selectMember,
      async (input: { destination?: string; memberId: string }) => {
        await delay(300);
        const member = demoStore.get().members.find(({ id, is_active }) => id === input.memberId && is_active);
        if (!member) return { message: "활성 구성원을 확인할 수 없습니다.", status: "error" };
        // 화면 가드가 옛 경로로 판단하지 않도록 이동을 먼저 한다.
        navigate(toSafeReturnTo(input.destination));
        update({ currentMemberId: member.id });
        void queryClient.invalidateQueries();
        return undefined;
      },
    ],
    [saveTheme, (theme: Theme) => update({ theme })],
    [saveRecordView, (view: RecordView) => update({ recordView: view })],
    // 실제 알림 권한을 묻지 않도록 알림을 지원하지 않는 기기로 보인다. 설정에는 홈 화면 설치 안내가 나온다.
    [isPushSupported, () => false],
    [
      resolveRecordPlace,
      async (input: {
        page: number;
        providerPlaceId: string;
        query: string;
        scope: { latitude: number; longitude: number } | null;
      }): Promise<ResolveRecordPlaceResult> => {
        await delay(200);
        const place = getDemoKakaoPlace(input.providerPlaceId);
        const region = place ? getDemoRegion(place.regionCode) : undefined;
        if (!place || !region) return { error: "선택한 장소를 다시 검색해 주세요." };
        return {
          place: {
            address: place.address,
            key: `kakao:${place.id}`,
            name: place.name,
            reference: {
              kind: "kakao",
              page: input.page,
              providerPlaceId: place.id,
              query: input.query,
              save: false,
              scope: input.scope,
            },
            region: { ...region, label: region.name },
          },
        };
      },
    ],
  ];

  return new Map(entries) as unknown as DemoOverrides;
};
