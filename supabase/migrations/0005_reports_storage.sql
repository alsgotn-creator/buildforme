-- 0005: 신고 + 썸네일 저장소 + 다운로드 수 + 정렬용 피드 뷰. RLS 는 쓰지 않는다(권한 검사는 서버 코드에서).

-- 1) 신고: 프로젝트 / 게시글 / 댓글 / 후기
create table if not exists reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references profiles(id) on delete cascade,
  target_type text not null check (target_type in ('project', 'post', 'comment', 'review')),
  target_id   uuid not null,
  reason      text not null check (reason in ('spam', 'abuse', 'illegal', 'copyright', 'etc')),
  detail      text check (char_length(detail) <= 500),
  status      text not null default 'open' check (status in ('open', 'resolved')),
  created_at  timestamptz not null default now(),
  unique (reporter_id, target_type, target_id) -- 같은 대상을 한 사람이 중복 신고 불가
);
create index if not exists reports_status_idx on reports(status, created_at desc);

-- 2) 썸네일 업로드용 공개 버킷 (읽기 공개, 쓰기는 서버의 secret key 로만)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('thumbnails', 'thumbnails', true, 3145728, array['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

-- 3) 다운로드(써보기 클릭) 수 + 원자적 증가 함수
alter table projects add column if not exists download_count integer not null default 0;

create or replace function increment_download(pid uuid) returns void
language sql as $$
  update projects set download_count = download_count + 1 where id = pid;
$$;

-- 4) 정렬용 피드 뷰: Hype·후기 수와 인기 점수를 미리 계산한다.
--    인기 점수 = Hype × 3 + 후기 × 2 + 다운로드
create or replace view project_feed as
select
  p.id, p.owner_id, p.title, p.tagline, p.kind, p.category, p.thumbnail_url, p.created_at,
  p.download_count,
  pr.username as owner_username,
  coalesce(h.cnt, 0) as hype_count,
  coalesce(r.cnt, 0) as review_count,
  coalesce(h.cnt, 0) * 3 + coalesce(r.cnt, 0) * 2 + p.download_count as popularity
from projects p
join profiles pr on pr.id = p.owner_id
left join (select project_id, count(*)::int as cnt from hypes group by project_id) h on h.project_id = p.id
left join (select project_id, count(*)::int as cnt from reviews group by project_id) r on r.project_id = p.id;
