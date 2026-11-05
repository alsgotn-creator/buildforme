import Link from "next/link";
import { categoryOf } from "@/lib/categories";

export type CardProject = {
  id: string;
  title: string;
  tagline: string | null;
  thumbnail_url: string | null;
  kind?: string;
  category?: string | null;
  hypes: { count: number }[] | null;
  profiles?: { username: string } | { username: string }[] | null;
};

// 벤토 그리드 카드 색상 (레퍼런스의 네이비/인디고/핑크/그린 팔레트. DESIGN.md 토큰 밖의 확장 색상)
export const THEMES = [
  { bg: "bg-[#0b1033]", dark: true },
  { bg: "bg-[#e9edf5]", dark: false },
  { bg: "bg-[#2a2adf]", dark: true },
  { bg: "bg-[#c2268a]", dark: true },
  { bg: "bg-[#3dbf74]", dark: true },
  { bg: "bg-[#10174a]", dark: true },
  { bg: "bg-[#1f95e0]", dark: true },
  { bg: "bg-[#e9edf5]", dark: false },
  { bg: "bg-[#6a3df0]", dark: true },
];

// 4열 그리드에서 9개가 4줄을 딱 채우는 크기 패턴 (md 이상). 리터럴이어야 Tailwind 가 인식한다.
export const SPANS = [
  "md:row-span-2",
  "md:col-span-3",
  "md:col-span-2",
  "",
  "md:col-span-2",
  "md:col-span-2",
  "",
  "",
  "md:col-span-2",
];

export function ProjectCard({ p, index = 0, span = "" }: { p: CardProject; index?: number; span?: string }) {
  const owner = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
  const t = THEMES[index % THEMES.length];
  const light = !t.dark && !p.thumbnail_url;
  return (
    <Link
      href={`/projects/${p.id}`}
      className={`group relative block overflow-hidden rounded-3xl ${t.bg} ${span} ${light ? "text-foreground" : "text-white"} transition-transform duration-200 hover:-translate-y-0.5`}
    >
      {p.thumbnail_url ? (
        <>
          {/* 외부 이미지 도메인을 next/image 에 등록하지 않으려고 img 사용 */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.thumbnail_url} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/10 to-black/50" />
        </>
      ) : (
        <span aria-hidden className="absolute -bottom-8 -right-2 select-none text-[9rem] font-bold leading-none opacity-20">
          {p.title.slice(0, 1).toUpperCase()}
        </span>
      )}
      <div className="relative flex h-full flex-col justify-between p-5">
        <div>
          <span className="text-xs font-semibold opacity-80">{categoryOf(p.category).emoji} {categoryOf(p.category).label} · {p.kind === "personal_tool" ? "개인용" : "출시"}</span>
          <h2 className="mt-2 line-clamp-3 text-xl font-bold leading-snug">{p.title}</h2>
          {p.tagline && <p className="mt-1 line-clamp-2 text-sm opacity-80">{p.tagline}</p>}
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className={`rounded-full px-2.5 py-1 font-semibold ${light ? "bg-white" : "bg-white/20"}`}>🔥 {p.hypes?.[0]?.count ?? 0}</span>
          {owner && <span className="opacity-80">@{owner.username}</span>}
        </div>
      </div>
    </Link>
  );
}
