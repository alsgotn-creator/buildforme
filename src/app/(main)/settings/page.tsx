import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Suspense } from "react";
import { getViewer } from "@/lib/supabase/auth";
import { db } from "@/lib/supabase/server";

const USERNAME = /^[a-z0-9_-]{3,30}$/;

async function saveProfile(formData: FormData) {
  "use server";
  const viewer = await getViewer();
  if (!viewer) redirect("/login");

  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const display_name = String(formData.get("display_name") ?? "").trim().slice(0, 50) || null;
  const bio = String(formData.get("bio") ?? "").trim().slice(0, 300) || null;
  if (!USERNAME.test(username)) redirect("/settings?error=username");

  // 다른 사람이 쓰는 username 인지 확인
  const { data: taken } = await db.from("profiles").select("id").eq("username", username).neq("id", viewer.id).maybeSingle();
  if (taken) redirect("/settings?error=taken");

  const { error } = await db.from("profiles").update({ username, display_name, bio }).eq("id", viewer.id);
  if (error) redirect("/settings?error=save");
  revalidatePath(`/u/${username}`);
  redirect(`/u/${username}`);
}

const ERRORS: Record<string, string> = {
  username: "아이디는 영문 소문자·숫자·-_ 로 3~30자여야 해요.",
  taken: "이미 다른 사람이 쓰는 아이디예요.",
  save: "저장에 실패했어요. 다시 시도해 주세요.",
};
const input = "mt-1.5 w-full rounded-md border border-border px-3 py-3 font-normal outline-none focus:border-primary";

async function SettingsForm({ searchParams }: PageProps<"/settings">) {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  const { error } = await searchParams;
  const { data: me } = await db.from("profiles").select("username,display_name,bio").eq("id", viewer.id).maybeSingle();

  return (
    <main className="mx-auto my-10 w-[calc(100%-2rem)] max-w-xl rounded-3xl bg-white px-6 py-10 sm:px-10">
      <h1 className="text-3xl font-bold">프로필 편집</h1>
      {typeof error === "string" && ERRORS[error] && <p role="alert" className="mt-4 text-sm text-danger">{ERRORS[error]}</p>}
      <form action={saveProfile} className="mt-8 space-y-5">
        <label className="block text-sm font-semibold">아이디
          <input name="username" required pattern="[a-z0-9_\-]{3,30}" defaultValue={me?.username ?? ""} className={input} />
          <span className="mt-1 block text-xs font-normal text-muted">프로필 주소에 쓰여요: /u/아이디</span>
        </label>
        <label className="block text-sm font-semibold">표시 이름
          <input name="display_name" maxLength={50} defaultValue={me?.display_name ?? ""} className={input} />
        </label>
        <label className="block text-sm font-semibold">소개
          <textarea name="bio" rows={4} maxLength={300} defaultValue={me?.bio ?? ""} placeholder="무엇을 만드는 사람인지 소개해 주세요." className={input} />
        </label>
        <button className="h-14 w-full rounded-button bg-primary text-[17px] font-semibold text-white hover:bg-primary-hover active:scale-[0.96]">저장</button>
      </form>
    </main>
  );
}

export default function SettingsPage(props: PageProps<"/settings">) {
  return (
    <Suspense>
      <SettingsForm {...props} />
    </Suspense>
  );
}
