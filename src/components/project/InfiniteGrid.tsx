"use client";

import { LoaderCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { loadMoreProjects } from "@/app/actions/feed";
import { ProjectCard, SPANS, type CardProject } from "./ProjectCard";

const GRID = "grid auto-rows-[220px] grid-cols-1 gap-2 md:grid-cols-4 md:grid-flow-dense";

// 스크롤이 바닥 근처에 오면 다음 프로젝트 묶음을 이어 붙인다.
// 필터가 바뀌면 부모가 key 를 바꿔 이 컴포넌트를 새로 만든다(상태 초기화).
export function InfiniteGrid({ initial, hasMore: initialMore, filters }: { initial: CardProject[]; hasMore: boolean; filters: Record<string, string> }) {
  const [items, setItems] = useState(initial);
  const [hasMore, setHasMore] = useState(initialMore);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const page = useRef(1);
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore || loading || failed) return;
    const io = new IntersectionObserver(
      async ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        setLoading(true);
        try {
          const next = await loadMoreProjects(filters, page.current + 1);
          page.current += 1;
          // 같은 카드가 두 번 들어오지 않게 id 로 거른다(정렬값이 바뀌는 사이 중복 방지)
          setItems((cur) => [...cur, ...next.items.filter((n) => !cur.some((c) => c.id === n.id))]);
          setHasMore(next.hasMore);
        } catch {
          setFailed(true);
        } finally {
          setLoading(false);
        }
      },
      { rootMargin: "600px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loading, failed, filters]);

  const bento = items.length >= SPANS.length;
  return (
    <>
      <ul className={GRID}>
        {items.map((p, i) => (
          <li key={p.id} className="contents">
            <ProjectCard p={p} index={i} span={bento ? SPANS[i % SPANS.length] : "md:col-span-2"} />
          </li>
        ))}
      </ul>
      <div ref={sentinel} aria-live="polite" className="flex h-16 items-center justify-center text-sm text-muted">
        {loading && <><LoaderCircle size={18} className="mr-2 animate-spin" aria-hidden /> 불러오는 중…</>}
        {failed && (
          <button type="button" onClick={() => setFailed(false)} className="rounded-xl bg-white px-4 py-2 font-semibold text-body hover:bg-surface">
            다시 불러오기
          </button>
        )}
        {!hasMore && items.length > SPANS.length && "모든 프로젝트를 봤어요"}
      </div>
    </>
  );
}
