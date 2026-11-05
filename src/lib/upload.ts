import "server-only";
import { db } from "@/lib/supabase/server";

const MAX = 3 * 1024 * 1024; // 3MB (버킷 file_size_limit 과 같다)
const EXT: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif" };

// 폼의 thumbnail_file 을 Storage(thumbnails 버킷)에 올리고 공개 URL 을 돌려준다.
// 파일이 없으면 {}, 형식·용량·업로드 실패면 { error }.
export async function uploadThumbnail(formData: FormData, userId: string): Promise<{ url?: string; error?: string }> {
  const file = formData.get("thumbnail_file");
  if (!(file instanceof File) || file.size === 0) return {};
  const ext = EXT[file.type];
  if (!ext || file.size > MAX) return { error: "image" };

  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await db.storage.from("thumbnails").upload(path, file, { contentType: file.type });
  if (error) return { error: "upload" };
  return { url: db.storage.from("thumbnails").getPublicUrl(path).data.publicUrl };
}

const MD_MAX = 1024 * 1024; // 1MB (files 버킷 file_size_limit 과 같다)

// 첨부 MD 파일 처리. 반환값을 그대로 insert/update 에 펼쳐 넣는다.
//  - 새 파일: { md_url, md_name } · 지우기 체크: { md_url: null, md_name: null } · 변화 없음: {} · 실패: { error }
export async function handleMarkdown(formData: FormData, userId: string): Promise<{ md_url?: string | null; md_name?: string | null; error?: string }> {
  const file = formData.get("md_file");
  if (!(file instanceof File) || file.size === 0) {
    return formData.get("md_remove") ? { md_url: null, md_name: null } : {};
  }
  if (!/\.(md|markdown)$/i.test(file.name) || file.size > MD_MAX) return { error: "md" };

  const path = `${userId}/${crypto.randomUUID()}.md`;
  const { error } = await db.storage.from("files").upload(path, file, { contentType: "text/markdown" });
  if (error) return { error: "upload" };
  return { md_url: db.storage.from("files").getPublicUrl(path).data.publicUrl, md_name: file.name.slice(0, 100) };
}
