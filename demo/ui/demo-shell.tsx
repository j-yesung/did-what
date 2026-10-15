"use client";

import { type ComponentType, type ReactNode, useEffect, useRef, useState } from "react";

import {
  ArrowSquareOutIcon,
  BellIcon,
  CaretDownIcon,
  ChatCircleIcon,
  CheckIcon,
  GearIcon,
  type IconProps,
  MapPinAreaIcon,
  MapPinIcon,
  NotePencilIcon,
  NotepadIcon,
} from "@phosphor-icons/react";

import { THEME_OPTIONS, type Theme } from "@/features/switch-theme/model/theme";
import { FOCUS_RING } from "@/shared/lib/interaction";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog, ConfirmDialogCancelButton } from "@/shared/ui/confirm-dialog";

import { DEMO_APP_PATH, toDemoHref } from "../lib/demo-href";
import {
  type DemoAppMessage,
  type DemoCommand,
  type DemoSnapshot,
  readDemoAppMessage,
  toCommandMessage,
} from "../lib/messages";
import { DEMO_RECORD_IDS } from "../model/seed";
import { clearDemoStorage } from "../model/store";

type EntryId = "comments" | "create" | "map" | "notifications" | "places" | "records" | "settings";

type Entry = {
  guide: string;
  icon: ComponentType<IconProps>;
  id: EntryId;
  label: string;
  path: string;
};

const ENTRIES: Entry[] = [
  {
    guide:
      "대한민국 지도에서 발자취를 보고, 아래 미니 지역 지도를 눌러 그곳의 기록을 열어 보세요. ‘전체’를 선택하면 아직 기록이 없는 지역도 볼 수 있어요.",
    icon: MapPinAreaIcon,
    id: "map",
    label: "활동 지도",
    path: "/",
  },
  {
    guide:
      "검색과 필터로 기록을 찾고 오른쪽 위 버튼으로 달력과 목록을 바꿔 보세요. 기록을 길게 누르면 수정·삭제 메뉴가 열려요.",
    icon: NotepadIcon,
    id: "records",
    label: "기록 둘러보기",
    path: "/records?view=list",
  },
  {
    guide:
      "날짜 → 장소 → 내용 순서로 하루를 남겨요. 이전 단계로 가도 입력이 남고, 첫 단계에서 나가면 확인 창이 떠요. 장소는 ‘카페’, ‘해변’으로 찾아보세요(샘플 결과).",
    icon: NotePencilIcon,
    id: "create",
    label: "하루 기록하기",
    path: "/records/new",
  },
  {
    guide:
      "저장한 장소를 눌러 그곳의 기록을 보고, 길게 눌러 삭제 메뉴를 열어 보세요. ‘카페’로 검색하면 샘플 장소를 저장할 수 있어요.",
    icon: MapPinIcon,
    id: "places",
    label: "장소 모아보기",
    path: "/places",
  },
  {
    guide:
      "지금 사용자 이름으로 댓글을 남겨 보세요. 내 댓글만 X로 지울 수 있어요. 사용자를 바꾸면 차이를 볼 수 있어요.",
    icon: ChatCircleIcon,
    id: "comments",
    label: "댓글 남기기",
    path: `/records/${DEMO_RECORD_IDS.hangang}`,
  },
  {
    guide:
      "알림을 눌러 연결된 기록과 댓글로 간 뒤 왼쪽 위 뒤로 가기로 돌아와 보세요. ‘모두 읽음’으로 점을 지울 수 있어요.",
    icon: BellIcon,
    id: "notifications",
    label: "알림에서 이동",
    path: "/notifications",
  },
  {
    guide: "화면 모드와 사용자 전환을 써 보세요. 바꾼 설정은 이 체험 안에만 적용돼요.",
    icon: GearIcon,
    id: "settings",
    label: "설정",
    path: "/settings",
  },
];

/** 앱 안에서 이동해도 왼쪽 선택이 지금 화면을 가리키도록, 경로마다 어울리는 체험 항목을 고른다. */
const getEntryIds = (path: string): EntryId[] => {
  const pathname = path.split(/[?#]/)[0];
  if (pathname === "/") return ["map"];
  if (pathname === "/records/new") return ["create"];
  if (pathname === "/records") return ["records"];
  if (/^\/records\/[^/]+\/edit$/.test(pathname)) return ["records", "comments"];
  if (/^\/records\/[^/]+$/.test(pathname)) return ["comments", "records", "notifications", "places", "map"];
  if (pathname === "/places" || pathname.startsWith("/places/")) return ["places"];
  if (pathname === "/notifications") return ["notifications"];
  if (pathname === "/settings" || pathname === "/members/select") return ["settings"];
  return [];
};

/** 작성·수정 중인 화면은 초기화하면 입력이 사라지므로 확인을 받는다. */
const isFormPath = (path: string) => /^\/records\/(new|[^/?#]+\/edit)(?:[?#]|$)/.test(path);

const THEME_LABELS: Record<Theme, string> = { dark: "어두운 화면", light: "밝은 화면", system: "시스템" };

function SectionTitle({ children }: { children: ReactNode }) {
  return <h3 className="font-semibold text-muted-foreground text-xs">{children}</h3>;
}

/** 선택 상태를 색과 체크 표시 두 가지로 알린다. */
function ChoiceButton({
  children,
  disabled,
  onClick,
  pressed,
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
  pressed: boolean;
}) {
  return (
    <button
      aria-pressed={pressed}
      className={cn(
        "inline-flex min-h-9 items-center gap-1 rounded-lg border px-2.5 font-medium text-[13px] disabled:cursor-not-allowed disabled:opacity-50",
        pressed ? "border-primary bg-primary/10 font-semibold text-accent-text" : "bg-background hover:bg-muted",
        FOCUS_RING,
      )}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {pressed ? <CheckIcon aria-hidden="true" className="size-3.5" weight="bold" /> : null}
      {children}
    </button>
  );
}

function ActionButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <Button
      className="justify-start"
      color="dark"
      fullWidth
      onClick={onClick}
      size="medium"
      type="button"
      variant="weak"
    >
      {children}
    </Button>
  );
}

export function DemoShell({ initialPath }: { initialPath: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [src] = useState(() => toDemoHref(initialPath));
  const [snapshot, setSnapshot] = useState<DemoSnapshot | null>(null);
  const [feedback, setFeedback] = useState<Extract<DemoAppMessage, { type: "feedback" }> | null>(null);
  const [selectedId, setSelectedId] = useState<EntryId>(() => getEntryIds(initialPath)[0] ?? "map");
  const [panelOpen, setPanelOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== iframeRef.current?.contentWindow) return;
      const message = readDemoAppMessage(event.data);
      if (!message) return;

      if (message.type === "feedback") {
        setFeedback(message);
        return;
      }

      setSnapshot(message.state);
      const candidates = getEntryIds(message.state.path);
      setSelectedId((current) => (candidates.includes(current) ? current : (candidates[0] ?? current)));
      // 새로 고쳐도 같은 앱 화면으로 돌아오도록 부모 주소에 앱 경로를 남긴다.
      const nextUrl = message.state.path === "/" ? "/demo" : `/demo?path=${encodeURIComponent(message.state.path)}`;
      if (`${window.location.pathname}${window.location.search}` !== nextUrl) {
        window.history.replaceState(window.history.state, "", nextUrl);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const send = (command: DemoCommand) => {
    iframeRef.current?.contentWindow?.postMessage(toCommandMessage(command), window.location.origin);
  };

  const openEntry = (entry: Entry) => {
    setSelectedId(entry.id);
    setFeedback(null);
    send({ name: "navigate", path: entry.path });
  };

  const reset = () => {
    setResetOpen(false);
    clearDemoStorage();
    iframeRef.current?.contentWindow?.location.replace(DEMO_APP_PATH);
    window.history.replaceState(window.history.state, "", "/demo");
    setSelectedId("map");
    setSnapshot(null);
    setFeedback({ message: "체험 내용을 지우고 처음 상태로 돌아왔어요.", tone: "success", type: "feedback" });
  };

  const requestReset = () => {
    if (snapshot?.changed || (snapshot && isFormPath(snapshot.path))) setResetOpen(true);
    else reset();
  };

  const selected = ENTRIES.find((entry) => entry.id === selectedId) ?? ENTRIES[0];
  const ready = snapshot !== null;

  return (
    <div className="min-h-dvh bg-muted/50 text-foreground">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1280px] items-center gap-x-3 px-4 py-2">
          <h1 className="font-bold text-base tracking-[-0.02em]">뭐했지? · 체험하기</h1>
          <span className="rounded-md bg-primary px-2 py-0.5 font-semibold text-[11px] text-primary-foreground">
            체험용 데모
          </span>
          <a
            className={cn(
              "ml-auto inline-flex min-h-9 items-center gap-1 rounded-lg px-2 font-medium text-accent-text text-sm hover:bg-muted",
              FOCUS_RING,
            )}
            href="/"
          >
            실제 서비스로 이동
            <ArrowSquareOutIcon aria-hidden="true" className="size-4" />
          </a>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1280px] gap-4 px-4 py-4 lg:grid-cols-[minmax(220px,260px)_minmax(390px,430px)_minmax(220px,260px)] lg:justify-center lg:gap-6">
        <nav
          aria-label="체험할 기능"
          className="flex min-w-0 flex-col gap-3 lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto"
        >
          <div className="flex min-w-0 flex-col gap-1.5">
            <h2 className="hidden px-3 font-semibold text-muted-foreground text-xs lg:block">체험할 기능</h2>
            <ul className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0">
              {ENTRIES.map((entry) => {
                const current = entry.id === selected.id;
                const Icon = entry.icon;
                return (
                  <li className="shrink-0" key={entry.id}>
                    <button
                      aria-current={current ? "true" : undefined}
                      className={cn(
                        "relative flex min-h-11 w-full items-center gap-2.5 rounded-xl px-3 text-left text-sm disabled:opacity-50",
                        current ? "bg-primary/10 font-semibold text-accent-text" : "hover:bg-muted",
                        FOCUS_RING,
                      )}
                      disabled={!ready}
                      onClick={() => openEntry(entry)}
                      type="button"
                    >
                      <Icon aria-hidden="true" className="size-5 shrink-0" weight={current ? "fill" : "regular"} />
                      <span className="whitespace-nowrap">{entry.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
          <section aria-labelledby="demo-guide-title" className="rounded-xl border bg-background p-3">
            <h2 className="font-semibold text-xs" id="demo-guide-title">
              지금 볼 부분 · {selected.label}
            </h2>
            <p aria-live="polite" className="mt-1 text-muted-foreground text-sm leading-relaxed">
              {selected.guide}
            </p>
          </section>
        </nav>

        <section aria-label="실제로 조작하는 앱 화면" className="flex min-w-0 justify-center">
          <iframe
            className="h-[max(560px,calc(100dvh-7rem))] w-full max-w-[430px] rounded-2xl border bg-background shadow-sm lg:h-[calc(100dvh-6rem)] lg:min-h-[560px]"
            ref={iframeRef}
            src={src}
            title="뭐했지 체험용 앱"
          />
        </section>

        <aside
          aria-label="상황 바꾸기"
          className="flex min-w-0 flex-col gap-3 lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto"
        >
          <button
            aria-controls="demo-controls"
            aria-expanded={panelOpen}
            className={cn(
              "flex min-h-11 items-center justify-between rounded-xl border bg-background px-3 font-semibold text-sm lg:hidden",
              FOCUS_RING,
            )}
            onClick={() => setPanelOpen((open) => !open)}
            type="button"
          >
            상황 바꾸기
            <CaretDownIcon
              aria-hidden="true"
              className={cn("size-4 transition-transform", panelOpen && "rotate-180")}
            />
          </button>

          <div className={cn("flex-col gap-3", panelOpen ? "flex" : "hidden lg:flex")} id="demo-controls">
            <h2 className="hidden font-semibold text-muted-foreground text-xs lg:block">상황 바꾸기</h2>

            {feedback ? (
              <p
                className={cn(
                  "rounded-xl px-3 py-2 text-sm leading-relaxed",
                  feedback.tone === "success" ? "bg-success/10 text-foreground" : "bg-destructive/10 text-foreground",
                )}
                role="status"
              >
                {feedback.message}
              </p>
            ) : (
              <p className="sr-only" role="status" />
            )}

            <section className="flex flex-col gap-2 rounded-xl border bg-background p-3">
              <SectionTitle>데이터</SectionTitle>
              <ActionButton onClick={() => send({ name: "addRecord" })}>예시 기록 추가</ActionButton>
              <ActionButton onClick={() => send({ name: "receiveNotification" })}>새 알림 받아보기</ActionButton>
            </section>

            <section className="flex flex-col gap-2 rounded-xl border bg-background p-3">
              <SectionTitle>사용자 전환</SectionTitle>
              <div className="flex flex-wrap gap-1.5">
                {snapshot?.members.map((member) => (
                  <ChoiceButton
                    key={member.id}
                    onClick={() => send({ memberId: member.id, name: "switchMember" })}
                    pressed={member.id === snapshot.currentMemberId}
                  >
                    {member.name}
                  </ChoiceButton>
                ))}
              </div>
            </section>

            <section className="flex flex-col gap-2 rounded-xl border bg-background p-3">
              <SectionTitle>앱 화면 모드</SectionTitle>
              <div className="flex flex-wrap gap-1.5">
                {THEME_OPTIONS.map(({ value }) => (
                  <ChoiceButton
                    disabled={!ready}
                    key={value}
                    onClick={() => send({ name: "setTheme", theme: value })}
                    pressed={snapshot?.theme === value}
                  >
                    {THEME_LABELS[value]}
                  </ChoiceButton>
                ))}
              </div>
            </section>

            <section className="flex flex-col gap-1.5 rounded-xl border bg-background p-3">
              <Button color="danger" fullWidth onClick={requestReset} size="medium" type="button" variant="weak">
                처음 상태로 되돌리기
              </Button>
              <p className="text-muted-foreground text-xs">체험 내용을 지우고 처음 상태로 돌아갑니다.</p>
            </section>
          </div>
        </aside>
      </div>

      <ConfirmDialog
        cancelButton={<ConfirmDialogCancelButton onClick={() => setResetOpen(false)}>취소</ConfirmDialogCancelButton>}
        confirmButton={
          <Button color="danger" onClick={reset} variant="fill">
            되돌리기
          </Button>
        }
        description="추가한 기록·댓글·알림과 작성 중인 내용, 사용자·화면 모드를 모두 처음 샘플로 돌려요."
        onClose={() => setResetOpen(false)}
        open={resetOpen}
        title="체험 내용을 지울까요?"
      />
    </div>
  );
}
