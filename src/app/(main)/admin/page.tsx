import { CheckCheck, ExternalLink, FileText, Flag, Package, Pencil, Shield, ShieldOff, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Suspense } from "react";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { timeAgo } from "@/lib/community";
import { reasonLabel, targetLabel } from "@/lib/reports";
import { getViewer } from "@/lib/supabase/auth";
import { db } from "@/lib/supabase/server";

const UUID = /^[0-9a-f-]{36}$/i;

// 모든 관리자 액션은 서버에서 관리자 여부를 다시 확인한다.
async function requireAdmin() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  if (!viewer.isAdmin) notFound();
  return viewer;
}

async function deleteRow(formData: FormData) {
  "use server";
  await requireAdmin();
  const table = String(formData.get("table"));
  const id = String(formData.get("id"));
  if (!["projects", "posts"].includes(table) || !UUID.test(id)) return;
  await db.from(table).delete().eq("id", id);
  revalidatePath("/admin");
}

// 신고 대상 종류 → 테이블
const TARGET_TABLE: Record<string, string> = { project: "projects", post: "posts", comment: "post_comments", review: "reviews" };

// 신고 처리: resolve = 처리 완료로 표시, remove = 대상 삭제 + 같은 대상의 신고 모두 처리 완료
async function handleReport(formData: FormData) {
  "use server";
  await requireAdmin();
  const id = String(formData.get("id"));
  const action = String(formData.get("action"));
  if (!UUID.test(id)) return;
  const { data: r } = await db.from("reports").select("target_type,target_id").eq("id", id).maybeSingle();
  if (!r) return;
  if (action === "remove" && TARGET_TABLE[r.target_type]) {
    await db.from(TARGET_TABLE[r.target_type]).delete().eq("id", r.target_id);
    await db.from("reports").update({ status: "resolved" }).eq("target_type", r.target_type).eq("target_id", r.target_id);
  } else {
    await db.from("reports").update({ status: "resolved" }).eq("id", id);
  }
  revalidatePath("/admin");
}

async function setRole(formData: FormData) {
  "use server";
  const viewer = await requireAdmin();
  const id = String(formData.get("id"));
  const role = String(formData.get("role"));
  // 자기 자신의 관리자 권한은 해제할 수 없다 (관리자가 0명이 되는 사고 방지)
  if (!UUID.test(id) || !["user", "admin"].includes(role) || id === viewer.id) return;
  await db.from("profiles").update({ role }).eq("id", id);
  revalidatePath("/admin");
}

const TABS = [
  { key: "projects", label: "프로젝트", Icon: Package },
  { key: "posts", label: "게시글", Icon: FileText },
  { key: "users", label: "회원", Icon: Users },
  { key: "reports", label: "처리할 신고", Icon: Flag },
] as const;

const nameOf = (p: unknown) => (Array.isArray(p) ? p[0] : (p as { username?: string } | null))?.username;
const row = "flex items-center gap-3 px-5 py-3";
const iconBtn = "flex h-9 w-9 items-center justify-center rounded-lg text-body hover:bg-surface";

function DeleteButton({ table, id }: { table: string; id: string }) {
  return (
    <form action={deleteRow}>
      <input type="hidden" name="table" value={table} />
      <input type="hidden" name="id" value={id} />
      <ConfirmButton className={`${iconBtn} hover:text-danger`} aria-label="삭제"><Trash2 size={16} /></ConfirmButton>
    </form>
  );
}

async function AdminView({ searchParams }: PageProps<"/admin">) {
  const viewer = await requireAdmin();
  const { tab: rawTab } = await searchParams;
  const tab = TABS.some((t) => t.key === rawTab) ? String(rawTab) : "projects";

  const [projects, posts, users, reports] = await Promise.all([
    db.from("projects").select("id", { count: "exact", head: true }),
    db.from("posts").select("id", { count: "exact", head: true }),
    db.from("profiles").select("id", { count: "exact", head: true }),
    db.from("reports").select("id", { count: "exact", head: true }).eq("status", "open"),
  ]);
  const counts: Record<string, number> = { projects: projects.count ?? 0, posts: posts.count ?? 0, users: users.count ?? 0, reports: reports.count ?? 0 };

  return (
    <main className="mx-auto my-10 w-[calc(100%-2rem)] max-w-5xl">
      <h1 className="flex items-center gap-2 text-3xl font-bold"><Shield size={28} className="text-primary" aria-hidden /> 관리자</h1>

      <nav className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="관리 항목">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin?tab=${t.key}`}
            aria-current={tab === t.key ? "page" : undefined}
            className={`rounded-2xl p-4 ${tab === t.key ? "bg-foreground text-white" : "bg-white hover:bg-surface"}`}
          >
            <t.Icon size={20} aria-hidden />
            <p className="mt-2 text-sm font-semibold opacity-80">{t.label}</p>
            <p className="text-2xl font-bold">{counts[t.key]}</p>
          </Link>
        ))}
      </nav>

      <section className="mt-4 overflow-hidden rounded-3xl bg-white">
        {tab === "projects" && <ProjectRows />}
        {tab === "posts" && <PostRows />}
        {tab === "users" && <UserRows selfId={viewer.id} />}
        {tab === "reports" && <ReportRows />}
      </section>
    </main>
  );
}

async function ProjectRows() {
  const { data } = await db.from("projects").select("id,title,created_at,profiles(username)").order("created_at", { ascending: false }).limit(100);
  if (!data?.length) return <p className="p-10 text-center text-muted">등록된 프로젝트가 없어요.</p>;
  return (
    <ul className="divide-y divide-border">
      {data.map((p) => (
        <li key={p.id} className={row}>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{p.title}</p>
            <p className="text-xs text-muted">@{nameOf(p.profiles)} · {timeAgo(p.created_at)}</p>
          </div>
          <Link href={`/projects/${p.id}`} className={iconBtn} aria-label="보기"><ExternalLink size={16} /></Link>
          <Link href={`/projects/${p.id}/edit`} className={iconBtn} aria-label="수정"><Pencil size={16} /></Link>
          <DeleteButton table="projects" id={p.id} />
        </li>
      ))}
    </ul>
  );
}

async function PostRows() {
  const { data } = await db.from("posts").select("id,title,created_at,profiles(username)").order("created_at", { ascending: false }).limit(100);
  if (!data?.length) return <p className="p-10 text-center text-muted">게시글이 없어요.</p>;
  return (
    <ul className="divide-y divide-border">
      {data.map((p) => (
        <li key={p.id} className={row}>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{p.title}</p>
            <p className="text-xs text-muted">@{nameOf(p.profiles)} · {timeAgo(p.created_at)}</p>
          </div>
          <Link href={`/community/${p.id}`} className={iconBtn} aria-label="보기"><ExternalLink size={16} /></Link>
          <DeleteButton table="posts" id={p.id} />
        </li>
      ))}
    </ul>
  );
}

async function UserRows({ selfId }: { selfId: string }) {
  const { data } = await db.from("profiles").select("id,username,display_name,role,created_at").order("created_at", { ascending: false }).limit(200);
  if (!data?.length) return <p className="p-10 text-center text-muted">회원이 없어요.</p>;
  return (
    <ul className="divide-y divide-border">
      {data.map((u) => {
        const admin = u.role === "admin";
        return (
          <li key={u.id} className={row}>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">
                {u.display_name ?? u.username} <span className="font-normal text-muted">@{u.username}</span>
                {admin && <span className="ml-2 rounded-md bg-weak-bg px-1.5 py-0.5 text-xs font-semibold text-weak-fg">관리자</span>}
              </p>
              <p className="text-xs text-muted">가입 {timeAgo(u.created_at)}</p>
            </div>
            {u.id !== selfId && (
              <form action={setRole}>
                <input type="hidden" name="id" value={u.id} />
                <input type="hidden" name="role" value={admin ? "user" : "admin"} />
                <button className="flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-body hover:bg-surface">
                  {admin ? <><ShieldOff size={16} aria-hidden /> 권한 해제</> : <><Shield size={16} aria-hidden /> 관리자 지정</>}
                </button>
              </form>
            )}
          </li>
        );
      })}
    </ul>
  );
}

async function ReportRows() {
  const { data } = await db
    .from("reports")
    .select("id,target_type,target_id,reason,detail,created_at,profiles(username)")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(100);
  if (!data?.length) return <p className="p-10 text-center text-muted">처리할 신고가 없어요.</p>;

  // 댓글·후기는 부모 글/프로젝트로 링크하기 위해 부모 id 를 찾는다
  const ids = (t: string) => data.filter((r) => r.target_type === t).map((r) => r.target_id);
  const [{ data: comments }, { data: reviews }] = await Promise.all([
    db.from("post_comments").select("id,post_id").in("id", ids("comment").length ? ids("comment") : ["00000000-0000-0000-0000-000000000000"]),
    db.from("reviews").select("id,project_id").in("id", ids("review").length ? ids("review") : ["00000000-0000-0000-0000-000000000000"]),
  ]);
  const linkOf = (t: string, id: string) => {
    if (t === "project") return `/projects/${id}`;
    if (t === "post") return `/community/${id}`;
    if (t === "comment") { const c = comments?.find((x) => x.id === id); return c ? `/community/${c.post_id}` : null; }
    const r = reviews?.find((x) => x.id === id);
    return r ? `/projects/${r.project_id}` : null;
  };

  return (
    <ul className="divide-y divide-border">
      {data.map((r) => {
        const link = linkOf(r.target_type, r.target_id);
        return (
          <li key={r.id} className={row}>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                <span className="mr-2 rounded-md bg-[#ffeeee] px-1.5 py-0.5 text-xs text-danger">{reasonLabel(r.reason)}</span>
                {targetLabel[r.target_type]} {!link && <span className="text-xs font-normal text-muted">(이미 삭제됨)</span>}
              </p>
              {r.detail && <p className="mt-0.5 truncate text-sm text-body">{r.detail}</p>}
              <p className="text-xs text-muted">신고자 @{nameOf(r.profiles)} · {timeAgo(r.created_at)}</p>
            </div>
            {link && <Link href={link} className={iconBtn} aria-label="대상 보기"><ExternalLink size={16} /></Link>}
            <form action={handleReport}>
              <input type="hidden" name="id" value={r.id} />
              <input type="hidden" name="action" value="resolve" />
              <button className={iconBtn} aria-label="처리 완료"><CheckCheck size={16} /></button>
            </form>
            {link && (
              <form action={handleReport}>
                <input type="hidden" name="id" value={r.id} />
                <input type="hidden" name="action" value="remove" />
                <ConfirmButton message="신고된 대상을 삭제할까요?" className={`${iconBtn} hover:text-danger`} aria-label="대상 삭제"><Trash2 size={16} /></ConfirmButton>
              </form>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default function AdminPage(props: PageProps<"/admin">) {
  return (
    <Suspense>
      <AdminView {...props} />
    </Suspense>
  );
}
