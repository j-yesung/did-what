"use client";

import { useEffect, useRef, useState } from "react";

type KakaoAddress = { address: string };
type KakaoPostcode = new (options: {
  oncomplete: (data: KakaoAddress) => void;
  width: string;
  height: string;
  theme?: Record<string, string>;
}) => { embed: (element: HTMLElement) => void };

const DARK_THEME = {
  bgColor: "#202632",
  searchBgColor: "#191F28",
  contentBgColor: "#202632",
  pageBgColor: "#202632",
  textColor: "#F9FAFB",
  queryTextColor: "#F9FAFB",
  postcodeTextColor: "#B0B8C1",
  emphTextColor: "#4593FC",
  outlineColor: "#333D4B",
};

const getPostcode = () => (window as Window & { kakao?: { Postcode?: KakaoPostcode } }).kakao?.Postcode;
let scriptPromise: Promise<void> | null = null;

const loadPostcode = () => {
  if (getPostcode()) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    script.async = true;
    const timer = window.setTimeout(() => fail(), 10000);
    const fail = () => {
      window.clearTimeout(timer);
      script.remove();
      scriptPromise = null;
      reject(new Error("주소 찾기를 불러오지 못했어요."));
    };
    script.onload = () => {
      window.clearTimeout(timer);
      if (getPostcode()) resolve();
      else fail();
    };
    script.onerror = fail;
    document.head.appendChild(script);
  });
  return scriptPromise;
};

export function KakaoAddressSearch({
  dark = false,
  onSelect,
}: {
  dark?: boolean;
  onSelect: (address: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void loadPostcode()
      .then(() => {
        if (cancelled || !containerRef.current) return;
        const Postcode = getPostcode();
        if (!Postcode) throw new Error("주소 찾기를 불러오지 못했어요.");
        new Postcode({
          oncomplete: (data) => {
            if (!cancelled) onSelect(data.address);
          },
          width: "100%",
          height: "100%",
          theme: dark ? DARK_THEME : undefined,
        }).embed(containerRef.current);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setLoading(false);
          setError(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [dark, onSelect]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 px-5 pt-4 pb-[calc(--spacing(4)+env(safe-area-inset-bottom))]">
      {loading && (
        <p role="status" className="text-muted-foreground text-sm">
          주소 찾기를 불러오고 있어요.
        </p>
      )}
      {error ? (
        <p role="alert" className="text-destructive text-sm">
          주소 찾기를 불러오지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.
        </p>
      ) : (
        <div ref={containerRef} className="min-h-0 w-full flex-1 overflow-hidden rounded-lg" />
      )}
    </div>
  );
}
