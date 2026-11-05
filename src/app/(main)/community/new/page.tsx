import { redirect } from "next/navigation";
import { Suspense } from "react";
import { TOPICS, isTopic } from "@/lib/community";
import { getUser } from "@/lib/supabase/auth";
import { db } from "@/lib/supabase/server";

async function createPost(formData: FormData) {
  "use server";
  const user = await getUser();
  if (!user) redirect("/login");

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const topic = String(formData.get("topic"));
  if (!title || title.length > 100 || !body || body.length > 10000) redirect("/community/new?error=1");

  const { data, error } = await db
    .from("posts")
    .insert({ author_id: user.id, title, body, topic: isTopic(topic) ? topic : "chat" })
    .select("id")
    .single();
  if (error) redirect("/community/new?error=1");
  redirect(`/community/${data.id}`);
}

const input = "mt-1 w-full rounded-md border border-border px-3 py-3 outline-none focus:border-primary";

async function NewPostForm({ searchParams }: PageProps<"/community/new">) {
  if (!(await getUser())) redirect("/login");
  const { error } = await searchParams;
  return (
    <main className="mx-auto my-10 w-[calc(100%-2rem)] max-w-2xl rounded-3xl bg-white px-6 py-10 sm:px-10">
      <h1 className="text-3xl font-bold">글쓰기</h1>
      {error && <p className="mt-4 text-sm text-danger">제목(100자 이내)과 내용을 입력해 주세요.</p>}
      <form action={createPost} className="mt-8 space-y-5">
        <fieldset>
          <legend className="text-sm font-semibold">말머리</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {TOPICS.map((t, i) => (
              <label key={t.key} className="cursor-pointer">
                <input type="radio" name="topic" value={t.key} defaultChecked={i === 0} className="peer sr-only" />
                <span className="flex h-9 items-center gap-1.5 rounded-full bg-surface px-4 text-sm font-semibold text-body peer-checked:bg-foreground peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-primary">
                  <t.Icon size={16} aria-hidden /> {t.label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <label className="block text-sm font-semibold">제목
          <input name="title" required maxLength={100} className={input} />
        </label>
        <label className="block text-sm font-semibold">내용
          <textarea name="body" required rows={12} maxLength={10000} className={input} />
        </label>
        <button className="h-14 w-full rounded-button bg-primary text-[17px] font-semibold text-white hover:bg-primary-hover active:scale-[0.96]">
          등록하기
        </button>
      </form>
    </main>
  );
}

export default function NewPostPage(props: PageProps<"/community/new">) {
  return (
    <Suspense>
      <NewPostForm {...props} />
    </Suspense>
  );
}
