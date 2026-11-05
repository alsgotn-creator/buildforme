-- 0004: 관리자 권한, 상품(프로젝트) 상세(특징·설치방법), RLS 잠금
-- 설계 문서: docs/DATABASE.md

-- 1) 관리자 역할. 첫 관리자는 SQL Editor 에서 직접 지정한다:
--    update profiles set role = 'admin' where username = '<내 username>';
alter table profiles
  add column if not exists role text not null default 'user' check (role in ('user', 'admin'));

-- 2) 상품 상세: 특징 목록 + 설치/사용 방법
alter table projects add column if not exists features      text[] not null default '{}';
alter table projects add column if not exists install_guide text;

-- 3) RLS 잠금 (방어용).
--    모든 DB 접근은 서버의 secret key 로만 하고(RLS 우회), 권한 검사는 서버 코드에서 한다.
--    정책을 하나도 만들지 않으므로 publishable key 로는 어떤 테이블도 읽고 쓸 수 없다.
alter table profiles      enable row level security;
alter table projects      enable row level security;
alter table hypes         enable row level security;
alter table reviews       enable row level security;
alter table posts         enable row level security;
alter table post_comments enable row level security;

-- 4) 연락받을 곳 (이메일 · 오픈채팅 · SNS 링크 등 자유 입력, 200자)
alter table projects add column if not exists contact text check (char_length(contact) <= 200);
