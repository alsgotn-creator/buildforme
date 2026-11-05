import Link from "next/link";
import { Suspense } from "react";
import { ProjectCard, SPANS, THEMES } from "@/components/project/ProjectCard";
import { SAMPLE_PROJECTS } from "@/lib/sample-projects";
import { db } from "@/lib/supabase/server";

const GRID = "grid auto-rows-[220px] grid-cols-1 gap-2 md:grid-cols-4 md:grid-flow-dense";

const TABS = [
  { key: "", label: "전체" },
  { key: "launch", label: "🚀 출시 서비스" },
  { key: "personal_tool", label: "🛠 개인용 도구" },
];

async function Feed({ searchParams }: PageProps<"/">) {
  const sp = await searchParams;
  const kind = TABS.some((t) => t.key && t.key === sp.kind) ? String(sp.kind) : "";
  let q = db
    .from("projects")
    .select("id,title,tagline,thumbnail_url,kind,profiles(username),hypes(count)")
    .order("created_at", { ascending: false })
    .limit(27);
  if (kind) q = q.eq("kind", kind);
  const { data } = await q;
  // shortcut: 개발 모드에서 비어 있으면 샘플로 디자인 확인. 운영에서는 빈 상태 문구.
  const projects = data?.length
    ? data
    : process.env.NODE_ENV === "development"
      ? SAMPLE_PROJECTS.filter((p) => !kind || p.kind === kind)
      : [];

  return (
    <>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-2xl font-bold">새로 올라온 프로젝트</h2>
        <nav className="flex gap-1.5" aria-label="종류 필터">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={t.key ? `/?kind=${t.key}` : "/"}
              aria-current={kind === t.key ? "page" : undefined}
              className={`flex h-9 items-center rounded-full px-4 text-sm font-semibold ${kind === t.key ? "bg-foreground text-white" : "bg-white text-body hover:bg-surface"}`}
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </div>
      {!projects.length && <p className="py-20 text-center text-muted">아직 올라온 프로젝트가 없어요. 첫 번째가 되어 보세요!</p>}
      <ul className={GRID}>
        {projects.map((p, i) => (
          <li key={p.id} className={`contents`}>
            <ProjectCard p={p} index={i} span={projects.length >= SPANS.length ? SPANS[i % SPANS.length] : "md:col-span-2"} />
          </li>
        ))}
      </ul>
      {/* 하단 알약 띠 */}
      <div className="marquee relative left-1/2 mt-16 w-screen -translate-x-1/2 overflow-hidden" aria-hidden>
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

export default function Home(props: PageProps<"/">) {
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
        <Feed {...props} />
      </Suspense>
    </main>
  );
}
