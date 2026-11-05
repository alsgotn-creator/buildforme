import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { db } from "@/lib/supabase/server";

async function Profile({ params }: PageProps<"/u/[username]">) {
  const { username } = await params;
  const { data: profile } = await db
    .from("profiles")
    .select("id,username,display_name,avatar_url,bio")
    .eq("username", username.toLowerCase())
    .maybeSingle();
  if (!profile) notFound();

  const { data: projects } = await db
    .from("projects")
    .select("id,title,tagline,hypes(count)")
    .eq("owner_id", profile.id)
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <div className="flex items-center gap-4">
        {profile.avatar_url && (
          // 외부 아바타 도메인을 next/image 에 등록하지 않으려고 img 사용
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatar_url} alt="" className="h-16 w-16 rounded-full bg-surface" />
        )}
        <div>
          <h1 className="text-3xl font-bold">{profile.display_name ?? profile.username}</h1>
          <p className="text-muted">@{profile.username}</p>
        </div>
      </div>
      {profile.bio && <p className="mt-4 whitespace-pre-wrap text-body">{profile.bio}</p>}

      <h2 className="mt-10 text-xl font-semibold">올린 프로젝트 {projects?.length ?? 0}</h2>
      <ul className="mt-4 space-y-3">
        {projects?.map((p) => (
          <li key={p.id}>
            <Link href={`/projects/${p.id}`} className="block rounded-2xl bg-surface p-5 hover:bg-border">
              <div className="flex justify-between gap-4">
                <span className="font-semibold">{p.title}</span>
                <span className="shrink-0 text-sm text-weak-fg">🔥 {p.hypes?.[0]?.count ?? 0}</span>
              </div>
              {p.tagline && <p className="mt-1 text-body">{p.tagline}</p>}
            </Link>
          </li>
        ))}
        {projects?.length === 0 && <li className="text-muted">아직 올린 프로젝트가 없어요.</li>}
      </ul>
    </main>
  );
}

export default function ProfilePage(props: PageProps<"/u/[username]">) {
  return (
    <Suspense>
      <Profile {...props} />
    </Suspense>
  );
}
