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
