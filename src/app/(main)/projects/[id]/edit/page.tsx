import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Suspense } from "react";
import { ProjectFields } from "@/components/project/ProjectFields";
import { PROJECT_ERRORS, parseProjectForm } from "@/lib/project-input";
import { getUser } from "@/lib/supabase/auth";
import { db } from "@/lib/supabase/server";

const UUID = /^[0-9a-f-]{36}$/i;

async function updateProject(formData: FormData) {
  "use server";
  const user = await getUser();
  const id = String(formData.get("project_id"));
  if (!user) redirect("/login");
  if (!UUID.test(id)) return;

  const parsed = parseProjectForm(formData);
  if (parsed.error) redirect(`/projects/${id}/edit?error=${parsed.error}`);

  // owner_id 조건으로 본인 글만 수정
  const { data, error } = await db
    .from("projects")
    .update({ ...parsed.values, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("owner_id", user.id)
    .select("id");
  if (error || !data?.length) redirect(`/projects/${id}/edit?error=save`);
  revalidatePath(`/projects/${id}`);
  redirect(`/projects/${id}`);
}

async function EditForm({ params, searchParams }: PageProps<"/projects/[id]/edit">) {
  const { id } = await params;
  const { error } = await searchParams;
  if (!UUID.test(id)) notFound();
  const user = await getUser();
  if (!user) redirect("/login");

  const { data: p } = await db.from("projects").select("*").eq("id", id).maybeSingle();
  if (!p || p.owner_id !== user.id) notFound();

  return (
    <main className="mx-auto my-10 w-[calc(100%-2rem)] rounded-3xl bg-white px-6 py-10 sm:px-10 max-w-xl">
      <h1 className="text-3xl font-bold">프로젝트 수정</h1>
      {typeof error === "string" && PROJECT_ERRORS[error] && (
        <p className="mt-4 text-sm text-danger">{PROJECT_ERRORS[error]}</p>
      )}
      <form action={updateProject} className="mt-8 space-y-5">
        <input type="hidden" name="project_id" value={id} />
        <ProjectFields d={p} />
        <button className="h-14 w-full rounded-button bg-primary text-[17px] font-semibold text-white hover:bg-primary-hover active:scale-[0.96]">
          저장
        </button>
      </form>
    </main>
  );
}

export default function EditProjectPage(props: PageProps<"/projects/[id]/edit">) {
  return (
    <Suspense>
      <EditForm {...props} />
    </Suspense>
  );
}
