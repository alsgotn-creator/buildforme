"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

// 상세 페이지 상단 이미지 슬라이드 (썸네일 + 스크린샷). 좌우 버튼·키보드 화살표·아래 미리보기로 이동.
export function Slider({ images, title, badge }: { images: string[]; title: string; badge?: string }) {
  const [i, setI] = useState(0);
  if (!images.length) return null;
  const go = (n: number) => setI((n + images.length) % images.length);
  const many = images.length > 1;

  return (
    <div
      className="mb-6"
      role="region"
      aria-roledescription="슬라이드"
      aria-label={`${title} 이미지`}
      tabIndex={many ? 0 : undefined}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") go(i - 1);
        if (e.key === "ArrowRight") go(i + 1);
      }}
    >
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-surface">
        <div className="flex h-full transition-transform duration-300 ease-out motion-reduce:transition-none" style={{ transform: `translateX(-${i * 100}%)` }}>
          {images.map((src, k) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={src + k} src={src} alt={`${title} 이미지 ${k + 1}`} aria-hidden={k !== i} className="h-full w-full shrink-0 object-cover" loading={k === 0 ? "eager" : "lazy"} />
          ))}
        </div>
        {badge && <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-sm font-extrabold text-foreground">{badge}</span>}
        {many && (
          <>
            <button type="button" onClick={() => go(i - 1)} aria-label="이전 이미지" className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground hover:bg-white">
              <ChevronLeft size={20} />
            </button>
            <button type="button" onClick={() => go(i + 1)} aria-label="다음 이미지" className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground hover:bg-white">
              <ChevronRight size={20} />
            </button>
            <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white" aria-live="polite">
              {i + 1} / {images.length}
            </span>
          </>
        )}
      </div>
      {many && (
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {images.map((src, k) => (
            <button
              key={src + k}
              type="button"
              onClick={() => setI(k)}
              aria-label={`이미지 ${k + 1} 보기`}
              aria-current={k === i}
              className={`aspect-[16/10] w-20 shrink-0 overflow-hidden rounded-lg ring-2 ${k === i ? "ring-primary" : "ring-transparent opacity-60 hover:opacity-100"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
