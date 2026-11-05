import "server-only";
import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { db } from "@/lib/supabase/server";

// 로그인 세션(쿠키) 전용 클라이언트. DB 접근은 server.ts 의 db 를 쓴다.
export async function createAuthClient() {
  const store = await cookies();
  return createServerClient(
    process.env.SUPABASE_URL ?? "http://localhost:54321",
    process.env.SUPABASE_PUBLISHABLE_KEY ?? "missing",
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll: (list) => {
          // Server Component 에서는 쿠키 쓰기가 막혀 있어 무시한다. (shortcut: 토큰 자동 갱신 proxy 없음, 세션 만료 이슈 생기면 proxy.ts 추가)
          try {
            list.forEach(({ name, value, options }) => store.set(name, value, options));
          } catch {}
        },
      },
    },
  );
}

export async function getUser() {
  const { data } = await (await createAuthClient()).auth.getUser();
  return data.user;
}

// 로그인 사용자 + 역할. 권한 검사(본인 또는 관리자)에 쓴다.
export async function getViewer() {
  const user = await getUser();
  if (!user) return null;
  const { data } = await db.from("profiles").select("username,role").eq("id", user.id).maybeSingle();
  return { id: user.id, username: data?.username as string | undefined, isAdmin: data?.role === "admin" };
}

// 첫 로그인 시 프로필 생성. 이미 있으면 건드리지 않는다. 실패하면 false.
export async function ensureProfile(user: User) {
  const { data: existing } = await db.from("profiles").select("id").eq("id", user.id).maybeSingle();
  if (existing) return true;

  const meta = user.user_metadata ?? {};
  const raw = meta.user_name ?? meta.preferred_username ?? user.email?.split("@")[0] ?? "user";
  // URL 에 쓰이므로 영문 소문자·숫자·-_ 만 남긴다 (한글 이름 등은 user 로 대체)
  const base = String(raw).toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 30) || "user";
  // 중복 username 은 id 앞 6자리를 붙여 회피한다.
  const { data: taken } = await db.from("profiles").select("id").eq("username", base).maybeSingle();
  const { error } = await db.from("profiles").insert({
    id: user.id,
    username: taken ? `${base}-${user.id.slice(0, 6)}` : base,
    display_name: meta.full_name ?? meta.name ?? meta.nickname ?? null,
    avatar_url: meta.avatar_url ?? meta.picture ?? null,
  });
  return !error;
}
