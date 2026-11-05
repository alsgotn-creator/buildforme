-- 0007: 프로젝트 첨부 MD 파일 (프롬프트·가이드·README 등). 방문자가 미리보기·다운로드·복사할 수 있다.
alter table projects add column if not exists md_url  text;
alter table projects add column if not exists md_name text check (char_length(md_name) <= 100);

-- 첨부 파일용 공개 버킷 (읽기 공개, 쓰기는 서버의 secret key 로만). 1MB, 마크다운/텍스트만.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('files', 'files', true, 1048576, array['text/markdown', 'text/plain'])
on conflict (id) do nothing;
