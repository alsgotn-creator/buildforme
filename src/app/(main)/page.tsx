import Link from "next/link";
import { Suspense } from "react";
import { db } from "@/lib/supabase/server";

async function Feed() {
  const { data: projects } = await db
    .from("projects")
    .select("id,title,tagline,tags,profiles(username),hypes(count)")
    .order("created_at", { ascending: false })
    .limit(30);

  return (
      <ul className="mt-10 space-y-3">
        {projects?.map((p) => {
          const owner = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
          return (
            <li key={p.id}>
              <Link href={`/projects/${p.id}`} className="block rounded-2xl bg-surface p-5 hover:bg-border">
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-lg font-semibold">{p.title}</h2>
                  <span className="shrink-0 text-sm text-weak-fg">🔥 {p.hypes?.[0]?.count ?? 0}</span>
                </div>
                {p.tagline && <p className="mt-1 text-body">{p.tagline}</p>}
                <p className="mt-2 text-sm text-muted">@{owner?.username}</p>
              </Link>
            </li>
          );
        })}
        {projects?.length === 0 && <li className="text-muted">아직 올라온 프로젝트가 없어요. 첫 번째가 되어 보세요!</li>}
      </ul>
  );
}

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="text-4xl font-bold leading-[54px]">내가 만든 앱, 세상에 보여주세요</h1>
      <p className="mt-2 text-body">직접 만든 앱·웹을 올리고 피드백과 Hype를 받아보세요.</p>
      <Suspense fallback={<p className="mt-10 text-muted">불러오는 중…</p>}>
        <Feed />
      </Suspense>
    </main>
  );
}
