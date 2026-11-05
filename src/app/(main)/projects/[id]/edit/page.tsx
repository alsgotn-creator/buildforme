import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Suspense } from "react";
import { ProjectFields } from "@/components/project/ProjectFields";
import { PROJECT_ERRORS, parseProjectForm } from "@/lib/project-input";
import { getViewer } from "@/lib/supabase/auth";
import { uploadThumbnail } from "@/lib/upload";
import { db } from "@/lib/supabase/server";

const UUID = /^[0-9a-f-]{36}$/i;

async function updateProject(formData: FormData) {
  "use server";
  const viewer = await getViewer();
  const id = String(formData.get("project_id"));
  if (!viewer) redirect("/login");
  if (!UUID.test(id)) return;

  const parsed = parseProjectForm(formData);
  if (parsed.error) redirect(`/projects/${id}/edit?error=${parsed.error}`);
  const up = await uploadThumbnail(formData, viewer.id);
  if (up.error) redirect(`/projects/${id}/edit?error=${up.error}`);
  if (up.url) parsed.values.thumbnail_url = up.url;

  // 본인 글만, 관리자는 전부 수정 가능
  let q = db.from("projects").update({ ...parsed.values, updated_at: new Date().toISOString() }).eq("id", id);
  if (!viewer.isAdmin) q = q.eq("owner_id", viewer.id);
  const { data, error } = await q.select("id");
  if (error || !data?.length) redirect(`/projects/${id}/edit?error=save`);
  revalidatePath(`/projects/${id}`);
  redirect(`/projects/${id}`);
}

async function EditForm({ params, searchParams }: PageProps<"/projects/[id]/edit">) {
  const { id } = await params;
  const { error } = await searchParams;
  if (!UUID.test(id)) notFound();
  const viewer = await getViewer();
  if (!viewer) redirect("/login");

  const { data: p } = await db.from("projects").select("*").eq("id", id).maybeSingle();
  if (!p || (p.owner_id !== viewer.id && !viewer.isAdmin)) notFound();

  return (
    <main className="mx-auto my-10 w-[calc(100%-2rem)] rounded-3xl bg-white px-6 py-10 sm:px-10 max-w-2xl">
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
