import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Suspense } from "react";
import { getUser } from "@/lib/supabase/auth";
import { db } from "@/lib/supabase/server";

const UUID = /^[0-9a-f-]{36}$/i;

async function toggleHype(formData: FormData) {
  "use server";
  const user = await getUser();
  const projectId = String(formData.get("project_id"));
  if (!user) redirect("/login");
  if (!UUID.test(projectId)) return;
  const { data: had } = await db.from("hypes").select("user_id").eq("user_id", user.id).eq("project_id", projectId).maybeSingle();
  if (had) await db.from("hypes").delete().eq("user_id", user.id).eq("project_id", projectId);
  else await db.from("hypes").insert({ user_id: user.id, project_id: projectId });
  revalidatePath(`/projects/${projectId}`);
}

async function deleteProject(formData: FormData) {
  "use server";
  const user = await getUser();
  const projectId = String(formData.get("project_id"));
  if (!user) redirect("/login");
  if (!UUID.test(projectId)) return;
  // owner_id 조건으로 본인 글만 삭제
  await db.from("projects").delete().eq("id", projectId).eq("owner_id", user.id);
  redirect("/");
}

async function addReview(formData: FormData) {
  "use server";
  const user = await getUser();
  const projectId = String(formData.get("project_id"));
  if (!user) redirect("/login");
  const body = String(formData.get("body") ?? "").trim();
  const rating = Number(formData.get("rating"));
  if (!UUID.test(projectId) || !body || body.length > 2000) return;
  await db.from("reviews").insert({
    project_id: projectId,
    author_id: user.id,
    body,
    rating: rating >= 1 && rating <= 5 ? rating : null,
  });
  revalidatePath(`/projects/${projectId}`);
}

async function ProjectView({ params }: PageProps<"/projects/[id]">) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const { data: p } = await db
    .from("projects")
    .select("*,profiles(username,display_name)")
    .eq("id", id)
    .maybeSingle();
  if (!p) notFound();

  const user = await getUser();
  const [{ count }, mine, { data: reviews }] = await Promise.all([
    db.from("hypes").select("*", { count: "exact", head: true }).eq("project_id", id),
    user
      ? db.from("hypes").select("user_id").eq("user_id", user.id).eq("project_id", id).maybeSingle()
      : Promise.resolve({ data: null }),
    db.from("reviews").select("id,body,rating,created_at,profiles(username)").eq("project_id", id).order("created_at", { ascending: false }),
  ]);
  const owner = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
  const hyped = !!mine.data;

  return (
    <main className="mx-auto my-10 w-[calc(100%-2rem)] rounded-3xl bg-white px-6 py-10 sm:px-10 max-w-3xl">
      {p.thumbnail_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.thumbnail_url} alt="" className="mb-6 aspect-[16/10] w-full rounded-2xl bg-surface object-cover" />
      )}
      <h1 className="text-3xl font-bold">{p.title}</h1>
      {p.tagline && <p className="mt-1 text-body">{p.tagline}</p>}
      <p className="mt-2 text-sm text-muted">
        <Link href={`/u/${owner?.username}`}>@{owner?.username}</Link>
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <form action={toggleHype}>
          <input type="hidden" name="project_id" value={id} />
          <button className={`h-12 rounded-[14px] px-5 font-semibold active:scale-[0.96] ${hyped ? "bg-weak-bg text-weak-fg" : "bg-primary text-white hover:bg-primary-hover"}`}>
            🔥 Hype {count ?? 0}
          </button>
        </form>
        {/* http(s) 만 저장되도록 등록 시 검사함 */}
        {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer" className="flex h-12 items-center rounded-[14px] bg-surface px-5 font-semibold">써보기</a>}
        {p.repo_url && <a href={p.repo_url} target="_blank" rel="noopener noreferrer" className="flex h-12 items-center rounded-[14px] bg-surface px-5 font-semibold">GitHub</a>}
        {user?.id === p.owner_id && (
          <Link href={`/projects/${id}/edit`} className="flex h-12 items-center rounded-[14px] bg-surface px-5 font-semibold">수정</Link>
        )}
        {user?.id === p.owner_id && (
          <form action={deleteProject}>
            <input type="hidden" name="project_id" value={id} />
            <button className="h-12 rounded-[14px] px-5 font-semibold text-danger hover:bg-surface">삭제</button>
          </form>
        )}
      </div>

      {p.description && <p className="mt-8 whitespace-pre-wrap text-body">{p.description}</p>}

      <h2 className="mt-12 text-xl font-semibold">후기 {reviews?.length ?? 0}</h2>
      {user ? (
        <form action={addReview} className="mt-4 space-y-3">
          <input type="hidden" name="project_id" value={id} />
          <select name="rating" className="rounded-md border border-border px-3 py-2">
            <option value="">별점 없음</option>
            {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{"★".repeat(n)}</option>)}
          </select>
          <textarea name="body" required rows={3} maxLength={2000} placeholder="써본 느낌을 남겨주세요" className="w-full rounded-md border border-border px-3 py-3 outline-none focus:border-primary" />
          <button className="h-12 rounded-[14px] bg-primary px-5 font-semibold text-white hover:bg-primary-hover active:scale-[0.96]">후기 남기기</button>
        </form>
      ) : (
        <p className="mt-4 text-sm text-muted">후기를 남기려면 로그인이 필요해요.</p>
      )}
      <ul className="mt-6 space-y-3">
        {reviews?.map((r) => {
          const a = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
          return (
            <li key={r.id} className="rounded-2xl bg-surface p-4">
              <p className="text-sm text-muted">@{a?.username} {r.rating ? "· " + "★".repeat(r.rating) : ""}</p>
              <p className="mt-1 whitespace-pre-wrap">{r.body}</p>
            </li>
          );
        })}
      </ul>
    </main>
  );
}

export default function ProjectPage(props: PageProps<"/projects/[id]">) {
  return (
    <Suspense>
      <ProjectView {...props} />
    </Suspense>
  );
}
