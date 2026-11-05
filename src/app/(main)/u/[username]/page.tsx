import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProjectCard } from "@/components/project/ProjectCard";
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
    .select("id,title,tagline,thumbnail_url,hypes(count)")
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
      {projects?.length ? (
        <ul className="mt-4 grid grid-cols-1 gap-x-5 gap-y-9 sm:grid-cols-2">
          {projects.map((p) => (
            <li key={p.id}>
              <ProjectCard p={p} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-muted">아직 올린 프로젝트가 없어요.</p>
      )}
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
