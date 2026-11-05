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
    .select("id,title,tagline,thumbnail_url,kind,hypes(count)")
    .eq("owner_id", profile.id)
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto my-10 w-[calc(100%-2rem)] rounded-3xl bg-white px-6 py-10 sm:px-10 max-w-3xl">
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
        <ul className="mt-4 grid auto-rows-[220px] grid-cols-1 gap-2 sm:grid-cols-2">
          {projects.map((p, i) => (
            <li key={p.id} className="contents">
              <ProjectCard p={p} index={i} />
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
