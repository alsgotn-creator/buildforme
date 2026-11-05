import Link from "next/link";
import { Suspense } from "react";
import { ProjectCard } from "@/components/project/ProjectCard";
import { db } from "@/lib/supabase/server";

async function Feed() {
  const { data: projects } = await db
    .from("projects")
    .select("id,title,tagline,thumbnail_url,profiles(username),hypes(count)")
    .order("created_at", { ascending: false })
    .limit(30);

  if (!projects?.length) {
    return <p className="mt-10 text-muted">아직 올라온 프로젝트가 없어요. 첫 번째가 되어 보세요!</p>;
  }
  return (
    <ul className="mt-10 grid grid-cols-1 gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((p) => (
        <li key={p.id}>
          <ProjectCard p={p} />
        </li>
      ))}
    </ul>
  );
}

// 로딩 중 자리 표시(스켈레톤)
function FeedSkeleton() {
  return (
    <ul className="mt-10 grid grid-cols-1 gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
      {Array.from({ length: 6 }, (_, i) => (
        <li key={i}>
          <div className="aspect-[16/10] animate-pulse rounded-2xl bg-surface" />
          <div className="mt-3 h-5 w-2/3 animate-pulse rounded bg-surface" />
        </li>
      ))}
    </ul>
  );
}

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-12">
      <section className="rounded-3xl bg-weak-bg px-6 py-12 sm:px-10">
        <h1 className="text-3xl font-bold leading-tight sm:text-4xl sm:leading-[54px]">
          내가 만든 앱,
          <br />
          세상에 보여주세요
        </h1>
        <p className="mt-3 text-body">직접 만든 앱·웹을 올리고 피드백과 Hype를 받아보세요.</p>
        <Link
          href="/projects/new"
          className="mt-6 inline-flex h-14 items-center rounded-button bg-primary px-5 text-[17px] font-semibold text-white hover:bg-primary-hover active:scale-[0.96]"
        >
          프로젝트 올리기
        </Link>
      </section>
      <Suspense fallback={<FeedSkeleton />}>
        <Feed />
      </Suspense>
    </main>
  );
}
