import { redirect } from "next/navigation";
import { Suspense } from "react";
import { PostFields } from "@/components/community/PostFields";
import { parsePostForm } from "@/lib/community";
import { getUser } from "@/lib/supabase/auth";
import { db } from "@/lib/supabase/server";

async function createPost(formData: FormData) {
  "use server";
  const user = await getUser();
  if (!user) redirect("/login");

  const values = parsePostForm(formData);
  if (!values) redirect("/community/new?error=1");

  const { data, error } = await db.from("posts").insert({ author_id: user.id, ...values }).select("id").single();
  if (error) redirect("/community/new?error=1");
  redirect(`/community/${data.id}`);
}

async function NewPostForm({ searchParams }: PageProps<"/community/new">) {
  if (!(await getUser())) redirect("/login");
  const { error } = await searchParams;
  return (
    <main className="mx-auto my-10 w-[calc(100%-2rem)] max-w-2xl rounded-3xl bg-white px-6 py-10 sm:px-10">
      <h1 className="text-3xl font-bold">글쓰기</h1>
      {error && <p role="alert" className="mt-4 text-sm text-danger">제목(100자 이내)과 내용을 입력해 주세요.</p>}
      <form action={createPost} className="mt-8 space-y-5">
        <PostFields />
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
