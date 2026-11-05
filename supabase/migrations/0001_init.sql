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