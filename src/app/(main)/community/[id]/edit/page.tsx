import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Suspense } from "react";
import { PostFields } from "@/components/community/PostFields";
import { parsePostForm } from "@/lib/community";
import { getViewer } from "@/lib/supabase/auth";
import { db } from "@/lib/supabase/server";

const UUID = /^[0-9a-f-]{36}$/i;

async function updatePost(formData: FormData) {
  "use server";
  const viewer = await getViewer();
  const id = String(formData.get("post_id"));
  if (!viewer) redirect("/login");
  if (!UUID.test(id)) return;

  const values = parsePostForm(formData);
  if (!values) redirect(`/community/${id}/edit?error=1`);

  // 본인 글만, 관리자는 전부 수정 가능
  let q = db.from("posts").update({ ...values, updated_at: new Date().toISOString() }).eq("id", id);
  if (!viewer.isAdmin) q = q.eq("author_id", viewer.id);
  const { data, error } = await q.select("id");
  if (error || !data?.length) redirect(`/community/${id}/edit?error=1`);
  revalidatePath(`/community/${id}`);
  redirect(`/community/${id}`);
}

async function EditPostForm({ params, searchParams }: PageProps<"/community/[id]/edit">) {
  const { id } = await params;
  const { error } = await searchParams;
  if (!UUID.test(id)) notFound();
  const viewer = await getViewer();
  if (!viewer) redirect("/login");

  const { data: post } = await db.from("posts").select("id,author_id,topic,title,body").eq("id", id).maybeSingle();
  if (!post || (post.author_id !== viewer.id && !viewer.isAdmin)) notFound();

  return (
    <main className="mx-auto my-10 w-[calc(100%-2rem)] max-w-2xl rounded-3xl bg-white px-6 py-10 sm:px-10">
      <h1 className="text-3xl font-bold">글 수정</h1>
      {error && <p role="alert" className="mt-4 text-sm text-danger">제목(100자 이내)과 내용을 확인해 주세요.</p>}
      <form action={updatePost} className="mt-8 space-y-5">
        <input type="hidden" name="post_id" value={id} />
        <PostFields d={post} />
        <button className="h-14 w-full rounded-button bg-primary text-[17px] font-semibold text-white hover:bg-primary-hover active:scale-[0.96]">
          저장
        </button>
      </form>
    </main>
  );
}

export default function EditPostPage(props: PageProps<"/community/[id]/edit">) {
  return (
    <Suspense>
      <EditPostForm {...props} />
    </Suspense>
  );
}
