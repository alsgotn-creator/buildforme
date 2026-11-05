import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getUser } from "@/lib/supabase/auth";
import { db } from "@/lib/supabase/server";

const isHttp = (v: string) => /^https?:\/\//i.test(v);

async function createProject(formData: FormData) {
  "use server";
  const user = await getUser();
  if (!user) redirect("/login");

  const str = (k: string) => String(formData.get(k) ?? "").trim();
  const title = str("title");
  const url = str("url");
  const repoUrl = str("repo_url");
  const kind = str("kind") === "personal_tool" ? "personal_tool" : "launch";
  if (!title || title.length > 100) redirect("/projects/new?error=title");
  // 서버에서 http(s) 만 허용 (javascript: 링크 방지)
  if ((url && !isHttp(url)) || (repoUrl && !isHttp(repoUrl))) redirect("/projects/new?error=url");

  const { data, error } = await db
    .from("projects")
    .insert({
      owner_id: user.id,
      title,
      tagline: str("tagline") || null,
      description: str("description") || null,
      kind,
      url: url || null,
      repo_url: repoUrl || null,
      tags: str("tags").split(",").map((t) => t.trim()).filter(Boolean).slice(0, 5),
    })
    .select("id")
    .single();
  if (error) redirect("/projects/new?error=save");
  redirect(`/projects/${data.id}`);
}

const input = "mt-1 w-full rounded-md border border-border px-3 py-3 outline-none focus:border-primary";
const ERRORS: Record<string, string> = {
  title: "제목은 1~100자로 입력해 주세요.",
  url: "링크는 http:// 또는 https:// 로 시작해야 해요.",
  save: "저장에 실패했어요. 다시 시도해 주세요.",
};

async function NewProjectForm({ searchParams }: PageProps<"/projects/new">) {
  if (!(await getUser())) redirect("/login");
  const { error } = await searchParams;
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-12">
      <h1 className="text-3xl font-bold">프로젝트 올리기</h1>
      {typeof error === "string" && ERRORS[error] && (
        <p className="mt-4 text-sm text-danger">{ERRORS[error]}</p>
      )}
      <form action={createProject} className="mt-8 space-y-5">
        <label className="block text-sm font-semibold">제목
          <input name="title" required maxLength={100} className={input} />
        </label>
        <label className="block text-sm font-semibold">한 줄 소개
          <input name="tagline" maxLength={150} className={input} />
        </label>
        <label className="block text-sm font-semibold">종류
          <select name="kind" className={input}>
            <option value="launch">출시한 서비스</option>
            <option value="personal_tool">개인용 도구</option>
          </select>
        </label>
        <label className="block text-sm font-semibold">서비스 링크
          <input name="url" type="url" placeholder="https://" className={input} />
        </label>
        <label className="block text-sm font-semibold">GitHub 링크
          <input name="repo_url" type="url" placeholder="https://github.com/..." className={input} />
        </label>
        <label className="block text-sm font-semibold">태그 (쉼표로 구분, 최대 5개)
          <input name="tags" className={input} />
        </label>
        <label className="block text-sm font-semibold">설명
          <textarea name="description" rows={6} maxLength={5000} className={input} />
        </label>
        <button className="h-14 w-full rounded-button bg-primary text-[17px] font-semibold text-white hover:bg-primary-hover active:scale-[0.96]">
          올리기
        </button>
      </form>
    </main>
  );
}

export default function NewProjectPage(props: PageProps<"/projects/new">) {
  return (
    <Suspense>
      <NewProjectForm {...props} />
    </Suspense>
  );
}
