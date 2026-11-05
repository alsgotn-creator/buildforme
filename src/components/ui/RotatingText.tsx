"use client";

import { useEffect, useState } from "react";

// 단어가 아래→위로 바뀌는 텍스트. 모든 단어를 같은 grid 칸에 겹쳐 가장 긴 단어 폭을 확보(레이아웃 흔들림 방지).
export function RotatingText({ words, interval = 2200 }: { words: string[]; interval?: number }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % words.length), interval);
    return () => clearInterval(id);
  }, [words.length, interval]);

  const prev = (i - 1 + words.length) % words.length;
  return (
    <span className="relative inline-grid overflow-hidden rounded-2xl bg-weak-bg px-3 align-bottom text-primary">
      <span className="sr-only">{words.join(", ")}</span>
      {words.map((w, k) => (
        <span
          key={w}
          aria-hidden
          className={`text-center transition-all duration-500 ease-out [grid-area:1/1] motion-reduce:transition-none ${
            k === i ? "translate-y-0 opacity-100" : k === prev ? "-translate-y-full opacity-0" : "translate-y-full opacity-0"
          }`}
        >
          {w}
        </span>
      ))}
    </span>
  );
}
