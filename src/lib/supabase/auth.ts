import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// 로그인 세션(쿠키) 전용 클라이언트. DB 접근은 server.ts 의 db 를 쓴다.
export async function createAuthClient() {
  const store = await cookies();
  return createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
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
