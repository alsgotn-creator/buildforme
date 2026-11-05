import Link from "next/link";

export type CardProject = {
  id: string;
  title: string;
  tagline: string | null;
  thumbnail_url: string | null;
  hypes: { count: number }[] | null;
  profiles?: { username: string } | { username: string }[] | null;
};

// DESIGN.md: 그림자 없이 색 레이어(surface)와 16px 라운드만 사용한다.
export function ProjectCard({ p }: { p: CardProject }) {
  const owner = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
  return (
    <Link href={`/projects/${p.id}`} className="group block">
      <div className="aspect-[16/10] overflow-hidden rounded-2xl bg-weak-bg">
        {p.thumbnail_url ? (
          // 외부 이미지 도메인을 next/image 에 등록하지 않으려고 img 사용
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.thumbnail_url}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl font-bold text-weak-fg">
            {p.title.slice(0, 1).toUpperCase()}
          </div>
        )}
      </div>
      <div className="mt-3 flex items-start justify-between gap-3">
        <h2 className="line-clamp-1 text-[17px] font-semibold">{p.title}</h2>
        <span className="shrink-0 text-sm text-weak-fg">🔥 {p.hypes?.[0]?.count ?? 0}</span>
      </div>
      {p.tagline && <p className="mt-0.5 line-clamp-2 text-sm text-body">{p.tagline}</p>}
      {owner && <p className="mt-1 text-xs text-muted">@{owner.username}</p>}
    </Link>
  );
}
