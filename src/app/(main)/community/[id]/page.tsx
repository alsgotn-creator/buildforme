import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { connection } from "next/server";
import { Suspense } from "react";
import { SAMPLE_POSTS, timeAgo, topicOf } from "@/lib/community";
import { getUser, getViewer } from "@/lib/supabase/auth";
import { db } from "@/lib/supabase/server";

const UUID = /^[0-9a-f-]{36}$/i;

async function deletePost(formData: FormData) {
  "use server";
  const viewer = await getViewer();
  const id = String(formData.get("post_id"));
  if (!viewer) redirect("/login");
  if (!UUID.test(id)) return;
  // 본인 글만, 관리자는 전부 삭제 가능
  let q = db.from("posts").delete().eq("id", id);
  if (!viewer.isAdmin) q = q.eq("author_id", viewer.id);
  await q;
  redirect("/community");
}

async function addComment(formData: FormData) {
  "use server";
  const user = await getUser();
  const id = String(formData.get("post_id"));
  if (!user) redirect("/login");
  const body = String(formData.get("body") ?? "").trim();
  if (!UUID.test(id) || !body || body.length > 2000) return;
  await db.from("post_comments").insert({ post_id: id, author_id: user.id, body });
  revalidatePath(`/community/${id}`);
}

async function deleteComment(formData: FormData) {
  "use server";
  const viewer = await getViewer();
  const id = String(formData.get("comment_id"));
  const postId = String(formData.get("post_id"));
  if (!viewer) redirect("/login");
  if (!UUID.test(id) || !UUID.test(postId)) return;
  let q = db.from("post_comments").delete().eq("id", id);
  if (!viewer.isAdmin) q = q.eq("author_id", viewer.id);
  await q;
  revalidatePath(`/community/${postId}`);
}

type Comment = { id: string; body: string; created_at: string; author_id: string; profiles: { username: string } | { username: string }[] | null };
const nameOf = (p: { username: string } | { username: string }[] | null) => (Array.isArray(p) ? p[0] : p)?.username;

async function PostView({ params }: PageProps<"/community/[id]">) {
  const { id } = await params;
  await connection(); // 시간(timeAgo)을 요청 시점에 계산

  // shortcut: 개발 모드 샘플 글은 읽기 전용으로 보여준다.
  const sample = process.env.NODE_ENV === "development" ? SAMPLE_POSTS.find((s) => s.id === id) : undefined;
  if (!sample && !UUID.test(id)) notFound();

  const [{ data: post }, { data: comments }, user] = sample
    ? [{ data: { ...sample, author_id: "" } }, { data: [] as Comment[] }, null]
    : await Promise.all([
        db.from("posts").select("id,topic,title,body,created_at,author_id,profiles(username)").eq("id", id).maybeSingle(),
        db.from("post_comments").select("id,body,created_at,author_id,profiles(username)").eq("post_id", id).order("created_at"),
        getViewer(),
      ]);
  if (!post) notFound();
  const t = topicOf(post.topic);
  const author = nameOf(post.profiles);

  return (
    <main className="mx-auto my-10 w-[calc(100%-2rem)] max-w-3xl">
      <Link href="/community" className="mb-4 inline-block text-sm font-semibold text-body hover:text-foreground">
        ← 커뮤니티
      </Link>
      <article className="rounded-3xl bg-white px-6 py-8 sm:px-10">
        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${t.cls}`}><t.Icon size={14} aria-hidden /> {t.label}</span>
        <h1 className="mt-3 text-2xl font-bold leading-snug sm:text-3xl">{post.title}</h1>
        <div className="mt-3 flex items-center justify-between gap-3 border-b border-border pb-5 text-sm text-muted">
          <span>
            {author && <Link href={`/u/${author}`} className="font-semibold text-body hover:text-foreground">@{author}</Link>} · {timeAgo(post.created_at)}
          </span>
          {user && (user.id === post.author_id || user.isAdmin) && (
            <form action={deletePost}>
              <input type="hidden" name="post_id" value={post.id} />
              <button className="font-semibold text-danger">삭제</button>
            </form>
          )}
        </div>
        <p className="mt-6 whitespace-pre-wrap leading-7">{post.body}</p>
      </article>

      <section className="mt-3 rounded-3xl bg-white px-6 py-8 sm:px-10">
        <h2 className="text-lg font-semibold">댓글 {comments?.length ?? 0}</h2>
        <ul className="mt-4 divide-y divide-border">
          {comments?.map((c) => (
            <li key={c.id} className="py-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold">@{nameOf(c.profiles)} <span className="font-normal text-muted">· {timeAgo(c.created_at)}</span></span>
                {user && (user.id === c.author_id || user.isAdmin) && (
                  <form action={deleteComment}>
                    <input type="hidden" name="comment_id" value={c.id} />
                    <input type="hidden" name="post_id" value={post.id} />
                    <button className="text-xs text-muted hover:text-danger">삭제</button>
                  </form>
                )}
              </div>
              <p className="mt-1 whitespace-pre-wrap">{c.body}</p>
            </li>
          ))}
        </ul>
        {sample ? (
          <p className="mt-4 text-sm text-muted">샘플 글에는 댓글을 달 수 없어요.</p>
        ) : user ? (
          <form action={addComment} className="mt-4 space-y-3">
            <input type="hidden" name="post_id" value={post.id} />
            <textarea name="body" required rows={3} maxLength={2000} placeholder="댓글을 남겨 주세요" className="w-full rounded-md border border-border px-3 py-3 outline-none focus:border-primary" />
            <button className="h-12 rounded-[14px] bg-primary px-5 font-semibold text-white hover:bg-primary-hover active:scale-[0.96]">댓글 달기</button>
          </form>
        ) : (
          <p className="mt-4 text-sm text-muted">
            댓글을 남기려면 <Link href="/login" className="font-semibold text-primary">로그인</Link>이 필요해요.
          </p>
        )}
      </section>
    </main>
  );
}

export default function PostPage(props: PageProps<"/community/[id]">) {
  return (
    <Suspense>
      <PostView {...props} />
    </Suspense>
  );
}
