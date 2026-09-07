"use client";

import { type ReactNode, useEffect, useRef } from "react";

import { CaretLeftIcon } from "@phosphor-icons/react";

import { cn } from "@/shared/lib/utils";
import { IconButton } from "@/shared/ui/icon-button";

import { getRecordCreateStepIndex, RECORD_CREATE_STEPS, type RecordCreateStep } from "./create-record-funnel.model";

const STEP_COPY: Record<RecordCreateStep, { description: string; title: string }> = {
  when: { description: "날짜와 그날의 날씨를 알려주세요.", title: "언제였나요?" },
  where: { description: "지역은 꼭 선택하고, 방문 장소는 필요하면 추가하세요.", title: "어디에 다녀왔나요?" },
  what: { description: "가장 기억하고 싶은 일을 남겨보세요.", title: "어떤 하루였나요?" },
};

type RecordFunnelLayoutProps = {
  backDisabled?: boolean;
  children: ReactNode;
  focusInvalidKey?: number;
  footer?: ReactNode;
  onBack: () => void;
  step: RecordCreateStep;
};

export function RecordFunnelLayout({
  backDisabled,
  children,
  focusInvalidKey = 0,
  footer,
  onBack,
  step,
}: RecordFunnelLayoutProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const previousStepIndexRef = useRef(getRecordCreateStepIndex(step));
  const stepIndex = getRecordCreateStepIndex(step);
  const previousStepIndex = previousStepIndexRef.current;
  const direction = stepIndex === previousStepIndex ? "none" : stepIndex > previousStepIndex ? "forward" : "backward";
  const copy = STEP_COPY[step];

  useEffect(() => {
    void focusInvalidKey;
    previousStepIndexRef.current = stepIndex;
    contentRef.current?.scrollTo({ top: 0 });

    const frame = requestAnimationFrame(() => {
      const invalid = contentRef.current?.querySelector<HTMLElement>(
        'input[aria-invalid="true"], textarea[aria-invalid="true"], button[aria-invalid="true"], [aria-invalid="true"] input',
      );
      (invalid ?? titleRef.current)?.focus({ preventScroll: true });
    });

    return () => cancelAnimationFrame(frame);
  }, [focusInvalidKey, stepIndex]);

  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] bg-background">
      <header className="border-b bg-background px-5 pt-[calc(10px+env(safe-area-inset-top))] pb-4">
        <div className="grid min-h-11 grid-cols-[44px_1fr_44px] items-center">
          <IconButton
            aria-label="이전으로"
            disabled={backDisabled}
            icon={CaretLeftIcon}
            iconSize={28}
            onClick={onBack}
          />
          <h1 className="text-center font-bold text-lg tracking-[-0.03em]">기록 남기기</h1>
          <span aria-hidden="true" />
        </div>

        <div
          aria-label={`기록 작성 ${stepIndex + 1}단계 중 ${RECORD_CREATE_STEPS.length}단계`}
          aria-valuemax={RECORD_CREATE_STEPS.length}
          aria-valuemin={1}
          aria-valuenow={stepIndex + 1}
          className="mt-3 flex gap-2"
          role="progressbar"
        >
          {RECORD_CREATE_STEPS.map((item, index) => (
            <span
              aria-hidden="true"
              className={cn("h-1 flex-1 rounded-full", index <= stepIndex ? "bg-primary" : "bg-border")}
              key={item}
            />
          ))}
        </div>
      </header>

      <div className="min-h-0 overflow-y-auto overscroll-contain px-5 py-7" ref={contentRef}>
        <section
          aria-labelledby={`record-create-${step}-title`}
          className="motion-safe:data-[direction=backward]:animate-[funnel-step-backward_160ms_cubic-bezier(0.2,0,0,1)_both] motion-safe:data-[direction=forward]:animate-[funnel-step-forward_160ms_cubic-bezier(0.2,0,0,1)_both]"
          data-direction={direction}
          key={step}
        >
          <h2
            className="font-[780] text-[clamp(26px,8vw,32px)] leading-tight tracking-[-0.045em] outline-none"
            id={`record-create-${step}-title`}
            ref={titleRef}
            tabIndex={-1}
          >
            {copy.title}
          </h2>
          <p className="mt-2 text-[15px] text-muted-foreground leading-[1.6]">{copy.description}</p>
          <div className="mt-8">{children}</div>
        </section>
      </div>

      {footer ? (
        <footer className="border-t bg-background px-5 pt-3 pb-[max(--spacing(4),env(safe-area-inset-bottom))]">
          {footer}
        </footer>
      ) : null}
    </div>
  );
}
