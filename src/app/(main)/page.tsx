import Link from "next/link";
import { Suspense } from "react";
import { RotatingText } from "@/components/ui/RotatingText";
import { ProjectCard, SPANS, THEMES } from "@/components/project/ProjectCard";
import { CATEGORIES, categoryOf, isCategory } from "@/lib/categories";
import { SAMPLE_PROJECTS } from "@/lib/sample-projects";
import { db } from "@/lib/supabase/server";

const HERO_WORDS = ["개발", "업무", "디자인", "공부", "게임", "기록"];

const GRID = "grid auto-rows-[220px] grid-cols-1 gap-2 md:grid-cols-4 md:grid-flow-dense";

const KINDS = [
  { key: "", label: "전체" },
  { key: "launch", label: "🚀 출시" },
  { key: "personal_tool", label: "🛠 개인용" },
];

type Filters = { q: string; kind: string; cat: string };

// 현재 필터를 유지한 채 일부만 바꾼 URL
function href(f: Filters, change: Partial<Filters>) {
  const next = { ...f, ...change };
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(next)) if (v) u.set(k, v);
  const s = u.toString();
  return s ? `/?${s}` : "/";
}

async function Browse({ searchParams }: PageProps<"/">) {
  const sp = await searchParams;
  const f: Filters = {
    // PostgREST or() 문법을 깨는 문자는 제거 (필터 주입 방지)
    q: String(sp.q ?? "").replace(/[,()%*\\"]/g, " ").trim().slice(0, 50),
    kind: KINDS.some((k) => k.key && k.key === sp.kind) ? String(sp.kind) : "",
    cat: isCategory(sp.cat) ? String(sp.cat) : "",
  };

  let query = db
    .from("projects")
    .select("id,title,tagline,thumbnail_url,kind,category,profiles(username),hypes(count)")
    .order("created_at", { ascending: false })
    .limit(27);
  if (f.kind) query = query.eq("kind", f.kind);
  if (f.cat) query = query.eq("category", f.cat);
  if (f.q) query = query.or(`title.ilike.%${f.q}%,tagline.ilike.%${f.q}%`);
  const { data } = await query;

  // shortcut: 개발 모드에서 DB 가 비어 있으면 샘플로 디자인 확인. 운영에서는 빈 상태 문구.
  const projects = data?.length
    ? data
    : process.env.NODE_ENV === "development"
      ? SAMPLE_PROJECTS.filter(
          (p) =>
            (!f.kind || p.kind === f.kind) &&
            (!f.cat || p.category === f.cat) &&
            (!f.q || `${p.title} ${p.tagline}`.toLowerCase().includes(f.q.toLowerCase())),
        )
      : [];

  const title = f.q ? `‘${f.q}’ 검색 결과` : f.cat ? `${categoryOf(f.cat).emoji} ${categoryOf(f.cat).label}` : "새로 올라온 프로젝트";
  const catItem = (key: string, label: string) => {
    const active = f.cat === key;
    return (
      <Link
        key={key || "all"}
        href={href(f, { cat: key })}
        aria-current={active ? "page" : undefined}
        className={`flex h-9 shrink-0 items-center rounded-full px-4 text-sm font-semibold lg:rounded-xl lg:px-3 ${active ? "bg-foreground text-white" : "bg-white text-body hover:bg-surface lg:bg-transparent lg:hover:bg-white"}`}
      >
        {label}
      </Link>
    );
  };

  return (
    <>
      <div className="lg:grid lg:grid-cols-[180px_1fr] lg:gap-8">
        {/* 카테고리: 데스크톱은 스티키 사이드바, 모바일은 가로 스크롤 칩 */}
        <aside className="mb-5 lg:sticky lg:top-20 lg:mb-0 lg:self-start">
          <p className="mb-2 hidden px-3 text-xs font-semibold text-muted lg:block">카테고리</p>
          <nav aria-label="카테고리" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:px-0">
            {catItem("", "🌈 전체")}
            {CATEGORIES.map((c) => catItem(c.key, `${c.emoji} ${c.label}`))}
          </nav>
        </aside>

        <section>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold">{title}</h2>
              {f.q && (
                <Link href={href(f, { q: "" })} className="text-sm text-muted hover:text-body">
                  검색어 지우기 ✕
                </Link>
              )}
            </div>
            <nav className="flex gap-1.5" aria-label="종류 필터">
              {KINDS.map((k) => (
                <Link
                  key={k.key}
                  href={href(f, { kind: k.key })}
                  aria-current={f.kind === k.key ? "page" : undefined}
                  className={`flex h-9 items-center rounded-full px-4 text-sm font-semibold ${f.kind === k.key ? "bg-foreground text-white" : "bg-white text-body hover:bg-surface"}`}
                >
                  {k.label}
                </Link>
              ))}
            </nav>
          </div>
          {!projects.length ? (
            <p className="rounded-3xl bg-white py-20 text-center text-muted">
              {f.q || f.cat || f.kind ? "조건에 맞는 프로젝트가 없어요." : "아직 올라온 프로젝트가 없어요. 첫 번째가 되어 보세요!"}
            </p>
          ) : (
            <ul className={GRID}>
              {projects.map((p, i) => (
                <li key={p.id} className="contents">
                  <ProjectCard p={p} index={i} span={projects.length >= SPANS.length ? SPANS[i % SPANS.length] : "md:col-span-2"} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* 하단 알약 띠 (화면 끝까지) */}
      {projects.length >= 5 && (
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
      )}
    </>
  );
}

function BrowseSkeleton() {
  return (
    <div className="lg:grid lg:grid-cols-[180px_1fr] lg:gap-8" aria-hidden>
      <div className="mb-5 hidden h-80 animate-pulse rounded-2xl bg-white/60 lg:block" />
      <ul className={GRID}>
        {Array.from({ length: 6 }, (_, i) => (
          <li key={i} className="animate-pulse rounded-3xl bg-white/70" />
        ))}
      </ul>
    </div>
  );
}

export default function Home(props: PageProps<"/">) {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-16">
      <section className="py-14 text-center sm:py-20">
        <h1 className="text-4xl font-bold leading-tight sm:text-5xl sm:leading-[1.3]">
          내가 <RotatingText words={HERO_WORDS} />하려고 만든 앱,
          <br />
          모두에게 보여주세요
        </h1>
        <p className="mt-4 text-body">직접 만든 앱·웹을 올리고 피드백과 Hype를 받아보세요.</p>
        <Link
          href="/projects/new"
          className="mt-8 inline-flex h-14 items-center rounded-button bg-primary px-7 text-[17px] font-semibold text-white hover:bg-primary-hover active:scale-[0.96]"
        >
          프로젝트 올리기
        </Link>
      </section>
      <Suspense fallback={<BrowseSkeleton />}>
        <Browse {...props} />
      </Suspense>
    </main>
  );
}
