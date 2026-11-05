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
