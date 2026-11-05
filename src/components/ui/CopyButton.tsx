"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

// 텍스트를 클립보드에 복사하고 2초간 "복사됨" 표시
export function CopyButton({ text, label = "내용 복사", className = "" }: { text: string; label?: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          // 클립보드 API 가 막힌 환경(포커스 없음·구형 브라우저)용 대체 방식
          const ta = document.createElement("textarea");
          ta.value = text;
          ta.style.position = "fixed";
          ta.style.opacity = "0";
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          ta.remove();
        }
        setDone(true);
        setTimeout(() => setDone(false), 2000);
      }}
      className={className}
    >
      {done ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
      <span aria-live="polite">{done ? "복사됨" : label}</span>
    </button>
  );
}
