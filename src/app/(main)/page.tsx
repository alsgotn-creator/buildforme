import { ArrowRight, ChevronLeft, ChevronRight, Clock, Download, Flame, Globe, LayoutGrid, Mail, PenLine, Rocket, TrendingUp, UserPlus, Wrench, X, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { RotatingText } from "@/components/ui/RotatingText";
import { ProjectCard, SPANS, THEMES, type CardProject } from "@/components/project/ProjectCard";
import { CATEGORIES, categoryOf, isCategory } from "@/lib/categories";
import { SAMPLE_PROJECTS } from "@/lib/sample-projects";
import { db } from "@/lib/supabase/server";

const HERO_WORDS = ["개발", "업무", "디자인", "공부", "게임", "기록"];

// 등록 방법 안내 (홈 상단)
const STEPS: { Icon: LucideIcon; title: string; desc: string }[] = [
  { Icon: UserPlus, title: "가입하기", desc: "카카오·구글·GitHub 또는 이메일로 바로 시작해요." },
  { Icon: PenLine, title: "프로젝트 소개", desc: "프로젝트명, 한 줄 소개, 카테고리, 썸네일을 넣어요." },
  { Icon: Globe, title: "도메인 · 특징", desc: "써볼 수 있는 주소와 특징, 설치 방법을 적어요." },
  { Icon: Mail, title: "연락처 남기고 공개", desc: "연락받을 곳을 적으면 Hype·후기·제휴 문의가 와요." },
];

const GRID = "grid auto-rows-[220px] grid-cols-1 gap-2 md:grid-cols-4 md:grid-flow-dense";

const KINDS: { key: string; label: string; Icon?: LucideIcon }[] = [
  { key: "", label: "전체" },
  { key: "launch", label: "출시", Icon: Rocket },
  { key: "personal_tool", label: "개인용", Icon: Wrench },
];

// 카드 위 가로 정렬 바. col 은 project_feed 뷰의 정렬 컬럼.
const SORTS = [
  { key: "popular", label: "인기순", Icon: TrendingUp, col: "popularity" },
  { key: "downloads", label: "다운로드순", Icon: Download, col: "download_count" },
  { key: "hype", label: "Hype순", Icon: Flame, col: "hype_count" },
  { key: "latest", label: "최신순", Icon: Clock, col: "created_at" },
] as const;
type SortKey = (typeof SORTS)[number]["key"];
const PAGE_SIZE = 27;

type Filters = { q: string; kind: string; cat: string; sort: string; page: string };

// 현재 필터를 유지한 채 일부만 바꾼 URL. 기본값(인기순·1페이지)은 URL 에서 뺀다. 필터가 바뀌면 1페이지로.
function href(f: Filters, change: Partial<Filters>) {
  const next = { ...f, page: "", ...change };
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(next)) {
    if (!v || (k === "sort" && v === "popular") || (k === "page" && v === "1")) continue;
    u.set(k, v);
  }
  const s = u.toString();
  return s ? `/?${s}` : "/";
}

// 예시 카드 정렬 (DB 가 비었을 때)
const sampleScore = (p: (typeof SAMPLE_PROJECTS)[number], sort: SortKey) => {
  const hype = p.hypes?.[0]?.count ?? 0;
  const dl = p.download_count ?? 0;
  if (sort === "downloads") return dl;
  if (sort === "hype") return hype;
  if (sort === "latest") return -Number(p.id.split("-")[1]);
  return hype * 3 + dl;
};

async function Browse({ searchParams }: PageProps<"/">) {
  const sp = await searchParams;
  const sort = SORTS.find((x) => x.key === sp.sort) ?? SORTS[0];
  const page = Math.max(1, Math.min(1000, Number.parseInt(String(sp.page ?? "1"), 10) || 1));
  const f: Filters = {
    // PostgREST or() 문법을 깨는 문자는 제거 (필터 주입 방지)
    q: String(sp.q ?? "").replace(/[,()%*\\"]/g, " ").trim().slice(0, 50),
    kind: KINDS.some((k) => k.key && k.key === sp.kind) ? String(sp.kind) : "",
    cat: isCategory(sp.cat) ? String(sp.cat) : "",
    sort: sort.key,
    page: String(page),
  };

  let query = db
    .from("project_feed")
    .select("id,title,tagline,thumbnail_url,kind,category,owner_username,hype_count,download_count", { count: "exact" })
    .order(sort.col, { ascending: false })
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (f.kind) query = query.eq("kind", f.kind);
  if (f.cat) query = query.eq("category", f.cat);
  if (f.q) query = query.or(`title.ilike.%${f.q}%,tagline.ilike.%${f.q}%`);
  const { data, count } = await query;

  // shortcut: DB 에 프로젝트가 없으면 예시 카드를 보여준다(초기 오픈용). 실제 글이 쌓이면 SAMPLE_PROJECTS 를 지울 것.
  const usingSamples = !data?.length && page === 1;
  const projects: CardProject[] = data?.length
    ? data.map((p) => ({ ...p, hypes: [{ count: p.hype_count }], profiles: { username: p.owner_username } }))
    : usingSamples
      ? SAMPLE_PROJECTS.filter(
          (p) =>
            (!f.kind || p.kind === f.kind) &&
            (!f.cat || p.category === f.cat) &&
            (!f.q || `${p.title} ${p.tagline}`.toLowerCase().includes(f.q.toLowerCase())),
        ).sort((a, b) => sampleScore(b, sort.key) - sampleScore(a, sort.key))
      : [];
  const totalPages = usingSamples ? 1 : Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  const title = f.q ? `‘${f.q}’ 검색 결과` : f.cat ? categoryOf(f.cat).label : "프로젝트 둘러보기";
  const catItem = (key: string, label: string, Icon: LucideIcon) => {
    const active = f.cat === key;
    return (
      <Link
        key={key || "all"}
        href={href(f, { cat: key })}
        aria-current={active ? "page" : undefined}
        className={`flex h-9 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold lg:rounded-xl lg:px-3 ${active ? "bg-foreground text-white" : "bg-white text-body hover:bg-surface lg:bg-transparent lg:hover:bg-white"}`}
      >
        <Icon size={16} aria-hidden /> {label}
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
            {catItem("", "전체", LayoutGrid)}
            {CATEGORIES.map((c) => catItem(c.key, c.label, c.Icon))}
          </nav>
        </aside>

        <section>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold">{title}</h2>
              {f.q && (
                <Link href={href(f, { q: "" })} className="inline-flex items-center gap-1 text-sm text-muted hover:text-body">
                  검색어 지우기 <X size={14} aria-hidden />
                </Link>
              )}
            </div>
            <nav className="flex gap-1.5" aria-label="종류 필터">
              {KINDS.map((k) => (
                <Link
                  key={k.key}
                  href={href(f, { kind: k.key })}
                  aria-current={f.kind === k.key ? "page" : undefined}
                  className={`flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-semibold ${f.kind === k.key ? "bg-foreground text-white" : "bg-white text-body hover:bg-surface"}`}
                >
                  {k.Icon && <k.Icon size={16} aria-hidden />} {k.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* 정렬: 카드 바로 위 가로 네비게이션 */}
          <nav aria-label="정렬" className="mb-3 grid grid-cols-4 gap-1 rounded-2xl bg-white p-1">
            {SORTS.map((x) => (
              <Link
                key={x.key}
                href={href(f, { sort: x.key })}
                aria-current={sort.key === x.key ? "page" : undefined}
                className={`flex h-10 items-center justify-center gap-1.5 rounded-xl text-sm font-semibold ${sort.key === x.key ? "bg-foreground text-white" : "text-body hover:bg-surface"}`}
              >
                <x.Icon size={16} aria-hidden className="shrink-0" /> <span className="truncate">{x.label}</span>
              </Link>
            ))}
          </nav>

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

          {totalPages > 1 && (
            <nav aria-label="페이지" className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold">
              {page > 1 ? (
                <Link href={href(f, { page: String(page - 1) })} className="flex h-10 items-center gap-1 rounded-xl bg-white px-4 hover:bg-surface"><ChevronLeft size={16} aria-hidden /> 이전</Link>
              ) : <span className="flex h-10 items-center gap-1 rounded-xl px-4 text-muted"><ChevronLeft size={16} aria-hidden /> 이전</span>}
              <span className="px-2 text-body">{page} / {totalPages}</span>
              {page < totalPages ? (
                <Link href={href(f, { page: String(page + 1) })} className="flex h-10 items-center gap-1 rounded-xl bg-white px-4 hover:bg-surface">다음 <ChevronRight size={16} aria-hidden /></Link>
              ) : <span className="flex h-10 items-center gap-1 rounded-xl px-4 text-muted">다음 <ChevronRight size={16} aria-hidden /></span>}
            </nav>
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

      <section aria-labelledby="howto" className="mb-16 rounded-3xl bg-white p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="howto" className="text-2xl font-bold">이렇게 등록하세요</h2>
            <p className="mt-1 text-body">4단계면 내 웹·앱 홍보 페이지가 완성돼요.</p>
          </div>
          <Link href="/projects/new" className="inline-flex items-center gap-1 font-semibold text-primary hover:text-primary-hover">
            등록하러 가기 <ArrowRight size={18} aria-hidden />
          </Link>
        </div>
        <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="rounded-2xl bg-surface p-5">
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-weak-bg text-weak-fg">
                  <s.Icon size={22} aria-hidden />
                </span>
                <span className="text-sm font-bold text-muted">STEP {i + 1}</span>
              </div>
              <h3 className="mt-4 font-bold">{s.title}</h3>
              <p className="mt-1 text-sm text-body">{s.desc}</p>
            </li>
          ))}
        </ol>
      </section>

      <Suspense fallback={<BrowseSkeleton />}>
        <Browse {...props} />
      </Suspense>
    </main>
  );
}
