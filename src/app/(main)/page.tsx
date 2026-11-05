import { Clock, Download, Flame, Globe, LayoutGrid, Mail, PenLine, Rocket, TrendingUp, UserPlus, Wrench, X, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { RotatingText } from "@/components/ui/RotatingText";
import { THEMES } from "@/components/project/ProjectCard";
import { InfiniteGrid } from "@/components/project/InfiniteGrid";
import { CATEGORIES, categoryOf } from "@/lib/categories";
import { cleanFilters, fetchFeed, type FeedFilters } from "@/lib/feed";

const HERO_WORDS = ["개발", "업무", "디자인", "공부", "게임", "기록"];

// 등록 방법 안내 (홈 상단)
const STEPS: { Icon: LucideIcon; title: string; desc: string }[] = [
  { Icon: UserPlus, title: "가입", desc: "소셜·이메일로 10초" },
  { Icon: PenLine, title: "소개", desc: "이름·한 줄 소개·이미지" },
  { Icon: Globe, title: "도메인 · 특징", desc: "써볼 주소와 장점" },
  { Icon: Mail, title: "연락처", desc: "문의 받을 곳 남기기" },
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
type Filters = FeedFilters;

// 현재 필터를 유지한 채 일부만 바꾼 URL. 기본값(인기순)은 URL 에서 뺀다.
function href(f: Filters, change: Partial<Filters>) {
  const next = { ...f, ...change };
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(next)) {
    if (!v || (k === "sort" && v === "popular")) continue;
    u.set(k, v);
  }
  const s = u.toString();
  return s ? `/?${s}` : "/";
}

async function Browse({ searchParams }: PageProps<"/">) {
  const f = cleanFilters(await searchParams);
  const sort = SORTS.find((x) => x.key === f.sort) ?? SORTS[0];
  const { items: projects, hasMore } = await fetchFeed(f, 1);

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
              <h2 className="text-2xl font-black tracking-[-0.03em]">{title}</h2>
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
            <InfiniteGrid key={JSON.stringify(f)} initial={projects} hasMore={hasMore} filters={f} />
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
        <h1 className="text-4xl font-black leading-[1.15] tracking-[-0.04em] sm:text-6xl sm:leading-[1.12]">
          내가 <RotatingText words={HERO_WORDS} />하려고 만든 앱,
          <br />
          모두에게 보여주세요
        </h1>
        <p className="mt-4 text-lg font-semibold leading-snug tracking-[-0.02em] text-body">직접 만든 앱·웹을 올리고 피드백과 Hype를 받아보세요.</p>
        <Link
          href="/projects/new"
          className="mt-8 inline-flex h-14 items-center rounded-button bg-primary px-7 text-[17px] font-bold tracking-[-0.02em] text-white hover:bg-primary-hover active:scale-[0.96]"
        >
          프로젝트 올리기
        </Link>
      </section>

      <section aria-labelledby="howto" className="mb-6 rounded-xl bg-white/70 px-3 py-2">
        {/* 항상 한 줄: 좁은 화면에서는 줄바꿈 대신 가로 스크롤 */}
        <div className="flex items-center gap-x-4 overflow-x-auto whitespace-nowrap">
          <h2 id="howto" className="shrink-0 text-xs text-body">이렇게 등록하세요</h2>
          <ol className="flex flex-1 items-center justify-between gap-x-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex shrink-0 items-center gap-1 text-xs leading-tight tracking-[-0.02em] text-body">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-weak-bg text-weak-fg">
                  <s.Icon size={11} aria-hidden />
                </span>
                <span>{i + 1}. {s.title}</span>
                <span className="hidden text-muted xl:inline">{s.desc}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <Suspense fallback={<BrowseSkeleton />}>
        <Browse {...props} />
      </Suspense>
    </main>
  );
}
