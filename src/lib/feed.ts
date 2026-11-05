import "server-only";
import type { CardProject } from "@/components/project/ProjectCard";
import { isCategory } from "@/lib/categories";
import { SAMPLE_PROJECTS } from "@/lib/sample-projects";
import { db } from "@/lib/supabase/server";

// 홈 피드 조회 (첫 화면 + 무한 스크롤 추가 로드 공용)
export const FEED_PAGE = 18; // 벤토 패턴(9개) 의 배수라 줄이 딱 맞게 끝난다

const SORT_COL = { popular: "popularity", downloads: "download_count", hype: "hype_count", latest: "created_at" } as const;
export type SortKey = keyof typeof SORT_COL;
export type FeedFilters = { q: string; kind: string; cat: string; sort: SortKey };

// URL·클라이언트에서 온 값을 그대로 믿지 않고 다시 정리한다
export function cleanFilters(raw: Record<string, unknown>): FeedFilters {
  const sort = String(raw.sort ?? "");
  return {
    // PostgREST or() 문법을 깨는 문자는 제거 (필터 주입 방지)
    q: String(raw.q ?? "").replace(/[,()%*\\"]/g, " ").trim().slice(0, 50),
    kind: raw.kind === "launch" || raw.kind === "personal_tool" ? raw.kind : "",
    cat: isCategory(raw.cat) ? String(raw.cat) : "",
    sort: sort in SORT_COL ? (sort as SortKey) : "popular",
  };
}

const sampleScore = (p: CardProject, sort: SortKey) => {
  const hype = p.hypes?.[0]?.count ?? 0;
  const dl = p.download_count ?? 0;
  if (sort === "downloads") return dl;
  if (sort === "hype") return hype;
  if (sort === "latest") return -Number(p.id.split("-")[1]);
  return hype * 3 + dl;
};

export async function fetchFeed(f: FeedFilters, page: number): Promise<{ items: CardProject[]; hasMore: boolean }> {
  const from = (page - 1) * FEED_PAGE;
  let query = db
    .from("project_feed")
    .select("id,title,tagline,thumbnail_url,kind,category,owner_username,hype_count,download_count")
    .order(SORT_COL[f.sort], { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, from + FEED_PAGE); // 1개 더 받아서 다음 페이지가 있는지 본다
  if (f.kind) query = query.eq("kind", f.kind);
  if (f.cat) query = query.eq("category", f.cat);
  if (f.q) query = query.or(`title.ilike.%${f.q}%,tagline.ilike.%${f.q}%`);
  const { data } = await query;

  if (data?.length) {
    return {
      items: data.slice(0, FEED_PAGE).map((p) => ({ ...p, hypes: [{ count: p.hype_count }], profiles: { username: p.owner_username } })),
      hasMore: data.length > FEED_PAGE,
    };
  }
  // shortcut: DB 에 프로젝트가 없으면 샘플 카드를 보여준다(초기 오픈용). 실제 글이 쌓이면 SAMPLE_PROJECTS 를 지울 것.
  if (page > 1) return { items: [], hasMore: false };
  const items = SAMPLE_PROJECTS.filter(
    (p) =>
      (!f.kind || p.kind === f.kind) &&
      (!f.cat || p.category === f.cat) &&
      (!f.q || `${p.title} ${p.tagline}`.toLowerCase().includes(f.q.toLowerCase())),
  ).sort((a, b) => sampleScore(b, f.sort) - sampleScore(a, f.sort));
  return { items, hasMore: false };
}
