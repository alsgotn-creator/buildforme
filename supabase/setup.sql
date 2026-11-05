-- showcase 전체 DB 설정 (0001~0007 합본). Supabase > SQL Editor 에 통째로 붙여넣고 Run.
-- 여러 번 실행해도 안전하다(if not exists / or replace). 원본: supabase/migrations/*.sql

-- ==================== 0001_init.sql ====================
-- 서버 로직 전용(service role key). RLS / Trigger 사용 안 함.
-- 권한 검사(로그인 여부, 본인 글 수정 등)는 전부 서버 코드에서 한다.
-- profiles.id 는 Supabase Auth 사용자 id 와 같은 값을 서버가 넣는다(FK 없음).

create table if not exists profiles (
  id           uuid primary key,
  username     text not null unique,
  display_name text,
  avatar_url   text,
  bio          text,
  created_at   timestamptz not null default now()
);

create table if not exists projects (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references profiles(id) on delete cascade,
  title       text not null,
  tagline     text,
  description text,
  kind        text not null default 'launch' check (kind in ('launch', 'personal_tool')),
  url         text,
  repo_url    text,
  thumbnail_url text,
  tags        text[] not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now() -- 수정 시 서버가 직접 갱신
);
create index if not exists projects_owner_idx   on projects(owner_id);
create index if not exists projects_created_idx on projects(created_at desc);

-- hype: 사용자당 프로젝트 1회. 개수는 count(*) 로 집계(카운터 컬럼 없음).
create table if not exists hypes (
  user_id    uuid not null references profiles(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, project_id)
);
create index if not exists hypes_project_idx on hypes(project_id);

-- 후기: 로그인 사용자만 작성(서버에서 검사).
create table if not exists reviews (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  author_id  uuid not null references profiles(id) on delete cascade,
  rating     smallint check (rating between 1 and 5),
  body       text not null,
  created_at timestamptz not null default now()
);
create index if not exists reviews_project_idx on reviews(project_id, created_at desc);

-- ==================== 0002_category.sql ====================
-- 프로젝트 카테고리 (src/lib/categories.ts 와 key 를 맞춘다)
alter table projects
  add column if not exists category text not null default 'etc'
  check (category in ('dev', 'work', 'design', 'erp', 'game', 'ai', 'edu', 'life', 'etc'));
create index if not exists projects_category_idx on projects(category, created_at desc);


-- ==================== 0003_community.sql ====================
-- 커뮤니티 자유게시판. 권한 검사는 서버 코드에서 한다 (0001 과 동일 방침).
create table if not exists posts (
  id         uuid primary key default gen_random_uuid(),
  author_id  uuid not null references profiles(id) on delete cascade,
  topic      text not null default 'chat' check (topic in ('chat', 'question', 'feedback', 'promo')),
  title      text not null,
  body       text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists posts_created_idx on posts(created_at desc);
create index if not exists posts_topic_idx   on posts(topic, created_at desc);

create table if not exists post_comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references posts(id) on delete cascade,
  author_id  uuid not null references profiles(id) on delete cascade,
  body       text not null,
  created_at timestamptz not null default now()
);
create index if not exists post_comments_post_idx on post_comments(post_id, created_at);


-- ==================== 0004_admin_product_details.sql ====================
-- 0004: 관리자 권한, 상품(프로젝트) 상세(특징·설치방법·연락처)
-- 설계 문서: docs/DATABASE.md

-- 1) 관리자 역할. 첫 관리자는 SQL Editor 에서 직접 지정한다:
--    update profiles set role = 'admin' where username = '<내 username>';
alter table profiles
  add column if not exists role text not null default 'user' check (role in ('user', 'admin'));

-- 2) 상품 상세: 특징 목록 + 설치/사용 방법
alter table projects add column if not exists features      text[] not null default '{}';
alter table projects add column if not exists install_guide text;

-- 3) 연락받을 곳 (이메일 · 오픈채팅 · SNS 링크 등 자유 입력, 200자)
alter table projects add column if not exists contact text check (char_length(contact) <= 200);


-- ==================== 0005_reports_storage.sql ====================
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


-- ==================== 0006_project_details.sql ====================
-- 0006: 프로젝트 상세 확장 (스크린샷 슬라이드, 데모 영상, 플랫폼, 가격, 기술 스택, 버전)
alter table projects add column if not exists screenshots text[] not null default '{}'
  check (cardinality(screenshots) <= 8);                       -- 슬라이드 이미지 최대 8장
alter table projects add column if not exists video_url  text;  -- 데모 영상 (YouTube 는 임베드)
alter table projects add column if not exists platforms  text[] not null default '{}'
  check (platforms <@ array['web', 'ios', 'android', 'windows', 'mac', 'linux', 'extension']::text[]);
alter table projects add column if not exists pricing    text
  check (pricing in ('free', 'freemium', 'paid'));            -- 무료 / 부분 유료 / 유료
alter table projects add column if not exists tech_stack text[] not null default '{}';
alter table projects add column if not exists version    text check (char_length(version) <= 30);


-- ==================== 0007_markdown_file.sql ====================
-- 0007: 프로젝트 첨부 MD 파일 (프롬프트·가이드·README 등). 방문자가 미리보기·다운로드·복사할 수 있다.
alter table projects add column if not exists md_url  text;
alter table projects add column if not exists md_name text check (char_length(md_name) <= 100);

-- 첨부 파일용 공개 버킷 (읽기 공개, 쓰기는 서버의 secret key 로만). 1MB, 마크다운/텍스트만.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('files', 'files', true, 1048576, array['text/markdown', 'text/plain'])
on conflict (id) do nothing;


