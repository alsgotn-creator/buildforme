import { CheckCircle2, ExternalLink, Flame, Mail, Pencil, Star, Terminal, Trash2 } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { connection } from "next/server";
import { Suspense } from "react";
import { GithubIcon } from "@/components/ui/BrandIcons";
import { categoryOf } from "@/lib/categories";
import { SAMPLE_PROJECTS } from "@/lib/sample-projects";
import { getUser, getViewer } from "@/lib/supabase/auth";
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
  const viewer = await getViewer();
  const projectId = String(formData.get("project_id"));
  if (!viewer) redirect("/login");
  if (!UUID.test(projectId)) return;
  // 본인 글만, 관리자는 전부 삭제 가능
  let q = db.from("projects").delete().eq("id", projectId);
  if (!viewer.isAdmin) q = q.eq("owner_id", viewer.id);
  await q;
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

type Review = { id: string; body: string; rating: number | null; profiles: { username: string } | { username: string }[] | null };

async function ProjectView({ params }: PageProps<"/projects/[id]">) {
  const { id } = await params;
  await connection();

  // 예시 프로젝트는 읽기 전용으로 보여준다.
  const sample = SAMPLE_PROJECTS.find((s) => s.id === id);
  if (!sample && !UUID.test(id)) notFound();

  const { data: p } = sample
    ? { data: { ...sample, owner_id: "", url: null, repo_url: null, description: sample.tagline } }
    : await db.from("projects").select("*,profiles(username,display_name)").eq("id", id).maybeSingle();
  if (!p) notFound();

  const viewer = sample ? null : await getViewer();
  const [{ count }, mine, { data: reviews }] = sample
    ? [{ count: p.hypes?.[0]?.count ?? 0 }, { data: null }, { data: [] as Review[] }]
    : await Promise.all([
        db.from("hypes").select("*", { count: "exact", head: true }).eq("project_id", id),
        viewer
          ? db.from("hypes").select("user_id").eq("user_id", viewer.id).eq("project_id", id).maybeSingle()
          : Promise.resolve({ data: null }),
        db.from("reviews").select("id,body,rating,profiles(username)").eq("project_id", id).order("created_at", { ascending: false }),
      ]);
  const owner = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
  const hyped = !!mine.data;
  const canManage = !!viewer && (viewer.id === p.owner_id || viewer.isAdmin);
  const cat = categoryOf(p.category);
  const features: string[] = p.features ?? [];
  const chip = "flex h-12 items-center gap-2 rounded-[14px] bg-surface px-5 font-semibold hover:bg-border";

  return (
    <main className="mx-auto my-10 w-[calc(100%-2rem)] max-w-3xl rounded-3xl bg-white px-6 py-10 sm:px-10">
      {p.thumbnail_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.thumbnail_url} alt="" className="mb-6 aspect-[16/10] w-full rounded-2xl bg-surface object-cover" />
      )}
      <span className="inline-flex items-center gap-1.5 rounded-md bg-weak-bg px-2 py-1 text-xs font-semibold text-weak-fg">
        <cat.Icon size={14} aria-hidden /> {cat.label} · {p.kind === "personal_tool" ? "개인용 도구" : "출시 서비스"}
      </span>
      <h1 className="mt-3 text-3xl font-bold">{p.title}</h1>
      {p.tagline && <p className="mt-1 text-body">{p.tagline}</p>}
      <p className="mt-2 text-sm text-muted">
        <Link href={`/u/${owner?.username}`} className="hover:text-body">@{owner?.username}</Link>
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <form action={toggleHype}>
          <input type="hidden" name="project_id" value={id} />
          <button disabled={!!sample} className={`flex h-12 items-center gap-2 rounded-[14px] px-5 font-semibold active:scale-[0.96] ${hyped ? "bg-weak-bg text-weak-fg" : "bg-primary text-white hover:bg-primary-hover"}`}>
            <Flame size={18} aria-hidden /> Hype {count ?? 0}
          </button>
        </form>
        {/* http(s) 만 저장되도록 등록 시 검사함 */}
        {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer" className={chip}><ExternalLink size={18} aria-hidden /> 써보기</a>}
        {p.repo_url && <a href={p.repo_url} target="_blank" rel="noopener noreferrer" className={chip}><GithubIcon className="h-[18px] w-[18px]" /> GitHub</a>}
        {canManage && <Link href={`/projects/${id}/edit`} className={chip}><Pencil size={18} aria-hidden /> 수정</Link>}
        {canManage && (
          <form action={deleteProject}>
            <input type="hidden" name="project_id" value={id} />
            <button className="flex h-12 items-center gap-2 rounded-[14px] px-5 font-semibold text-danger hover:bg-surface"><Trash2 size={18} aria-hidden /> 삭제</button>
          </form>
        )}
      </div>

      {p.description && <p className="mt-8 whitespace-pre-wrap leading-7 text-body">{p.description}</p>}

      {features.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold">특징</h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-2 rounded-2xl bg-surface p-4">
                <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-primary" aria-hidden />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {p.install_guide && (
        <section className="mt-10">
          <h2 className="flex items-center gap-2 text-xl font-semibold"><Terminal size={20} aria-hidden /> 설치 · 사용 방법</h2>
          <pre className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-2xl bg-foreground p-5 font-mono text-sm leading-6 text-white">{p.install_guide}</pre>
        </section>
      )}

      {p.contact && (
        <section className="mt-10 flex items-center gap-3 rounded-2xl bg-weak-bg p-5">
          <Mail size={20} className="shrink-0 text-weak-fg" aria-hidden />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-weak-fg">연락받을 곳</p>
            {/^https?:\/\//i.test(p.contact) ? (
              <a href={p.contact} target="_blank" rel="noopener noreferrer" className="break-all font-semibold underline">{p.contact}</a>
            ) : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.contact) ? (
              <a href={`mailto:${p.contact}`} className="break-all font-semibold underline">{p.contact}</a>
            ) : (
              <p className="break-all font-semibold">{p.contact}</p>
            )}
          </div>
        </section>
      )}

      <h2 className="mt-12 text-xl font-semibold">후기 {reviews?.length ?? 0}</h2>
      {sample ? (
        <p className="mt-4 text-sm text-muted">샘플 프로젝트에는 후기를 남길 수 없어요.</p>
      ) : viewer ? (
        <form action={addReview} className="mt-4 space-y-3">
          <input type="hidden" name="project_id" value={id} />
          <select name="rating" aria-label="별점" className="rounded-md border border-border px-3 py-2">
            <option value="">별점 없음</option>
            {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{"★".repeat(n)}</option>)}
          </select>
          <textarea name="body" required rows={3} maxLength={2000} placeholder="써본 느낌을 남겨주세요" className="w-full rounded-md border border-border px-3 py-3 outline-none focus:border-primary" />
          <button className="h-12 rounded-[14px] bg-primary px-5 font-semibold text-white hover:bg-primary-hover active:scale-[0.96]">후기 남기기</button>
        </form>
      ) : (
        <p className="mt-4 text-sm text-muted">후기를 남기려면 <Link href="/login" className="font-semibold text-primary">로그인</Link>이 필요해요.</p>
      )}
      <ul className="mt-6 space-y-3">
        {reviews?.map((r) => {
          const a = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
          return (
            <li key={r.id} className="rounded-2xl bg-surface p-4">
              <p className="flex items-center gap-1 text-sm text-muted">
                @{a?.username}
                {r.rating && (
                  <span className="ml-1 flex" aria-label={`별점 ${r.rating}점`}>
                    {Array.from({ length: r.rating }, (_, i) => <Star key={i} size={14} className="fill-[#ffc342] text-[#ffc342]" aria-hidden />)}
                  </span>
                )}
              </p>
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
