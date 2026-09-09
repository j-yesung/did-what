"use client";

import { useEffect, useRef, useState } from "react";

import { showNotice } from "@/shared/lib/notice";

async function writeClipboard(text: string) {
  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // 브라우저 권한이나 WebView가 거부하면 DOM fallback을 시도한다.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.readOnly = true;
  textarea.style.cssText = "position:fixed;opacity:0";
  document.body.append(textarea);
  textarea.select();

  try {
    if (!document.execCommand("copy")) throw new Error("Copy failed");
  } finally {
    textarea.remove();
  }
}

export function useCopyToClipboard() {
  const [copied, setCopied] = useState(false);
  const resetTimerRef = useRef<number>(undefined);

  useEffect(() => () => window.clearTimeout(resetTimerRef.current), []);

  async function copy(text: string) {
    try {
      await writeClipboard(text);
      setCopied(true);
      window.clearTimeout(resetTimerRef.current);
      resetTimerRef.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      showNotice({ title: "메모를 복사하지 못했어요", variant: "warning" });
    }
  }

  return { copied, copy };
}
