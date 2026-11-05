import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/supabase/server";

const UUID = /^[0-9a-f-]{36}$/i;

// "써보기" 클릭 = 다운로드 1회. 같은 브라우저는 하루 1번만 센다(쿠키). 그다음 서비스 주소로 보낸다.
// shortcut: 쿠키 기반이라 쿠키를 지우면 다시 셀 수 있다. 조작이 문제되면 IP·로그인 기준 중복 제거 테이블로 바꿀 것.
export async function GET(request: Request, { params }: RouteContext<"/go/[id]">) {
  const { id } = await params;
  const home = new URL("/", request.url);
  if (!UUID.test(id)) return NextResponse.redirect(home);

  const { data: p } = await db.from("projects").select("url,repo_url").eq("id", id).maybeSingle();
  const target = p?.url ?? p?.repo_url;
  // 등록 시 http(s) 만 저장하지만, 리다이렉트 직전에도 한 번 더 확인한다(open redirect 방지)
  if (!target || !/^https?:\/\//i.test(target)) return NextResponse.redirect(new URL(`/projects/${id}`, request.url));

  const store = await cookies();
  const key = `dl_${id}`;
  if (!store.get(key)) {
    await db.rpc("increment_download", { pid: id });
    store.set(key, "1", { maxAge: 60 * 60 * 24, httpOnly: true, sameSite: "lax", path: "/" });
  }
  return NextResponse.redirect(target);
}
