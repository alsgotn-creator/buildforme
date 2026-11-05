import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ProjectFields } from "@/components/project/ProjectFields";
import { PROJECT_ERRORS, parseProjectForm } from "@/lib/project-input";
import { getUser } from "@/lib/supabase/auth";
import { uploadThumbnail } from "@/lib/upload";
import { db } from "@/lib/supabase/server";

async function createProject(formData: FormData) {
  "use server";
  const user = await getUser();
  if (!user) redirect("/login");

  const parsed = parseProjectForm(formData);
  if (parsed.error) redirect(`/projects/new?error=${parsed.error}`);
  const up = await uploadThumbnail(formData, user.id);
  if (up.error) redirect(`/projects/new?error=${up.error}`);
  if (up.url) parsed.values.thumbnail_url = up.url;

  const { data, error } = await db
    .from("projects")
    .insert({ owner_id: user.id, ...parsed.values })
    .select("id")
    .single();
  if (error) redirect("/projects/new?error=save");
  redirect(`/projects/${data.id}`);
}

async function NewProjectForm({ searchParams }: PageProps<"/projects/new">) {
  if (!(await getUser())) redirect("/login");
  const { error } = await searchParams;
  return (
    <main className="mx-auto my-10 w-[calc(100%-2rem)] rounded-3xl bg-white px-6 py-10 sm:px-10 max-w-2xl">
      <h1 className="text-3xl font-bold">프로젝트 올리기</h1>
      <p className="mt-2 text-body">4단계만 채우면 나만의 홍보 페이지가 완성돼요.</p>
      {typeof error === "string" && PROJECT_ERRORS[error] && (
        <p className="mt-4 text-sm text-danger">{PROJECT_ERRORS[error]}</p>
      )}
      <form action={createProject} className="mt-8 space-y-5">
        <ProjectFields />
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
