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
