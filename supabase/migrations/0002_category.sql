-- 프로젝트 카테고리 (src/lib/categories.ts 와 key 를 맞춘다)
alter table projects
  add column if not exists category text not null default 'etc'
  check (category in ('dev', 'work', 'design', 'erp', 'game', 'ai', 'edu', 'life', 'etc'));
create index if not exists projects_category_idx on projects(category, created_at desc);
