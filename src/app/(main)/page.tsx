import Link from "next/link";
import { Suspense } from "react";
import { ProjectCard, SPANS, THEMES } from "@/components/project/ProjectCard";
import { SAMPLE_PROJECTS } from "@/lib/sample-projects";
import { db } from "@/lib/supabase/server";

const GRID = "grid auto-rows-[220px] grid-cols-1 gap-2 md:grid-cols-4 md:grid-flow-dense";

async function Feed() {
  const { data } = await db
    .from("projects")
    .select("id,title,tagline,thumbnail_url,kind,profiles(username),hypes(count)")
    .order("created_at", { ascending: false })
    .limit(27);
  // shortcut: 개발 모드에서 비어 있으면 샘플로 디자인 확인. 운영에서는 빈 상태 문구.
  const projects = data?.length ? data : process.env.NODE_ENV === "development" ? SAMPLE_PROJECTS : [];

  if (!projects.length) {
    return <p className="py-20 text-center text-muted">아직 올라온 프로젝트가 없어요. 첫 번째가 되어 보세요!</p>;
  }
  return (
    <>
      <ul className={GRID}>
        {projects.map((p, i) => (
          <li key={p.id} className={`contents`}>
            <ProjectCard p={p} index={i} span={SPANS[i % SPANS.length]} />
          </li>
        ))}
      </ul>
      {/* 하단 알약 띠 */}
      <div className="marquee mt-16 overflow-hidden" aria-hidden>
        <div className="marquee-track flex w-max gap-3">
          {[...projects, ...projects].map((p, i) => {
            const t = THEMES[i % THEMES.length];
            return (
              <span key={i} className={`flex h-14 items-center whitespace-nowrap rounded-full px-7 font-semibold ${t.bg} ${t.dark ? "text-white" : "text-foreground"}`}>
                {p.title}
              </span>
            );
          })}
        </div>
      </div>
    </>
  );
}

function FeedSkeleton() {
  return (
    <ul className={GRID} aria-hidden>
      {Array.from({ length: 6 }, (_, i) => (
        <li key={i} className="animate-pulse rounded-3xl bg-white/70" />
      ))}
    </ul>
  );
}

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 pb-16">
      <section className="py-16 text-center sm:py-24">
        <h1 className="text-4xl font-bold leading-tight sm:text-5xl sm:leading-[1.3]">
          내가 만든 앱,
          <br />
          <span className="text-primary">모두에게</span> 보여주세요
        </h1>
        <p className="mt-4 text-body">직접 만든 앱·웹을 올리고 피드백과 Hype를 받아보세요.</p>
        <Link
          href="/projects/new"
          className="mt-8 inline-flex h-14 items-center rounded-button bg-primary px-7 text-[17px] font-semibold text-white hover:bg-primary-hover active:scale-[0.96]"
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
