"use client";
import * as React from "react";

import { Drawer as BottomSheetPrimitive } from "@base-ui/react/drawer";

import { cn } from "@/shared/lib/utils";

type BottomSheetContextProps = {
  hasSnapPoints: boolean;
  modal: BottomSheetPrimitive.Root.Props["modal"];
  showSwipeHandle: boolean;
};
const BottomSheetContext = React.createContext<BottomSheetContextProps | null>(null);
const useBottomSheet = () => {
  const context = React.useContext(BottomSheetContext);
  if (!context) {
    throw new Error("useBottomSheet must be used within a BottomSheet.");
  }
  return context;
};
function BottomSheetRoot({
  modal = true,
  showSwipeHandle = false,
  snapPoints,
  ...props
}: Omit<BottomSheetPrimitive.Root.Props, "swipeDirection"> & {
  showSwipeHandle?: boolean;
}) {
  const hasSnapPoints = snapPoints != null && snapPoints.length > 0;
  const contextValue = React.useMemo(
    () => ({ hasSnapPoints, modal, showSwipeHandle }),
    [hasSnapPoints, modal, showSwipeHandle],
  );
  return (
    <BottomSheetContext.Provider value={contextValue}>
      <BottomSheetPrimitive.Root
        data-slot="bottom-sheet"
        modal={modal}
        snapPoints={snapPoints}
        swipeDirection="down"
        {...props}
      />
    </BottomSheetContext.Provider>
  );
}
function BottomSheetTrigger({ ...props }: BottomSheetPrimitive.Trigger.Props) {
  return <BottomSheetPrimitive.Trigger data-slot="bottom-sheet-trigger" {...props} />;
}
/**
 * 소프트 키보드가 올라온 만큼 시트를 밀어 올린다. 키보드 높이는 --drawer-keyboard-inset으로 나온다.
 * 검색 입력이 든 시트는 이걸로 감싸야 입력칸이 키보드에 가리지 않는다.
 */
function BottomSheetVirtualKeyboardProvider({ ...props }: BottomSheetPrimitive.VirtualKeyboardProvider.Props) {
  return <BottomSheetPrimitive.VirtualKeyboardProvider {...props} />;
}
function BottomSheetPortal({ ...props }: BottomSheetPrimitive.Portal.Props) {
  return <BottomSheetPrimitive.Portal data-slot="bottom-sheet-portal" {...props} />;
}
function BottomSheetClose({ ...props }: BottomSheetPrimitive.Close.Props) {
  return <BottomSheetPrimitive.Close data-slot="bottom-sheet-close" {...props} />;
}
/**
 * 뒤를 가리되 색은 입히지 않는다. 바깥 탭으로 닫기와 뒤쪽 조작 차단은 그대로 두고 어둡게만 하지 않는다.
 * iOS 홈 화면 앱에서 노치 띠는 웹 뷰포트가 아니라 theme-color가 칠하고 그 전환은 시스템이 쥐고 있어서,
 * 뒤를 어둡게 하면 띠만 한 박자 늦게 따라온다. 대신 시트에 그림자를 줘서 층이 구분되게 했다.
 *
 * 위치는 fixed로 둔다. shadcn 원본은 iOS에서 absolute로 바꾸는데, 이 앱은 문서 자체가 스크롤돼서
 * 스크롤을 내린 뒤 시트를 열면 음영이 문서 맨 위에 그대로 남는다.
 */
function BottomSheetOverlay({ className, ...props }: BottomSheetPrimitive.Backdrop.Props) {
  return (
    <BottomSheetPrimitive.Backdrop
      data-slot="bottom-sheet-overlay"
      className={cn(
        "fixed inset-0 z-50 min-h-dvh select-none bg-background/20 opacity-[max(var(--drawer-overlay-min-opacity,0),calc(1-var(--drawer-swipe-progress)))] backdrop-blur-xs transition-opacity duration-450 ease-[cubic-bezier(0.32,0.72,0,1)] data-ending-style:pointer-events-none data-ending-style:opacity-0 data-starting-style:opacity-0 data-ending-style:duration-[calc(var(--drawer-swipe-strength)*500ms)] data-swiping:duration-0 motion-reduce:transition-none data-snap-points:[--drawer-overlay-min-opacity:0.5]",
        className,
      )}
      {...props}
    />
  );
}
function BottomSheetSwipeHandle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="bottom-sheet-swipe-handle"
      aria-hidden="true"
      className={cn(
        "relative z-10 flex h-7 w-full shrink-0 cursor-grab touch-none items-end justify-center transition-opacity duration-200 after:block after:h-1 after:w-24 after:shrink-0 after:rounded-full after:bg-muted-foreground/30 active:cursor-grabbing group-data-nested-drawer-open/bottom-sheet-popup:opacity-0 group-data-nested-drawer-swiping/bottom-sheet-popup:opacity-100",
        className,
      )}
      {...props}
    />
  );
}
function BottomSheetContent({
  className,
  children,
  overlayHandle = false,
  ...props
}: BottomSheetPrimitive.Popup.Props & { overlayHandle?: boolean }) {
  const { hasSnapPoints, modal, showSwipeHandle } = useBottomSheet();
  return (
    <BottomSheetPortal data-slot="bottom-sheet-portal">
      {modal === true && <BottomSheetOverlay data-snap-points={hasSnapPoints ? "" : undefined} />}
      <BottomSheetPrimitive.Viewport
        data-slot="bottom-sheet-viewport"
        data-modal={modal}
        className="pointer-events-none fixed inset-0 z-50 select-none data-[modal=true]:pointer-events-auto"
      >
        <BottomSheetPrimitive.Popup
          data-slot="bottom-sheet-popup"
          data-swipe-axis="y"
          data-snap-points={hasSnapPoints ? "" : undefined}
          className={cn(
            // Base.
            "group/bottom-sheet-popup transform-[translate3d(var(--translate-x,0px),var(--translate-y,0px),0)_scale(var(--stack-scale))] pointer-events-auto fixed z-50 flex h-(--drawer-content-height) max-h-(--drawer-content-max-height) min-h-0 w-full select-none flex-col rounded-t-3xl border border-x-0 border-b-0 bg-popover text-popover-foreground text-sm shadow-(--shadow-drawer) outline-none transition-[transform,opacity,filter] duration-450 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform [interpolate-size:allow-keywords] motion-reduce:transition-none",
            // Nested.
            "data-nested-drawer-open:overflow-hidden data-nested-drawer-open:brightness-95",
            // Bleed.
            "after:pointer-events-none after:absolute after:inset-x-0 after:top-full after:h-(--bleed) after:bg-(--drawer-bleed-background,var(--color-popover))",
            // Sizing.
            "[--drawer-content-height:var(--drawer-height,auto)] [--drawer-content-max-height:75dvh] data-snap-points:[--drawer-content-height:100dvh]",
            // Stack.
            "[--bleed:3rem] [--peek:1rem] [--stack-height:var(--drawer-frontmost-height,var(--drawer-height,0px))] [--stack-peek-offset:max(0px,calc((var(--nested-drawers)-var(--stack-progress))*var(--peek)))] [--stack-progress:clamp(0,var(--drawer-swipe-progress),1)] [--stack-scale-base:max(0,calc(1-(var(--nested-drawers)*var(--stack-step))))] [--stack-scale:clamp(0,calc(var(--stack-scale-base)+(var(--stack-step)*var(--stack-progress))),1)] [--stack-shrink:calc(1-var(--stack-scale))] [--stack-step:0.05]",
            // Transitions.
            "data-ending-style:transform-(--closed-transform) data-starting-style:transform-(--closed-transform) data-ending-style:data-nested-drawer-swiping:duration-[calc(var(--drawer-swipe-strength)*500ms)] data-ending-style:data-swiping:duration-[calc(var(--drawer-swipe-strength)*500ms)] data-ending-style:opacity-[0.9999] data-ending-style:duration-[calc(var(--drawer-swipe-strength)*500ms)] data-nested-drawer-swiping:duration-0 data-swiping:duration-0",
            "[--drawer-bleed-background:var(--color-popover)] [--drawer-inset:0px]",
            // Axis: y. 넓은 화면에서는 앱 본문 폭 안에서만 열리게 한다.
            "inset-x-0 mx-auto min-[700px]:max-w-(--app-width)",
            "data-nested-drawer-open:h-(--stack-height)",
            "bottom-0 origin-bottom [--closed-transform:translate3d(0,calc(100%+var(--drawer-inset,0px)+2px),0)] [--translate-y:calc(var(--drawer-snap-point-offset,0px)+var(--drawer-swipe-movement-y)-var(--stack-peek-offset)-(var(--stack-shrink)*var(--stack-height)))]",
            className,
          )}
          {...props}
        >
          {showSwipeHandle && (
            <BottomSheetSwipeHandle className={overlayHandle ? "absolute inset-x-0 top-0 z-20" : undefined} />
          )}
          <BottomSheetPrimitive.Content
            data-slot="bottom-sheet-content"
            className={cn(
              "flex min-h-0 flex-1 flex-col overflow-hidden overscroll-contain rounded-[inherit] transition-opacity duration-300 ease-[cubic-bezier(0.45,1.005,0,1.005)] group-data-nested-drawer-open/bottom-sheet-popup:opacity-0 group-data-nested-drawer-swiping/bottom-sheet-popup:opacity-100 motion-reduce:transition-none",
            )}
          >
            {children}
          </BottomSheetPrimitive.Content>
        </BottomSheetPrimitive.Popup>
      </BottomSheetPrimitive.Viewport>
    </BottomSheetPortal>
  );
}
function BottomSheetHeader({
  children,
  className,
  glass = false,
  ...props
}: React.ComponentProps<"div"> & { glass?: boolean }) {
  return (
    <div
      data-slot="bottom-sheet-header"
      className={cn(
        "flex shrink-0 flex-col gap-0.5 px-5 pt-4 pb-0 group-data-[swipe-axis=y]/bottom-sheet-popup:text-center md:gap-0.5 md:text-left",
        glass && "sticky top-0 z-10",
        className,
      )}
      {...props}
    >
      {glass ? (
        <span
          aria-hidden="true"
          className="mask-[linear-gradient(to_bottom,black_calc(100%-1.5rem),rgb(0_0_0/0.6)_calc(100%-1rem),rgb(0_0_0/0.2)_calc(100%-0.5rem),transparent)] pointer-events-none absolute inset-x-0 top-0 -bottom-6 -z-10 bg-popover/40 backdrop-blur-xs"
        />
      ) : null}
      {children}
    </div>
  );
}
function BottomSheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="bottom-sheet-footer"
      className={cn(
        "mt-auto flex shrink-0 flex-col gap-2 px-5 pt-4 pb-[calc(--spacing(4)+env(safe-area-inset-bottom))]",
        className,
      )}
      {...props}
    />
  );
}
function BottomSheetTitle({ className, ...props }: BottomSheetPrimitive.Title.Props) {
  return (
    <BottomSheetPrimitive.Title
      data-slot="bottom-sheet-title"
      className={cn("font-medium text-base text-foreground", className)}
      {...props}
    />
  );
}
function BottomSheetDescription({ className, ...props }: BottomSheetPrimitive.Description.Props) {
  return (
    <BottomSheetPrimitive.Description
      data-slot="bottom-sheet-description"
      className={cn("text-balance text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}
export const BottomSheet = Object.assign(BottomSheetRoot, {
  Close: BottomSheetClose,
  Content: BottomSheetContent,
  Description: BottomSheetDescription,
  Footer: BottomSheetFooter,
  Header: BottomSheetHeader,
  Overlay: BottomSheetOverlay,
  Portal: BottomSheetPortal,
  SwipeHandle: BottomSheetSwipeHandle,
  Title: BottomSheetTitle,
  Trigger: BottomSheetTrigger,
  VirtualKeyboardProvider: BottomSheetVirtualKeyboardProvider,
});
