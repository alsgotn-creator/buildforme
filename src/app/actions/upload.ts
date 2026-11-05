"use server";

import { getUser } from "@/lib/supabase/auth";
import { db } from "@/lib/supabase/server";

const EXT: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif" };

// 슬라이드 이미지는 여러 장이라 서버를 거치지 않고 브라우저 → Storage 로 바로 올린다(요청 크기 제한 회피).
// 서버는 로그인 확인 + 형식 검사 후 1회용 서명 업로드 주소만 발급한다. 용량(3MB)은 버킷 설정이 막는다.
export async function createImageUploadUrl(contentType: string) {
  const user = await getUser();
  if (!user) return { error: "login" as const };
  const ext = EXT[contentType];
  if (!ext) return { error: "type" as const };

  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
  const bucket = db.storage.from("thumbnails");
  const { data, error } = await bucket.createSignedUploadUrl(path);
  if (error || !data) return { error: "upload" as const };
  return { signedUrl: data.signedUrl, publicUrl: bucket.getPublicUrl(path).data.publicUrl };
}
