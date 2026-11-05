import { ChevronLeft, ChevronRight, LayoutGrid, MessageCircle, Search } from "lucide-react";
import Form from "next/form";
import Link from "next/link";
import { Suspense } from "react";
import { SAMPLE_POSTS, TOPICS, isTopic, timeAgo, topicOf, type PostRow } from "@/lib/community";
import { db } from "@/lib/supabase/server";

const PAGE_SIZE = 20;

// 현재 조건을 유지한 채 일부만 바꾼 URL (조건이 바뀌면 1페이지로)
function href(cur: { topic: string; q: string }, change: { topic?: string; q?: string; page?: number }) {
  const u = new URLSearchParams();
  const next = { ...cur, ...change };
  if (next.topic) u.set("topic", next.topic);
  if (next.q) u.set("q", next.q);
  if (change.page && change.page > 1) u.set("page", String(change.page));
  const s = u.toString();
  return s ? `/community?${s}` : "/community";
}

async function PostList({ searchParams }: PageProps<"/community">) {
  const sp = await searchParams;
  const topic = isTopic(sp.topic) ? String(sp.topic) : "";
  // PostgREST or() 문법을 깨는 문자는 제거 (필터 주입 방지)
  const term = String(sp.q ?? "").replace(/[,()%*\\"]/g, " ").trim().slice(0, 50);
  const page = Math.max(1, Math.min(1000, Number.parseInt(String(sp.page ?? "1"), 10) || 1));
  const cur = { topic, q: term };

  let q = db
    .from("posts")
    .select("id,topic,title,body,created_at,profiles(username),post_comments(count)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (topic) q = q.eq("topic", topic);
  if (term) q = q.or(`title.ilike.%${term}%,body.ilike.%${term}%`);
  const { data, count } = await q;
  // shortcut: DB 에 글이 없으면 예시 글을 보여준다(초기 오픈용).
  const usingSamples = !data?.length && page === 1;
  const posts: PostRow[] = data?.length
    ? data
    : usingSamples
      ? SAMPLE_POSTS.filter((p) => (!topic || p.topic === topic) && (!term || `${p.title} ${p.body}`.includes(term)))
      : [];
  const totalPages = usingSamples ? 1 : Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <nav className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0" aria-label="말머리 필터">
          {[{ key: "", label: "전체", Icon: LayoutGrid }, ...TOPICS].map((t) => (
            <Link
              key={t.key || "all"}
              href={href(cur, { topic: t.key })}
              aria-current={topic === t.key ? "page" : undefined}
              className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-semibold ${topic === t.key ? "bg-foreground text-white" : "bg-white text-body hover:bg-surface"}`}
            >
              <t.Icon size={16} aria-hidden /> {t.label}
            </Link>
          ))}
        </nav>
        <Form action="/community" role="search" className="relative w-full sm:w-56">
          {topic && <input type="hidden" name="topic" value={topic} />}
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
          <input name="q" type="search" defaultValue={term} maxLength={50} placeholder="게시글 검색" aria-label="게시글 검색" className="h-9 w-full rounded-lg bg-white pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/40" />
        </Form>
      </div>
      {term && (
        <p className="mb-3 text-sm text-body">
          ‘{term}’ 검색 결과 {usingSamples ? posts.length : (count ?? 0)}개 · <Link href={href(cur, { q: "" })} className="text-muted underline">지우기</Link>
        </p>
      )}

      {posts.length ? (
        <ul className="divide-y divide-border overflow-hidden rounded-3xl bg-white">
          {posts.map((p) => {
            const t = topicOf(p.topic);
            const author = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
            const comments = p.post_comments?.[0]?.count ?? 0;
            return (
              <li key={p.id}>
                <Link href={`/community/${p.id}`} className="flex gap-4 px-5 py-4 hover:bg-[#f9fafb] sm:px-6">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold ${t.cls}`}>{t.label}</span>
                      <h2 className="truncate font-semibold">{p.title}</h2>
                    </div>
                    <p className="mt-1 line-clamp-1 text-sm text-body">{p.body}</p>
                    <p className="mt-1.5 text-xs text-muted">
                      @{author?.username} · {timeAgo(p.created_at)}
                    </p>
                  </div>
                  <div className="flex w-12 shrink-0 flex-col items-center justify-center rounded-2xl bg-surface text-sm font-semibold text-body">
                    <MessageCircle size={16} aria-hidden />
                    <span aria-label={`댓글 ${comments}개`}>{comments}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="rounded-3xl bg-white py-20 text-center text-muted">{term || topic ? "조건에 맞는 글이 없어요." : "아직 글이 없어요. 첫 글을 남겨 보세요!"}</p>
      )}

      {totalPages > 1 && (
        <nav aria-label="페이지" className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold">
          {page > 1 ? <Link href={href(cur, { page: page - 1 })} className="flex h-10 items-center gap-1 rounded-xl bg-white px-4 hover:bg-surface"><ChevronLeft size={16} aria-hidden /> 이전</Link> : <span className="flex h-10 items-center gap-1 px-4 text-muted"><ChevronLeft size={16} aria-hidden /> 이전</span>}
          <span className="px-2 text-body">{page} / {totalPages}</span>
          {page < totalPages ? <Link href={href(cur, { page: page + 1 })} className="flex h-10 items-center gap-1 rounded-xl bg-white px-4 hover:bg-surface">다음 <ChevronRight size={16} aria-hidden /></Link> : <span className="flex h-10 items-center gap-1 px-4 text-muted">다음 <ChevronRight size={16} aria-hidden /></span>}
        </nav>
      )}
    </>
  );
}

export default function CommunityPage(props: PageProps<"/community">) {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">커뮤니티</h1>
          <p className="mt-1 text-body">만드는 사람들끼리 자유롭게 이야기해요.</p>
        </div>
        <Link
          href="/community/new"
          className="flex h-12 shrink-0 items-center rounded-[14px] bg-primary px-5 font-semibold text-white hover:bg-primary-hover active:scale-[0.96]"
        >
          글쓰기
        </Link>
      </div>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-white/70" />}>
        <PostList {...props} />
      </Suspense>
    </main>
  );
}
