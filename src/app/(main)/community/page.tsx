import Link from "next/link";
import { Suspense } from "react";
import { SAMPLE_POSTS, TOPICS, isTopic, timeAgo, topicOf, type PostRow } from "@/lib/community";
import { db } from "@/lib/supabase/server";

async function PostList({ searchParams }: PageProps<"/community">) {
  const sp = await searchParams;
  const topic = isTopic(sp.topic) ? String(sp.topic) : "";

  let q = db
    .from("posts")
    .select("id,topic,title,body,created_at,profiles(username),post_comments(count)")
    .order("created_at", { ascending: false })
    .limit(50);
  if (topic) q = q.eq("topic", topic);
  const { data } = await q;
  const posts: PostRow[] = data?.length
    ? data
    : process.env.NODE_ENV === "development"
      ? SAMPLE_POSTS.filter((p) => !topic || p.topic === topic)
      : [];

  return (
    <>
      <nav className="-mx-4 mb-4 flex gap-1.5 overflow-x-auto px-4 pb-1" aria-label="말머리 필터">
        {[{ key: "", label: "전체", emoji: "🌈" }, ...TOPICS].map((t) => (
          <Link
            key={t.key || "all"}
            href={t.key ? `/community?topic=${t.key}` : "/community"}
            aria-current={topic === t.key ? "page" : undefined}
            className={`flex h-9 shrink-0 items-center rounded-full px-4 text-sm font-semibold ${topic === t.key ? "bg-foreground text-white" : "bg-white text-body hover:bg-surface"}`}
          >
            {t.emoji} {t.label}
          </Link>
        ))}
      </nav>

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
                    <span aria-hidden>💬</span>
                    <span aria-label={`댓글 ${comments}개`}>{comments}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="rounded-3xl bg-white py-20 text-center text-muted">아직 글이 없어요. 첫 글을 남겨 보세요!</p>
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
